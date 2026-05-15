# Nasazení OpenGarden (Deployment)

## Služby

| Služba   | Platforma       | URL |
| -------- | --------------- | --- |
| Databáze | Neon PostgreSQL | (interní) |
| Backend  | Render          | https://open-garden-backend.onrender.com |
| Frontend | Vercel          | https://open-garden-indol.vercel.app |

Backend hostuje Better Auth na `/api/auth/*`. Frontend komunikuje s backendem přes session cookies.

---

## 1. Neon PostgreSQL

1. Vytvoř projekt na https://neon.tech.
2. Zkopíruj pooled PostgreSQL connection string (`sslmode=require`).
3. Nastav jako `DATABASE_URL` v `backend/.env.production` nebo v Render dashboardu.

```bash
postgresql://<user>:<password>@<host>/<database>?sslmode=require
```

---

## 2. Backend (Render)

- Node.js 20
- Root directory: repository root
- Build: `npm run build:backend`
- Start: `npm run start:backend`
- Health check: `/api/docs`

### Proměnné prostředí

Produkční hodnoty bez secretů jsou v repu v `backend/.env.production`. **Google OAuth credentials nastav pouze v Render dashboardu** (nikdy do gitu).

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=<neon connection string>

BETTER_AUTH_URL=https://open-garden-backend.onrender.com
BETTER_AUTH_SECRET=<long random secret>
BETTER_AUTH_TRUSTED_ORIGINS=https://open-garden-indol.vercel.app
CORS_ORIGINS=https://open-garden-indol.vercel.app

GOOGLE_CLIENT_ID=<google client id>
GOOGLE_CLIENT_SECRET=<google client secret>

MICROSOFT_CLIENT_ID=<microsoft client id>
MICROSOFT_CLIENT_SECRET=<microsoft secret>
MICROSOFT_TENANT_ID=common
```

Start script před spuštěním backendu spustí migrace:

```bash
npm run start:backend
```

---

## 3. Frontend (Vercel)

- Framework: Create React App
- Root Directory: `frontend`
- Install: `npm install`
- Build: `npm run build`
- Output: `build`

### Proměnné prostředí

```bash
REACT_APP_API_BASE_URL=https://open-garden-backend.onrender.com
```

Po změně env proměnné frontend znovu deployni (CRA embeduje env při buildu).

---

## 4. Google OAuth

V Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web application):

**Authorized redirect URI:**

```text
https://open-garden-backend.onrender.com/api/auth/callback/google
```

Pro lokální vývoj přidej také:

```text
http://localhost:3000/api/auth/callback/google
```

---

## 5. Microsoft OAuth

V Microsoft Entra → App registrations → Web redirect URI:

```text
https://open-garden-backend.onrender.com/api/auth/callback/microsoft
```

---

## 6. Ověření

1. Otevři https://open-garden-backend.onrender.com/api/docs
2. Otevři Vercel frontend
3. Přihlas se přes Google nebo Microsoft
4. Otestuj např. rezervaci záhonu

Při chybě redirect URI ověř, že callback sedí přesně na backend URL.
