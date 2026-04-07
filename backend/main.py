import logging
from contextlib import asynccontextmanager
from typing import Optional, Protocol

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routes import build_router


class Analyzer(Protocol):
    model_source: str

    def predict(self, code_text: str) -> dict:
        ...


analyzer: Optional[Analyzer] = None
analyzer_init_error: Optional[str] = None
logger = logging.getLogger(__name__)


def get_analyzer() -> Optional[Analyzer]:
    return analyzer


def get_analyzer_init_error() -> Optional[str]:
    return analyzer_init_error


def build_analyzer() -> Analyzer:
    if settings.model_backend == "lightweight":
        from model.lightweight_model import LightweightAnalyzer

        return LightweightAnalyzer(
            model_path=str(settings.lightweight_model_path),
            vectorizer_path=str(settings.lightweight_vectorizer_path),
        )

    if settings.model_backend == "transformer":
        from model.codebert_model import CodeBERTAnalyzer
        from services.model_store import ensure_model_dir

        model_path = ensure_model_dir()
        return CodeBERTAnalyzer(model_path=str(model_path))

    raise RuntimeError(
        f"Unsupported MODEL_BACKEND={settings.model_backend!r}. Use 'lightweight' or 'transformer'."
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    global analyzer, analyzer_init_error
    try:
        analyzer = build_analyzer()
        analyzer_init_error = None
    except Exception as exc:
        analyzer = None
        analyzer_init_error = str(exc)
        logger.exception("Analyzer initialization failed")
    yield



from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from services.rate_limit_service import limiter

app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Rate limiting middleware
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://aetherguard.vercel.app",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Secure Headers Middleware
@app.middleware("http")
async def secure_headers_middleware(request: Request, call_next):
    # Enforce request size limit (e.g., ~1MB max upload size outside of multipart forms if needed, here just basic checks if needed. We'll enforce at app level)
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 10 * 1024 * 1024:  # 10MB sanity check
        return JSONResponse(status_code=413, content={"detail": "Request too large"})
        
    response = await call_next(request)
    
    # API-safe security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    return response

# Global Exception Handler to hide internal errors from end-users
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception on {request.method} {request.url}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. This anomaly has been logged."},
    )

app.include_router(build_router(get_analyzer, get_analyzer_init_error))
