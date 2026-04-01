from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
from sklearn.model_selection import train_test_split
import torch, json, numpy as np, os

MODEL_NAME = "microsoft/codebert-base"
LABELS = {"secure": 0, "vulnerable": 1}

# load processed dataset
data = json.load(open("backend/data/processed/contracts.json"))
X, y = np.array(data["X"]), np.array([LABELS[i] for i in data["y"]])
X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.1, random_state=42)

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

def tokenize_fn(batch):
    return tokenizer(batch, truncation=True, padding="max_length", max_length=512)

class SolidityDS(torch.utils.data.Dataset):
    def __init__(self, texts, labels):
        self.texts, self.labels = texts, labels
    def __getitem__(self, i):
        enc = tokenize_fn(self.texts[i])
        enc["labels"] = torch.tensor(self.labels[i])
        return {k: torch.tensor(v) for k, v in enc.items()}
    def __len__(self):
        return len(self.texts)

train_dataset = SolidityDS(X_train, y_train)
val_dataset = SolidityDS(X_val, y_val)

model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=2)

args = TrainingArguments(
    output_dir="backend/model/trained_model",
    logging_dir="backend/model/logs",
    per_device_train_batch_size=4,
    num_train_epochs=3,
)

trainer = Trainer(model=model, args=args,
                  train_dataset=train_dataset, eval_dataset=val_dataset,
                  tokenizer=tokenizer)

trainer.train()
model.save_pretrained("backend/model/trained_model")
tokenizer.save_pretrained("backend/model/trained_model")
print("✅ Model and tokenizer saved to backend/model/trained_model")
