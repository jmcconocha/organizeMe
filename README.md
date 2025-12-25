# Project Portfolio Manager

A web-based tool for organizing, tracking, and managing multiple software projects with metadata (tech stack, domain, AI tool usage, git state, PRs, activity, notes).

## ✅ Phase 1 Status: COMPLETE

**Full-stack web application with JWT authentication, project CRUD, and Docker deployment verified end-to-end.**

See [PHASE1_COMPLETION.md](PHASE1_COMPLETION.md) for detailed testing results and technical summary.

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

### Test Endpoints
```bash
# Health checks
curl http://localhost:8000/healthz
curl http://localhost:8000/readyz

# Register (create account)
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"User","password":"pass123"}'

# Login (get JWT token)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# Create project (use token from login)
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{"name":"MyProject","domain":"Web","phase":"active","complexity":"high"}'
```

## Features Implemented

### Authentication
- ✅ User registration with password hashing (bcrypt)
- ✅ Login with JWT token generation
- ✅ Token-based API authentication
- ✅ Current user endpoint with token verification

### Projects Management
- ✅ Create, read, update, delete (CRUD) projects
- ✅ Track: name, domain, phase, complexity, tags
- ✅ User-scoped projects (only see own)
- ✅ Pagination support

### Notes Management
- ✅ Create, read, update, delete notes
- ✅ Attach notes to projects
- ✅ Filter notes by project
- ✅ Timestamp tracking

### Frontend UI
- ✅ Modern React components with hooks
- ✅ Login/Register page with form validation
- ✅ Projects grid with project cards
- ✅ Create project form
- ✅ Edit/delete actions
- ✅ Token storage in localStorage
- ✅ Responsive design with CSS

### Backend API
- ✅ FastAPI with Uvicorn
- ✅ SQLAlchemy ORM with relationships
- ✅ Pydantic schema validation
- ✅ CORS middleware configured
- ✅ Health/readiness checks
- ✅ Hot reload for development

### DevOps
- ✅ Docker images for API, Worker, Frontend
- ✅ Docker Compose orchestration (4 services)
- ✅ Volume mounting for shared data
- ✅ Health checks on all services
- ✅ Environment variable configuration

## Project Structure

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
## v2 Reboot (Proposed)

See [spec/reboot.md](spec/reboot.md) for the clean-slate plan. The idea is to build a new `v2/` alongside current code, with a Docker-first setup, a consistent theme/design system, and a trimmed MVP. This keeps the current app running while we rebuild quickly and safely.

## API Endpoints

All endpoints require JWT token in Authorization header (except register/login):

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Get JWT token
- `GET /api/auth/me` - Get current user

## Clean Start

This repository is rebooting from scratch under `v2/` with a Docker-first development workflow.

Quickstart:
```bash
cd v2
docker compose -f docker-compose.v2.yml up --build
```

See [v2/README.md](v2/README.md) for details.
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
