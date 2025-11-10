import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import numpy as np
from pathlib import Path

LABELS = ["secure", "vulnerable"]

class CodeBERTAnalyzer:
    def __init__(self, model_path: str = "microsoft/codebert-base"):
        path = Path(model_path)
        if path.exists():
            self.model = AutoModelForSequenceClassification.from_pretrained(path)
            self.tokenizer = AutoTokenizer.from_pretrained(path)
        else:
            self.model = AutoModelForSequenceClassification.from_pretrained(
                "microsoft/codebert-base", num_labels=len(LABELS)
            )
            self.tokenizer = AutoTokenizer.from_pretrained("microsoft/codebert-base")
        self.model.eval()

    def predict(self, code_text: str):
        inputs = self.tokenizer(
            code_text, truncation=True, padding="max_length", max_length=512, return_tensors="pt"
        )
        with torch.no_grad():
            logits = self.model(**inputs).logits
            probs = torch.softmax(logits, dim=1).numpy()[0]
        idx = int(np.argmax(probs))
        return {
            "prediction": LABELS[idx],
            "prob_secure": float(probs[0]),
            "prob_vulnerable": float(probs[1]),
        }
