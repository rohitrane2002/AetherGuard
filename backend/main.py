from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib

# --- create the FastAPI app ---
app = FastAPI(title="AetherGuard API")

# --- allow frontend to reach backend ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # or ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- load your trained model ---
# current working directory is already "backend" on Render
model = joblib.load("model/vuln_model.joblib")
vectorizer = joblib.load("model/tfidf_vectorizer.joblib")

# --- define how input should look ---
class ContractCode(BaseModel):
    code: str

# --- API route that analyzes Solidity code ---
@app.post("/analyze/")
def analyze(contract: ContractCode):
    features = vectorizer.transform([contract.code])
    prediction = model.predict(features)[0]
    prob = model.predict_proba(features)[0]
    return {
        "prediction": prediction,
        "prob_secure": round(float(prob[0]), 3),
        "prob_vulnerable": round(float(prob[1]), 3)
    }