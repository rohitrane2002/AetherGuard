from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from model.codebert_model import CodeBERTAnalyzer
from routes import build_router
from services.model_store import ensure_model_dir


analyzer: Optional[CodeBERTAnalyzer] = None


def get_analyzer() -> Optional[CodeBERTAnalyzer]:
    return analyzer


@asynccontextmanager
async def lifespan(app: FastAPI):
    global analyzer
    model_path = ensure_model_dir()
    analyzer = CodeBERTAnalyzer(model_path=str(model_path))
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

app.include_router(build_router(get_analyzer))
