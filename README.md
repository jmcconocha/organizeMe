# Project Portfolio Manager

A web-based tool for organizing, tracking, and managing multiple software projects with metadata (tech stack, domain, AI tool usage, git state, PRs, activity, notes).

## Quick Start

### Prerequisites
- Docker and Docker Compose
- (Optional) Python 3.12+, Node.js 22+ for local development

### Run with Docker Compose
```bash
cp .env.example .env
docker compose up
```

Access:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### API Health Checks
```bash
curl http://localhost:8000/healthz
curl http://localhost:8000/readyz
```

## Project Structure
- `spec/` — Full specification (product, architecture, API, data model, UI, security, deployment, roadmap)
- `web/api/` — FastAPI backend, Alembic migrations, worker
- `web/ui/` — React/Vite frontend
- `docker-compose.yml` — Multi-service orchestration
- `data/` — SQLite database (shared with CLI)

## Development

### Local Setup (without Docker)

#### Backend
```bash
cd web/api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd web/ui
npm install
npm run dev
```

### Migrations
```bash
cd web/api
alembic upgrade head  # Apply pending migrations
alembic revision --autogenerate -m "Initial schema"  # Create new migration
```

## Spec
See `spec/` folder for detailed requirements:
- [Product Spec](spec/product_spec.md) — Goals, personas, success metrics
- [System Architecture](spec/system_architecture.md) — Components, data flows
- [API Spec](spec/api_spec.md) — Endpoints, DTOs, auth
- [Data Model](spec/data_model.md) — Tables, relationships, indexes
- [UI Spec](spec/ui_spec.md) — Pages, components, UX flows
- [Security](spec/security.md) — AuthN/Z, secrets, OWASP
- [Deployment](spec/deployment.md) — Docker Compose, TLS, observability
- [Roadmap](spec/roadmap.md) — Phases 1–4, acceptance criteria

## Phases (Roadmap)
- **Phase 1**: Foundations (CRUD, basic UI, local auth)
- **Phase 2**: Git Integrations (OAuth, scans, activity timeline)
- **Phase 3**: Portfolio Insights (filters, dashboards, AI tools)
- **Phase 4**: Operability (observability, backups, Postgres path)

## License
MIT (see LICENSE)
