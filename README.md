# AI Bridge — Intelligent Knowledge Base Chatbot

AI-200 learning project: React + NestJS + Azure AI + RAG, deployed to Azure Container Apps.

## Status
- [x] Phase 1 — Local backend foundation (NestJS)
- [x] Phase 2 — React frontend (Vite, port 5178)
- [x] Phase 3 — Azure account and resources
- [x] Phase 4 — Azure identity (DefaultAzureCredential)
- [x] Phase 5 — Azure Key Vault
- [x] Phase 6 — Azure AI text generation (gpt-5-mini, keyless)
- [ ] Phase 7 — Embeddings

## Local setup (backend)
    cd backend
    cp .env.example .env
    npm install
    npm run start:dev

Azure access uses your developer login (no keys in code):

    az login --tenant <tenant-id>
    npm run azure:check     # verifies identity, RBAC and Key Vault access

## Local setup (frontend)
    cd frontend
    cp .env.example .env.local
    npm install
    npm run dev        # http://localhost:5178

`VITE_*` variables are public (baked into the JS bundle) — never put secrets there.

## Endpoints
| Method | Path        | Description |
|--------|-------------|-------------|
| GET    | `/health`   | Liveness check (used by Container Apps probes later) |
| POST   | `/api/chat` | `{ "message": "..." }` → `{ "answer": "...", "source": "..." }` |

## Environment variables
Backend (`backend/.env`):

| Name          | Type   | Example                 |
|---------------|--------|-------------------------|
| `NODE_ENV`    | config | `development`           |
| `PORT`        | config | `3000`                  |
| `CORS_ORIGIN` | config | `http://localhost:5178` |
| `AZURE_SUBSCRIPTION_ID` | config | `<subscription-id>` |
| `AZURE_RESOURCE_GROUP` | config | `rg-aibridge-dev` |
| `KEY_VAULT_URL` | config | `https://kv-aibridge-learn.vault.azure.net/` |
| `AZURE_OPENAI_ENDPOINT` | config | `https://aif-aibridge-learn.openai.azure.com/openai/v1` |
| `AZURE_OPENAI_DEPLOYMENT` | config | `gpt-5-mini` |

None of these are secrets. Secret values live in Key Vault.

Frontend (`frontend/.env.local`):

| Name                | Type          | Example                 |
|---------------------|---------------|-------------------------|
| `VITE_API_BASE_URL` | public config | `http://localhost:3000` |

## Azure resources
Region: **East US 2** (all resources go in this region)

| Resource | Name | Status |
|---|---|---|
| Resource Group | `rg-aibridge-dev` | ✅ Created (Phase 3) |
| Budget alert | `budget-aibridge-monthly` (US$10/month) | ✅ Created (Phase 3) |
| Key Vault (Standard, RBAC) | `kv-aibridge-learn` | ✅ Created (Phase 5) |
| Foundry resource (AIServices) | `aif-aibridge-learn` (project `proj-aibridge`) | ✅ Created (Phase 6) |
| Model deployment | `gpt-5-mini` (Global Standard, 200K TPM, retires Feb 2027) | ✅ Created (Phase 6) |

## Authentication & access
The backend uses one shared `DefaultAzureCredential` (`backend/src/azure/azure.module.ts`):
- **Local:** your Azure CLI login (`az login`)
- **Production:** the Container App's Managed Identity (Phase 14)

| Who | Role | Scope |
|---|---|---|
| Developer (you) | Key Vault Secrets Officer | `kv-aibridge-learn` |
| Container App identity | Key Vault Secrets User (read-only) | `kv-aibridge-learn` (Phase 14) |
| Container App identity | Cognitive Services OpenAI User | `aif-aibridge-learn` (Phase 14) |

The AI model is called **keyless** (Entra ID token), so no API key is stored anywhere.

Secrets in Key Vault: `demo-secret` (test only).

More resources are added here as we create them in later phases.
