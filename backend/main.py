from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AetherGuard API")

# Allow your frontend to call this backend
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

# ------------------------------------------------------------
#  Simple analyzer endpoint  →  always returns a fake result
# ------------------------------------------------------------
@app.post("/analyze/")
async def analyze_code(code: dict, user_email: str = Header("user@example.com")):
    # Simulate analysis result
    result = {
        "prediction": "secure",
        "prob_secure": 0.93,
        "prob_vulnerable": 0.07,
        "email": user_email,
    }
    return result