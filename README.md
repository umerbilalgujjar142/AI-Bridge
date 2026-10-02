# AI Bridge — Intelligent Knowledge Base Chatbot

AI-200 learning project: React + NestJS + Azure AI + RAG, deployed to Azure Container Apps.

## Status
- [x] Phase 1 — Local backend foundation (NestJS)
- [x] Phase 2 — React frontend (Vite, port 5178)
- [x] Phase 3 — Azure account and resources
- [x] Phase 4 — Azure identity (DefaultAzureCredential)
- [x] Phase 5 — Azure Key Vault
- [x] Phase 6 — Azure AI text generation (gpt-5-mini, keyless)
- [x] Phase 7 — Embeddings (text-embedding-3-small, 1536 dimensions)
- [x] Phase 8 — Knowledge documents, chunking and ingestion
- [x] Phase 9 — Vector database (PostgreSQL + pgvector)
- [x] Phase 10 — RAG pipeline wired into `/api/chat`
- [x] Phase 11 — Deployed to Azure Container Apps (fully keyless)

### Pending
Ranked by priority, not by order written.

| | Phase | What it adds | Why it matters |
|---|---|---|---|
| 1 | **Secure the endpoint** | `@nestjs/throttler` rate limiting; optionally an API key or Entra auth on ingress | `/api/chat` is public and unauthenticated. Anyone with the URL can spend your Azure OpenAI tokens. **The only pending item with a real cost if skipped.** |
| 2 | **Conversation history** | Multi-turn chat; rewrite follow-ups into standalone questions before retrieval | "How much sick leave?" → "What about parental leave?" fails today. Each request is independent. |
| 3 | **Azure AI Content Safety** | Filter harmful input/output, detect prompt injection | Heavily examined in AI-200. The system prompt is currently the only defence. |
| 4 | **Observability** | Application Insights, traces, token/cost dashboards | Log Analytics exists but there is no way to answer "what did today cost?" without the CLI. |
| 5 | **RAG evaluation** | A question set scored for groundedness and relevance | The honest answer to "is the chatbot actually good?" |
| 6 | **CI/CD** | GitHub Actions: build images and deploy a revision on push | Deployment is currently manual `az acr build` plus a Portal revision edit. |
| 7 | **Streaming responses** | Server-sent events so answers appear word by word | Removes the 5s silent pause. Pure UX. |

### Known limitations
- **No conversation memory.** Every request is independent; follow-up questions that depend on
  the previous turn ("what about parental leave?") have no antecedent to resolve.
- **The API is open.** No auth, no rate limit.
- **Re-ingesting is a laptop task.** The deployed identity holds `SELECT` only, by design.
- **The frontend image hard-codes the API URL.** `VITE_API_BASE_URL` is inlined at build time,
  so changing the API URL means rebuilding the web image, not just restarting it.

## Local setup (backend)
    cd backend
    cp .env.example .env
    npm install
    npm run start:dev

Azure access uses your developer login (no keys in code):

    az login --tenant <tenant-id>
    npm run azure:check       # verifies identity, RBAC and Key Vault access
    npm run embeddings:demo   # embeds sample sentences and prints similarity scores

## Knowledge base (RAG documents)
Fictional company documents live in `docs/knowledge-base/` (Bridgeway Labs / BridgeDesk).

    cd backend
    npm run chunks:preview                     # how the documents are split into chunks
    npm run db:init                            # create the pgvector table + HNSW index (safe to re-run)
    npm run ingest                             # read → chunk → embed → PostgreSQL
    npm run search -- "your question"          # top 3 most similar chunks

Chunking: one chunk per `##` section, long sections split at paragraphs (~1500 chars max),
every chunk prefixed with "Title — Section". Re-run `npm run ingest` after changing documents.

### Vector storage (Phase 9)
Chunks and their embeddings live in the `knowledge_chunks` table on Azure Database for
PostgreSQL, using the **pgvector** extension:

| Column | Type | Purpose |
|---|---|---|
| `id` | `TEXT` primary key | stable chunk id, e.g. `company-policies#3` |
| `content` | `TEXT` | the text that was embedded |
| `embedding` | `VECTOR(1536)` | the chunk as numbers |
| `embedding_model` | `TEXT` | guards against searching with a different model |

Search happens **inside the database** with pgvector's cosine distance operator
(`ORDER BY embedding <=> $1 LIMIT 3`), accelerated by an HNSW index — not by loading
every vector into Node. `npm run ingest` replaces the whole table in one transaction,
so it always mirrors `docs/knowledge-base/`.

## RAG pipeline (Phase 10)
`POST /api/chat` no longer asks the model to answer from memory. Each request runs:

1. **Embed** the question with `text-embedding-3-small`
2. **Retrieve** the 3 closest chunks from `knowledge_chunks` (pgvector, cosine distance)
3. **Filter** out chunks scoring below `0.3` — nothing left means no model call at all
4. **Generate** an answer from a prompt that contains only those chunks

The system prompt forbids outside knowledge and requires the model to say
*"I could not find that in the knowledge base."* when the context does not cover the
question. The response carries the sections it used, so every answer is traceable:

    {
      "answer": "You receive 10 days of paid sick leave per year.",
      "sources": [{ "documentId": "company-policies", "section": "Sick Leave", "score": 0.586 }],
      "grounded": true
    }

Two behaviours worth knowing:
- **Off-topic questions** ("what is the capital of France?") never reach the model — the
  score threshold stops them, which saves tokens and prevents invented answers.
- **A high score does not mean the answer exists.** "How do I reset a *customer's* password?"
  retrieves "Resetting Your Password" at 0.735, but that section only covers resetting *your
  own* password, so the model correctly refuses. Retrieval finds related text; grounding
  decides whether it actually answers the question.

## Deployment (Phase 11)
Live: **https://ca-aibridge-web.victorioushill-38a71c17.eastus2.azurecontainerapps.io**

Two Container Apps in `cae-aibridge`, both scaling to zero (expect a cold start on the
first request):

| App | Image | Port | Identity |
|---|---|---|---|
| `ca-aibridge-api` | `aibridge-api` (Node 24 Alpine, non-root) | 3000 | system-assigned |
| `ca-aibridge-web` | `aibridge-web` (nginx + Vite build) | 80 | system-assigned |

### Build and deploy
No Docker needed locally — ACR builds the images in the cloud:

    cd backend
    az acr build -r acraibridgelearn -t aibridge-api:v1 --platform linux/amd64 .

    cd ../frontend
    az acr build -r acraibridgelearn -t aibridge-web:v1 --platform linux/amd64 \
      --build-arg VITE_API_BASE_URL=https://ca-aibridge-api.victorioushill-38a71c17.eastus2.azurecontainerapps.io .

`VITE_*` variables are inlined **at build time**, so the API URL is baked into the web
image. Changing the API URL means rebuilding the frontend image, not just restarting it.

### Nothing is authenticated with a secret
| From | To | How |
|---|---|---|
| Container App | ACR | managed identity + `AcrPull` (ACR admin user is **disabled**) |
| Container App | Azure OpenAI | managed identity + `Cognitive Services OpenAI User` |
| Container App | Key Vault | managed identity + `Key Vault Secrets User` |
| Container App | PostgreSQL | **Entra token** as the password (`PG_AUTH_MODE=entra`) |

`PG_PASSWORD` does not exist in the deployment, and neither Container App stores a single
secret. `DefaultAzureCredential` needed **no code change** between laptop and cloud — it
uses your `az login` locally and the app's managed identity in Azure.

The database role is read-only:

    GRANT CONNECT ON DATABASE aibridge TO "ca-aibridge-api";
    GRANT USAGE ON SCHEMA public TO "ca-aibridge-api";
    GRANT SELECT ON knowledge_chunks TO "ca-aibridge-api";

Ingestion stays an admin task run from a laptop, so the deployed app can never write.

### Two things that are easy to get wrong
- **A consumption Container Apps environment has no fixed outbound IP** (it rotates across
  hundreds). The Postgres firewall therefore uses *"Allow public access from any Azure
  service"* — network reach only; Entra auth, TLS and the read-only role still gate access.
- **The Portal cannot create a Container App from a private ACR** when the registry's admin
  user is disabled: the app's identity does not exist yet, so neither auth option is
  selectable. `az containerapp create --registry-identity system` creates the app, its
  identity and the role assignment together.

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
| POST   | `/api/chat` | `{ "message": "..." }` → `{ "answer": "...", "sources": [...], "grounded": true }` |

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
| `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` | config | `text-embedding-3-small` |
| `PG_HOST` | config | `psql-aibridge-learn.postgres.database.azure.com` |
| `PG_PORT` | config | `5432` |
| `PG_USER` | config | `pgadmin` locally, `ca-aibridge-api` in Azure |
| `PG_AUTH_MODE` | config | `password` locally, `entra` in Azure |
| `PG_PASSWORD` | **secret** | the server admin password — local only |
| `PG_DB` | config | `aibridge` |
| `PG_SSL` | config | `true` |

`PG_PASSWORD` is the only real secret here, and it exists **only on a developer laptop**.
The deployment sets `PG_AUTH_MODE=entra`, where the managed identity's Entra token is used
in place of a password — so Joi (`env.validation.ts`) *forbids* `PG_PASSWORD` in that mode.
Everything else is configuration; access is controlled by Entra ID and RBAC, not by these
values.

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
| Model deployment (chat) | `gpt-5-mini` (Global Standard, 200K TPM, retires Feb 2027) | ✅ Created (Phase 6) |
| Model deployment (embeddings) | `text-embedding-3-small` (Global Standard, 1536 dims, retires Feb 2028) | ✅ Created (Phase 7) |
| PostgreSQL Flexible Server | `psql-aibridge-learn` (PG 18, Standard_B1ms, pgvector 0.8.2) | ✅ Created (Phase 9) |
| Container Registry | `acraibridgelearn` (Basic, admin user **disabled**) | ✅ Created (Phase 11) |
| Container Apps Environment | `cae-aibridge` | ✅ Created (Phase 11) |
| Container App (API) | `ca-aibridge-api` (NestJS, port 3000) | ✅ Created (Phase 11) |
| Container App (web) | `ca-aibridge-web` (nginx, port 80) | ✅ Created (Phase 11) |

## Authentication & access
The backend uses one shared `DefaultAzureCredential` (`backend/src/azure/azure.module.ts`):
- **Local:** your Azure CLI login (`az login`)
- **Production:** the Container App's Managed Identity (Phase 11)

| Who | Role | Scope |
|---|---|---|
| Developer (you) | Key Vault Secrets Officer | `kv-aibridge-learn` |
| Developer (you) | Microsoft Entra admin | `psql-aibridge-learn` |
| `ca-aibridge-api` identity | Key Vault Secrets User (read-only) | `kv-aibridge-learn` |
| `ca-aibridge-api` identity | Cognitive Services OpenAI User | `aif-aibridge-learn` |
| `ca-aibridge-api` identity | `AcrPull` | `acraibridgelearn` |
| `ca-aibridge-api` identity | PostgreSQL role, `SELECT` on `knowledge_chunks` | `psql-aibridge-learn` |

Every hop is keyless — Entra ID tokens, no API keys, no passwords, no registry credentials.

Secrets in Key Vault: `demo-secret` (test only).

## Cost and teardown
The subscription is **Pay-As-You-Go with the spending limit OFF**. The
`budget-aibridge-monthly` alert only sends email — it does not stop spending.

| Resource | Cost while idle |
|---|---|
| `psql-aibridge-learn` | **~$12–15/month** — billed hourly whenever running, even with zero queries |
| `acraibridgelearn` | **~$5/month** — Basic tier is a flat daily fee |
| Container Apps + environment | ~$0 — `min-replicas: 0`, consumption environment has no base charge |
| `aif-aibridge-learn` | **$0** — Global Standard deployments are pay-per-token |
| `kv-aibridge-learn` | ~$0 — per-operation, fractions of a cent |
| Log Analytics workspace | ~$0 — 5 GB/month free |

### Pausing the project
Delete the billable resources; keep the two that are free when idle and most painful to
recreate. **Do not use the Postgres "Stop" button** — storage still bills, and Azure
auto-restarts a stopped flexible server after 7 days.

    az containerapp delete -g rg-aibridge-dev -n ca-aibridge-api --yes
    az containerapp delete -g rg-aibridge-dev -n ca-aibridge-web --yes
    az containerapp env delete -g rg-aibridge-dev -n cae-aibridge --yes
    az acr delete -n acraibridgelearn -g rg-aibridge-dev --yes
    az postgres flexible-server delete -g rg-aibridge-dev -n psql-aibridge-learn --yes
    az monitor log-analytics workspace delete -g rg-aibridge-dev \
      -n workspace-rgaibridgedevOmWQ --yes --force

    az resource list -g rg-aibridge-dev -o table   # should leave only Key Vault + Foundry

Billing data lags 24–48 hours, so verify spend the next day, not immediately.

### Rebuilding after a teardown
Nothing irreplaceable is lost — the knowledge base lives in `docs/knowledge-base/` in git,
and the vector index is regenerated in about a minute.

1. `az acr create -g rg-aibridge-dev -n <acr-name> --sku Basic -l eastus2`
2. `az acr build` both images (see **Deployment**)
3. `az containerapp env create -g rg-aibridge-dev -n cae-aibridge -l eastus2`
4. `az containerapp create ... --registry-identity system --system-assigned` for both apps
5. Assign the API identity: `Cognitive Services OpenAI User`, `Key Vault Secrets User`
6. Postgres: recreate the server, enable the `VECTOR` extension, set yourself as Entra admin,
   then `pgaadauth_create_principal_with_oid(...)` with the **new** identity's object ID plus
   the three `GRANT`s
7. Postgres networking: tick *"Allow public access from any Azure service"*
8. `npm run db:init && npm run ingest`
9. Set `CORS_ORIGIN` to the new web URL, and rebuild the web image with the new API URL

Both URLs change, because a new environment means a new domain.

## Environment quirks worth remembering
- **`az extension add` fails on the dev Mac.** Homebrew `python@3.14` ships a `pyexpat`
  linked against the system `libexpat`, which lacks a symbol pip needs. Workaround (SIP
  strips `DYLD_*` from the `az` wrapper, so call the interpreter directly):

      DYLD_LIBRARY_PATH=/opt/homebrew/opt/expat/lib \
        /opt/homebrew/Cellar/azure-cli/<version>/libexec/bin/python \
        -m azure.cli extension add -n containerapp

- **Node 22's npm 10 resolves peers differently than npm 11**, which made `npm ci` fail in
  the image while succeeding locally. The backend image uses **Node 24**. If `npm ci` fails
  with "Missing: <pkg> from lock file", run `npm install --package-lock-only` first.
- **Docker is not installed locally.** Images are built in the cloud with `az acr build`.
