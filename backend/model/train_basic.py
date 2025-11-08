import json, joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from pathlib import Path

# Load data
data = json.load(open("data/processed/contracts.json"))
X, y = data["X"], data["y"]

# Split for quick test
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.5, random_state=42)

# Convert text to numerical vectors
vectorizer = TfidfVectorizer(max_features=1000, token_pattern=r"(?u)\b\w+\b")
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# Train model
model = LogisticRegression(max_iter=200)
model.fit(X_train_vec, y_train)

# Evaluate on tiny test set
pred = model.predict(X_test_vec)
print(classification_report(y_test, pred))

# Save artifacts
Path("backend/model").mkdir(parents=True, exist_ok=True)
joblib.dump(model, "backend/model/vuln_model.joblib")
joblib.dump(vectorizer, "backend/model/tfidf_vectorizer.joblib")
print("Model saved.")
