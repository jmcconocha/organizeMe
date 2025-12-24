# Roadmap

## Phase 1 – Local Project Discovery
- Local folder scanning: detect git repos in directory tree, auto-create projects.
- Shared schema/migrations; minimal FastAPI; Projects/Notes CRUD; basic SPA pages.
- Extract metadata from repos: detect tech stack (package.json, requirements.txt, etc.), git state.
- Acceptance: Folder scan discovers repos; projects auto-populated; p95 read < 300 ms.
- Tests: Folder scanner unit tests; metadata extraction; API contract; UI components.

## Phase 2 – Portfolio Insights
- Kanban board view for projects (columns: backlog, active, completed, archived).
- Drill-down into projects with project-level kanban for phases and tasks.
- Tech/domain editor; filters; dashboards; AI tools per project.
- Manual project addition/editing; notes and activity timeline.
- Acceptance: Filter by domain/tech; kanban board functional with drag-drop; view AI tools; basic dashboard functional.
- Tests: E2E flows; kanban board interactions; performance of lists; pagination.

## Phase 3 – Operability & Scale
- Observability, backups, security hardening; Postgres migration path.
- Background re-scanning of folders; refresh triggers.
- Acceptance: Health checks/alerts/backups; worker stability; migration guide.
- Tests: Resiliency; backup/restore drills; load tests.

## Future Features
- User authentication and multi-user support (JWT/OAuth).
- GitHub OAuth integration for PR/branch visibility and activity syncing.
- Real-time GitHub webhooks for activity updates.
- RBAC and per-user permissions.
- Admin metrics and accessibility improvements (WCAG 2.2 AA).
- Non-Git providers beyond GitHub.
- Issue/task tracking integration.

## Risks & Mitigations
- SQLite write contention → single-writer + WAL; Postgres path.
- Provider rate limits → batching/backoff; caching; quotas.
- Token security → encryption, rotation, access controls.
- Schema drift between CLI/API → shared migrations and version checks.
