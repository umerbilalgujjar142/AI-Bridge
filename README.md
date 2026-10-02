# AI Bridge — Intelligent Knowledge Base Chatbot

AI-200 learning project: React + NestJS + Azure AI + RAG, deployed to Azure Container Apps.

## Status
- [x] Phase 1 — Local backend foundation (NestJS)
- [x] Phase 2 — React frontend (Vite, port 5178)
- [x] Phase 3 — Azure account and resources
- [ ] Phase 4 — Azure identity

## Local setup (backend)
    cd backend
    cp .env.example .env
    npm install
    npm run start:dev

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

More resources are added here as we create them in later phases.
