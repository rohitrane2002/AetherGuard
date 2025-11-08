import os, re, json
from pathlib import Path

def read_contracts(folder):
    code_texts, labels = [], []
    base = Path(folder)
    for label in ["vulnerable", "secure"]:
        for file in (base / label).glob("*.sol"):
            text = file.read_text(encoding="utf-8")
            # remove comments and extra spaces
            text = re.sub(r"//.*|/\*[\s\S]*?\*/", "", text)
            text = re.sub(r"\s+", " ", text)
            code_texts.append(text)
            labels.append(label)
    return code_texts, labels

if __name__ == "__main__":
    X, y = read_contracts("data/raw")
    print(f"Loaded {len(X)} contracts")
    os.makedirs("data/processed", exist_ok=True)
    json.dump({"X": X, "y": y}, open("data/processed/contracts.json", "w"))
    print("Saved processed dataset to data/processed/contracts.json")
