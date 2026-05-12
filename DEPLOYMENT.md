# Nasazení OpenGarden (Deployment)

## Služby

| Služba    | Platforma | URL |
|-----------|-----------|-----|
| Databáze  | Neon PostgreSQL | (interní) |
| Backend   | Render | https://open-garden-backend.onrender.com |
| Frontend  | Vercel | (bude doplněno) |

---

## Backend (Render)

- Node.js 20, port 3000
- Build: `npm run build`
- Start: `npm run start:backend`
- Health check: `/api/docs`

### Proměnné prostředí (Environment Variables)
- `DATABASE_URL` – Neon connection string
- `NODE_ENV` – production
- `PORT` – 3000
- `CORS_ORIGINS` – URL Vercel frontendu

---

## Frontend (Vercel)

- React App
- Build: `npm run build`
- Root Directory: `frontend`

### Proměnné prostředí
- `REACT_APP_API_BASE_URL` – https://open-garden-backend.onrender.com

---

## Databáze (Neon)

- PostgreSQL s SSL (`sslmode=require`)
- Connection string uložen v Render jako `DATABASE_URL`
- Migrace se spustí automaticky při startu backendu