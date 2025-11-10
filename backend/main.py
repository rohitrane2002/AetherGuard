from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from model.codebert_model import CodeBERTAnalyzer
from utils.preprocess import re, Path  # ensures preprocess module loads

app = FastAPI(title="AetherGuard API")

origins = [
    "https://aetherguard.vercel.app",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained model once at startup
analyzer = CodeBERTAnalyzer(model_path="backend/model/trained_model")

@app.post("/analyze/")
async def analyze_code(code: dict, user_email: str = Header("user@example.com")):
    source = code.get("content", "")
    result = analyzer.predict(source)
    result["email"] = user_email
    return result