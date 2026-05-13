# OpenGarden Deployment

This guide deploys OpenGarden on free/low-cost managed services:

- Frontend: Vercel
- Backend: Render Web Service
- Database: Neon PostgreSQL

The backend hosts Better Auth at `/api/auth/*`. The frontend talks to the backend with cookie credentials.

## 1. Neon PostgreSQL

1. Create a Neon project at https://neon.tech.
2. Create or use the default database.
3. Copy the pooled PostgreSQL connection string.
4. Use it as `DATABASE_URL` in Render.

The value should look like:

```bash
postgresql://<user>:<password>@<host>/<database>?sslmode=require
```

Do not commit this value to git.

## 2. Render Backend

Create a new Render Web Service connected to this repository.

Recommended settings:

- Runtime: Node
- Node version: 20
- Root directory: repository root
- Build command: `npm run build:backend`
- Start command: `npm run start:backend`
- Health check path: `/api/docs`

Backend environment variables:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=<neon connection string>

BETTER_AUTH_URL=https://<render-backend-url>
BETTER_AUTH_SECRET=<long random secret>
BETTER_AUTH_TRUSTED_ORIGINS=https://<vercel-frontend-url>
CORS_ORIGINS=https://<vercel-frontend-url>

GOOGLE_CLIENT_ID=<google client id>
GOOGLE_CLIENT_SECRET=<google client secret>

MICROSOFT_CLIENT_ID=<microsoft entra app client id>
MICROSOFT_CLIENT_SECRET=<microsoft entra secret value>
MICROSOFT_TENANT_ID=common
```

Generate `BETTER_AUTH_SECRET` with one of:

```bash
openssl rand -base64 32
```

or:

```bash
npx auth secret
```

The Render start script runs migrations before starting the backend:

```bash
npm --prefix backend run db:migrate && npm --prefix backend run start:prod
```

## 3. Vercel Frontend

Create a Vercel project connected to this repository.

Recommended settings:

- Framework preset: Create React App
- Node version: 20
- Root directory: `frontend`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `build`

Frontend environment variables:

```bash
REACT_APP_API_BASE_URL=https://<render-backend-url>
```

Create React App embeds environment variables at build time. Redeploy the frontend after changing `REACT_APP_API_BASE_URL`.

Use `npm install` rather than `npm ci` for the first Vercel deployment if the lockfile was created before the Better Auth frontend dependency was added.

## 4. OAuth Provider Setup

The OAuth redirect URLs must point to the deployed backend, not to Vercel.

### Google

In Google Cloud Console:

1. Open APIs & Services > Credentials.
2. Create an OAuth Client ID for a Web Application.
3. Add this authorized redirect URI:

```text
https://<render-backend-url>/api/auth/callback/google
```

4. Copy the values into Render:

```bash
GOOGLE_CLIENT_ID=<client id>
GOOGLE_CLIENT_SECRET=<client secret>
```

### Microsoft

In Microsoft Entra admin center:

1. Open Applications > App registrations.
2. Create a new app registration.
3. Add this web redirect URI:

```text
https://<render-backend-url>/api/auth/callback/microsoft
```

4. Create a client secret in Certificates & secrets.
5. Copy the values into Render:

```bash
MICROSOFT_CLIENT_ID=<application client id>
MICROSOFT_CLIENT_SECRET=<secret value>
MICROSOFT_TENANT_ID=common
```

## 5. Admin User

OAuth users are automatically mirrored into the app `users` table as `member`.

To make an OAuth user an admin, update the app user row with the same email:

```sql
UPDATE users
SET role = 'admin'
WHERE email = '<admin-email>';
```

Run this in Neon SQL editor after the user has logged in once, or insert the admin row ahead of time.

## 6. Verification

After deploying:

1. Open the Vercel frontend URL.
2. Sign in with Google or Microsoft.
3. Confirm the user reaches the garden bed overview.
4. Check the Render logs for successful Better Auth callback handling.
5. Test a protected flow, for example reserving a free garden bed.

If login fails with a redirect mismatch, verify the provider callback URL exactly matches:

```text
https://<render-backend-url>/api/auth/callback/<provider>
```

If API calls fail with CORS or cookies, verify:

- `CORS_ORIGINS` contains the exact Vercel frontend origin.
- `BETTER_AUTH_TRUSTED_ORIGINS` contains the exact Vercel frontend origin.
- `REACT_APP_API_BASE_URL` points to the exact Render backend origin.
