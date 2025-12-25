# organizeMe v2 (Clean Start)

This is a fresh reboot with zero dependency on the previous app.

## Quickstart (Docker)

```bash
cd v2
docker compose -f docker-compose.v2.yml up --build
```

- UI: http://localhost:5174
- API: http://localhost:8001

## Next
- Define exact workflows/pages you need; we’ll implement iteratively.
- Add PostgreSQL + migrations, auth, and worker queues as we grow.
