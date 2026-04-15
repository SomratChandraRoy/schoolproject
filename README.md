# MedhaBangla School Project

Full production deployment documentation is available in [live.md](live.md).

## Quick Start (Development)

1. Copy env files:
   - `backend/.env.example` -> `backend/.env`
   - `frontend/medhabangla/.env.example` -> `frontend/medhabangla/.env`
2. Run Docker development stack:
   - `docker compose up --build`
3. Open apps:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8000`
   - Admin: `http://localhost:8000/admin/`

## Production (DigitalOcean)

- Use `docker-compose.prod.yml`
- Use `backend/.env` with production secrets
- Follow full instructions in [live.md](live.md)

## Important Notes

- Production backend startup auto-runs migration and static collection.
- On first production boot, it auto-creates a superuser:
  - Username: `bipulroy`
  - Password: `Bipul10000$`
- Change this password immediately after first login.
