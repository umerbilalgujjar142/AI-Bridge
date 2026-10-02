# AI Bridge — Intelligent Knowledge Base Chatbot

AI-200 learning project: React + NestJS + Azure AI + RAG, deployed to Azure Container Apps.

## Status
- [x] Phase 1 — Local backend foundation (NestJS)
- [ ] Phase 2 — React frontend

## Local setup (backend)
    cd backend
    cp .env.example .env
    npm install
    npm run start:dev

## Endpoints
| Method | Path        | Description |
|--------|-------------|-------------|
| GET    | `/health`   | Liveness check (used by Container Apps probes later) |
| POST   | `/api/chat` | `{ "message": "..." }` → `{ "answer": "...", "source": "..." }` |

## Environment variables
| Name          | Type   | Example                 |
|---------------|--------|-------------------------|
| `NODE_ENV`    | config | `development`           |
| `PORT`        | config | `3000`                  |
| `CORS_ORIGIN` | config | `http://localhost:5173` |

## Azure resources
_None yet — created starting in Phase 3._
