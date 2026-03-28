# AetherGuard Deployment Guide

## Backend on Render

### Start Command

```bash
cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Environment Variables

```text
APP_NAME=AetherGuard API
ENVIRONMENT=production
MODEL_BACKEND=lightweight
LIGHTWEIGHT_MODEL_PATH=/opt/render/project/src/backend/model/vuln_model.joblib
LIGHTWEIGHT_VECTORIZER_PATH=/opt/render/project/src/backend/model/tfidf_vectorizer.joblib
MODEL_DIR=/opt/render/project/src/backend/model/trained_model
MODEL_REPO_ID=your-hf-username/your-model-repo
MODEL_REVISION=main
HF_TOKEN=your_huggingface_token_if_repo_is_private
# Or use MODEL_SOURCE_URL=https://example.com/aetherguard-trained-model.zip
ALLOW_BASE_MODEL_FALLBACK=false
DATABASE_URL=your_render_postgres_url
JWT_SECRET=generate-a-long-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_FREE=price_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...
STRIPE_SUCCESS_URL=https://aetherguard.vercel.app/account?checkout=success
STRIPE_CANCEL_URL=https://aetherguard.vercel.app/pricing?checkout=cancelled
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
AI_BASE_URL=https://api.openai.com/v1
MAX_SOLIDITY_CHARS=50000
USER_RATE_LIMIT_PER_MINUTE=30
IP_RATE_LIMIT_PER_MINUTE=60
API_KEY_RATE_LIMIT_PER_MINUTE=120
```

Notes:
- `MODEL_BACKEND=lightweight` is the recommended production setting for Render Free.
- The lightweight backend uses the committed `joblib` and TF-IDF artifacts and avoids loading transformer weights into memory.
- Omit `HF_TOKEN` if the Hugging Face model repo is public.
- Configure exactly one remote model source in Render: `MODEL_REPO_ID` or `MODEL_SOURCE_URL`.
- The Hugging Face repo root must contain the transformer artifacts directly, including `config.json` and `tokenizer_config.json`.
- Keep `ALLOW_BASE_MODEL_FALLBACK=false` in production once your trained model repo is populated.
- If your Hugging Face repo is still empty and you need the backend live immediately, set `ALLOW_BASE_MODEL_FALLBACK=true` temporarily so the API boots with base CodeBERT.
- `DATABASE_URL` may be a Render Postgres URL. The backend normalizes `postgres://` automatically.
- Set a strong `JWT_SECRET` in production.
- If `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are set, checkout and webhook handling use real Stripe test mode. Otherwise the backend stays in mock billing mode.
- Set `STRIPE_PRICE_ID_PRO` and `STRIPE_PRICE_ID_ENTERPRISE` to your real Stripe test-mode recurring price IDs so webhook events map back to the correct SaaS plan.
- If `OPENAI_API_KEY` is set, `/chat` uses the configured model. Otherwise it returns the fallback assistant message.

### Database Migrations

Run migrations before or during deployment:

```bash
cd /Users/rohitrane2002/AetherGuard/backend
alembic upgrade head
```

If you run migrations from a Render shell instead of locally:

```bash
cd /opt/render/project/src/backend
alembic upgrade head
```

To create a new migration later:

```bash
cd /Users/rohitrane2002/AetherGuard/backend
alembic revision --autogenerate -m "describe change"
```

### Hugging Face Model Upload

Upload the contents of the trained model directory so the repository root contains the transformer artifacts directly:

```bash
cd /Users/rohitrane2002/AetherGuard/backend/model/trained_model
huggingface-cli login
huggingface-cli upload rohitrane2002/aetherguard-codebert . .
```

Expected files at the repo root include:
- `config.json`
- tokenizer files such as `tokenizer.json` and `tokenizer_config.json`
- weight files such as `model.safetensors` or `pytorch_model.bin`

### Model Troubleshooting On Render

If the service boots but `/health` shows `model.ready: false`, check `model.error` in the response.

Common causes:
- `MODEL_BACKEND=lightweight` but `LIGHTWEIGHT_MODEL_PATH` or `LIGHTWEIGHT_VECTORIZER_PATH` points to the wrong file.
- `MODEL_REPO_ID` points to a repo that does not exist or is private without `HF_TOKEN`.
- The Hugging Face repo exists, but the trained model files are nested in a subfolder instead of the repo root.
- `MODEL_SOURCE_URL` is not a direct `.zip` or `.tar.gz` download URL.
- `MODEL_DIR` points somewhere different from where the app has downloaded the files.

Quick verification steps:
- Open the Render service environment and confirm `MODEL_REPO_ID`, `MODEL_REVISION`, and `HF_TOKEN` are set exactly as intended.
- For Render Free, prefer `MODEL_BACKEND=lightweight` and verify the two lightweight artifact paths instead of using Hugging Face.
- Redeploy the backend and call `GET /health`.
- If `model.error` mentions the Hugging Face repo, verify the repo contents and permissions.
- If `model.error` mentions `MODEL_SOURCE_URL`, test that the URL downloads an archive directly.

## Frontend on Vercel

### Environment Variables

```text
NEXT_PUBLIC_API_BASE_URL=https://aetherguard-api.onrender.com
```

Frontend navigation uses this variable for both API calls and the API Docs link.

## Production Verification

### Health Check

```bash
curl https://aetherguard-api.onrender.com/health
```

Expected behavior:
- `status` is `ok`
- `model.ready` is `true`
- `database.connected` is `true`
- `model.source` points to the downloaded model directory, not the base model fallback

### Analyze Request

```bash
TOKEN="paste_access_token_here"

curl -X POST https://aetherguard-api.onrender.com/analyze/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content":"pragma solidity ^0.8.0; contract Vault { uint256 public total; function deposit() public payable { total += msg.value; } }"}'
```

Expected behavior:
- Response contains `prediction`
- Response contains `log_id`
- Response contains `model_source`
- Response contains `remaining_today`

### Analysis History

```bash
curl "https://aetherguard-api.onrender.com/analyses?limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

Expected behavior:
- Returns the latest stored analyses for the authenticated user
- Rows include `created_at`, probabilities, and `model_source`

### Auth

Register:

```bash
curl -X POST https://aetherguard-api.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"founder@aetherguard.dev","password":"ChangeThis123"}'
```

Login:

```bash
curl -X POST https://aetherguard-api.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"founder@aetherguard.dev","password":"ChangeThis123"}'
```

Refresh:

```bash
curl -X POST https://aetherguard-api.onrender.com/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"paste_refresh_token_here"}'
```

### Account And Billing

Authenticated account:

```bash
curl https://aetherguard-api.onrender.com/account \
  -H "Authorization: Bearer $TOKEN"
```

Mock checkout:

```bash
curl -X POST https://aetherguard-api.onrender.com/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"price_id":"price_pro_mock"}'
```

If Stripe test mode is configured, the response will include a real `checkoutUrl` and `mode: "stripe"`.

Mock Stripe webhook:

```bash
curl -X POST https://aetherguard-api.onrender.com/webhook/stripe \
  -H "Content-Type: application/json" \
  -d '{"customer_email":"founder@aetherguard.dev","price_id":"price_pro_mock","status":"active"}'
```

For real Stripe test mode, point Stripe’s webhook endpoint at:

```text
https://aetherguard-api.onrender.com/webhook/stripe
```

and subscribe to at least `checkout.session.completed`.

Recommended Stripe events:
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `customer.subscription.deleted`

### Usage And API Keys

Usage:

```bash
curl https://aetherguard-api.onrender.com/usage \
  -H "Authorization: Bearer $TOKEN"
```

Create API key:

```bash
curl -X POST https://aetherguard-api.onrender.com/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Production CLI Key"}'
```

Use API key:

```bash
AG_KEY="paste_api_key_here"

curl -X POST https://aetherguard-api.onrender.com/api/analyze \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $AG_KEY" \
  -d '{"content":"pragma solidity ^0.8.0; contract APIBank { uint256 public total; function deposit() public payable { total += msg.value; } }"}'
```

### AI Chat

```bash
curl -X POST https://aetherguard-api.onrender.com/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message":"Explain the most recent scan in simple terms and suggest one Solidity improvement."}'
```

Expected behavior:
- If `OPENAI_API_KEY` is set, the response contains an AI-generated explanation and fix guidance
- If not, the response returns the fallback assistant message

## Local Verification

### Backend

```bash
python3 -m py_compile backend/main.py backend/config.py backend/db.py backend/models.py backend/schemas.py backend/services/model_store.py backend/model/codebert_model.py
```

### Local Migrations

```bash
cd backend
./venv/bin/alembic upgrade head
```

### Frontend

```bash
cd frontend
npx tsc --noEmit
```
