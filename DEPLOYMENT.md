# Nasazení OpenGarden (Deployment)

## Služby

| Služba    | Platforma | URL |
|-----------|-----------|-----|
| Databáze  | Neon PostgreSQL | (interní) |
| Backend   | Render | https://open-garden-backend.onrender.com |
| Frontend  | Vercel | (bude doplněno) |

---

## Backend (Render)

- Node.js 20
- Root directory: repository root
- Build: `npm run build:backend`
- Start: `npm run start:backend`
- Health check: `/api/docs`

### Proměnné prostředí (Environment Variables)

- `DATABASE_URL` - Neon connection string
- `NODE_ENV` - `production`
- `PORT` - `3000`
- `CORS_ORIGINS` - URL Vercel frontendu
- `BETTER_AUTH_URL` - URL Render backendu
- `BETTER_AUTH_SECRET` - dlouhý náhodný secret
- `BETTER_AUTH_TRUSTED_ORIGINS` - URL Vercel frontendu

Render start script spouští migrace před startem backendu:

```bash
npm run start:backend
```

---

## Frontend (Vercel)

- React App
- Build: `npm run build`
- Root Directory: `frontend`

### Proměnné prostředí

- `REACT_APP_API_BASE_URL` - https://open-garden-backend.onrender.com

---

## Databáze (Neon)

- PostgreSQL s SSL (`sslmode=require`)
- Connection string uložen v Render jako `DATABASE_URL`
- Migrace se spustí automaticky při startu backendu

---

## Ověření

1. Otevřít backend Swagger: `https://<render-backend-url>/api/docs`.
2. Otevřít Vercel frontend.
3. Zkontrolovat, že frontend volá Render backend, ne `localhost`.
4. Otestovat načtení hlavních stránek: garden beds, tasks, reports, equipment a events.
5. Pokud API volání selže na CORS, zkontrolovat `CORS_ORIGINS`, `BETTER_AUTH_TRUSTED_ORIGINS` a `REACT_APP_API_BASE_URL`.
