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


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://aetherguard.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(build_router(get_analyzer, get_analyzer_init_error))
