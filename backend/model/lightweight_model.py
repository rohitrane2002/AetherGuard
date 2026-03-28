from pathlib import Path


LABELS = ["secure", "vulnerable"]


class LightweightAnalyzer:
    def __init__(self, model_path: str, vectorizer_path: str):
        import joblib

        self.model_path = Path(model_path)
        self.vectorizer_path = Path(vectorizer_path)
        self.model_source = f"lightweight:{self.model_path.name}"

        if not self.model_path.exists():
            raise RuntimeError(f"Lightweight model file not found at {self.model_path}")
        if not self.vectorizer_path.exists():
            raise RuntimeError(f"Lightweight vectorizer file not found at {self.vectorizer_path}")

        self.model = joblib.load(self.model_path)
        self.vectorizer = joblib.load(self.vectorizer_path)

    def predict(self, code_text: str):
        features = self.vectorizer.transform([code_text])

        if hasattr(self.model, "predict_proba"):
            raw_probs = self.model.predict_proba(features)[0]
            class_names = [str(label) for label in getattr(self.model, "classes_", LABELS)]
            prob_map = {label: float(prob) for label, prob in zip(class_names, raw_probs)}
            prob_secure = prob_map.get("secure", 0.0)
            prob_vulnerable = prob_map.get("vulnerable", 0.0)
        else:
            predicted = str(self.model.predict(features)[0])
            prob_secure = 1.0 if predicted == "secure" else 0.0
            prob_vulnerable = 1.0 if predicted == "vulnerable" else 0.0

        prediction = "secure" if prob_secure >= prob_vulnerable else "vulnerable"
        return {
            "prediction": prediction,
            "prob_secure": float(prob_secure),
            "prob_vulnerable": float(prob_vulnerable),
            "model_source": self.model_source,
        }
