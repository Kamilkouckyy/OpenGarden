# OpenGarden Better Auth — Task List

**Generated:** 2026-05-06 17:13
**Generator:** GPT-5.5 coder workflow
**Doc State:** **executing**
**Progress:** **0/5** done | ⬜ 5 remaining

---

═══════════════════════════════════════════════════════════════════
## Task #001: Better Auth backend foundation
═══════════════════════════════════════════════════════════════════

**Status:** 👀 REVIEW — čeká na user ověření
**Priority:** 🔴 HIGH
**Created:** 2026-05-06
**Updated:** 2026-05-06

### Zadání
Přidat Better Auth konfiguraci do backendu a připravit Google/Microsoft OAuth provider nastavení pro lokální i produkční běh.

### Požadavky
- [x] Přidat Better Auth dependency a Drizzle adapter.
- [x] Vytvořit backend auth konfiguraci se social providers Google a Microsoft.
- [x] Přidat Better Auth databázové tabulky do Drizzle schema.
- [x] Doplnit `.env.example` o Better Auth a OAuth proměnné.

### Kritéria dokončení (Definition of Done)
- [x] Backend build prochází → 🤖 AUTO: `npm --prefix backend run build`
- [x] Auth konfigurace existuje → 🤖 AUTO: file exists `backend/src/auth/better-auth.service.ts`
- [x] Env proměnné zdokumentované → 🤖 AUTO: read `backend/.env.example`

### Kontext
- `backend/src/auth/`
- `backend/src/database/schema.ts`
- `backend/src/main.ts`
- `backend/.env.example`

### Poznámky
> 🚫 [2026-05-06 17:21] Implementace Better Auth je blokovaná instalací balíčků. `npm install better-auth @better-auth/drizzle-adapter` i `npm install better-auth` pro frontend selhávají na `EAI_AGAIN registry.npmjs.org`; `npm ping` selhal stejně. Bez dependency nelze přidat importy a zachovat buildovatelný projekt.
> 🚫 [2026-05-09 12:01] Opakovaný pokus: `npm ping --registry=https://registry.npmjs.org/` opět selhal na `getaddrinfo EAI_AGAIN registry.npmjs.org`. Dependency stále nelze stáhnout.
> ✅ [2026-05-09 12:20] Better Auth balíčky jsou dostupné. Přidána backend konfigurace, OAuth providers, Drizzle auth tabulky a migrace.

### Report
👀 REVIEW: Better Auth backend foundation
- Implementována Better Auth konfigurace v `backend/src/auth/better-auth.service.ts`.
- Přidány auth tabulky do Drizzle schématu a vygenerována migrace.
- Doplněné OAuth env proměnné.
- DoD: 3/3 AUTO ✅, USER ověření čeká.

═══════════════════════════════════════════════════════════════════
## Task #002: Server-side session identity for API
═══════════════════════════════════════════════════════════════════

**Status:** 👀 REVIEW — čeká na user ověření
**Priority:** 🔴 HIGH
**Created:** 2026-05-06
**Updated:** 2026-05-06

### Zadání
Nahradit spoofovatelné `X-User-Id` / `X-User-Role` hlavičky server-side session identitou z Better Auth.

### Požadavky
- [x] Přidat helper/dekorátor/guard pro načtení aktuální session.
- [x] Aktualizovat doménové controllery, aby nepoužívaly klientem poslanou identitu.
- [x] Zachovat author/admin business pravidla podle existujících service metod.

### Kritéria dokončení (Definition of Done)
- [x] Backend build prochází → 🤖 AUTO: `npm --prefix backend run build`
- [x] API helper používá Better Auth session → 🤖 AUTO: read relevant auth helper
- [x] `X-User-Role` není potřeba pro protected operace → 🤖 AUTO: search controllers

### Kontext
- `backend/src/garden-beds/garden-beds.controller.ts`
- `backend/src/tasks/tasks.controller.ts`
- `backend/src/reports/reports.controller.ts`
- `backend/src/equipment/equipment.controller.ts`
- `backend/src/events/events.controller.ts`

### Poznámky
>

### Report
👀 REVIEW: Server-side session identity for API
- Přidán `BetterAuthGuard` a `CurrentUser` dekorátor.
- Doménové controllery používají session usera namísto `X-User-Id` / `X-User-Role`.
- `/users` API je chráněné a admin-only kromě `/users/me`.
- DoD: 3/3 AUTO ✅, USER ověření čeká.

═══════════════════════════════════════════════════════════════════
## Task #003: Frontend Better Auth client and social login
═══════════════════════════════════════════════════════════════════

**Status:** 👀 REVIEW — čeká na user ověření
**Priority:** 🔴 HIGH
**Created:** 2026-05-06
**Updated:** 2026-05-06

### Zadání
Nahradit provizorní login přes `/users` za Better Auth React client a tlačítka pro Google/Microsoft přihlášení.

### Požadavky
- [x] Přidat Better Auth React client.
- [x] Upravit login obrazovku na Google/Microsoft social sign-in.
- [x] Odstranit self-service výběr role admin.
- [x] Ukládat aktuální session/user podle Better Auth session endpointu.

### Kritéria dokončení (Definition of Done)
- [x] Frontend build prochází → 🤖 AUTO: `npm --prefix frontend run build`
- [x] Login nevolá `usersApi.list()` → 🤖 AUTO: read `LoginScreen.jsx`
- [x] UI obsahuje Google/Microsoft login akce → 🤖 AUTO: read `LoginScreen.jsx`

### Kontext
- `frontend/src/components/auth/LoginScreen.jsx`
- `frontend/src/context/UserContext.jsx`
- `frontend/src/services/api.js`

### Poznámky
>

### Report
👀 REVIEW: Frontend Better Auth client and social login
- Přidán `authClient`.
- Login obrazovka má Google/Microsoft OAuth akce.
- Odstraněn email-only login i volba admin role.
- DoD: 3/3 AUTO ✅, USER ověření čeká.

═══════════════════════════════════════════════════════════════════
## Task #004: Frontend API session transport
═══════════════════════════════════════════════════════════════════

**Status:** 👀 REVIEW — čeká na user ověření
**Priority:** 🟡 MEDIUM
**Created:** 2026-05-06
**Updated:** 2026-05-06

### Zadání
Upravit frontend API klienta tak, aby používal session cookies/credentials místo `X-User-*` identity.

### Požadavky
- [x] Nastavit `credentials: "include"` pro API requesty.
- [x] Odstranit generování `X-User-Id` a `X-User-Role`.
- [x] Připravit API base URL přes env proměnnou místo hardcoded localhost.

### Kritéria dokončení (Definition of Done)
- [x] Frontend build prochází → 🤖 AUTO: `npm --prefix frontend run build`
- [x] API base URL je konfigurovatelná → 🤖 AUTO: read `frontend/src/services/api.js`
- [x] Klient neposílá spoofovatelné role → 🤖 AUTO: read `frontend/src/services/api.js`

### Kontext
- `frontend/src/services/api.js`

### Poznámky
>

### Report
👀 REVIEW: Frontend API session transport
- API klient používá `credentials: "include"`.
- API base URL jde nastavit přes `REACT_APP_API_BASE_URL`.
- Odstraněno posílání spoofovatelných user/role hlaviček.
- DoD: 3/3 AUTO ✅, USER ověření čeká.

═══════════════════════════════════════════════════════════════════
## Task #005: Verification and deployment notes
═══════════════════════════════════════════════════════════════════

**Status:** 👀 REVIEW — čeká na user ověření
**Priority:** 🟡 MEDIUM
**Created:** 2026-05-06
**Updated:** 2026-05-06

### Zadání
Ověřit build/testy a doplnit dokumentaci k lokálnímu/prod OAuth nastavení.

### Požadavky
- [x] Spustit backend build/testy.
- [x] Spustit frontend build.
- [x] Doplnit setup dokumentaci s callback URL pro Google/Microsoft.
- [x] Popsat zbývající ruční kroky pro provider credentials.

### Kritéria dokončení (Definition of Done)
- [x] Backend build prochází → 🤖 AUTO: `npm --prefix backend run build`
- [x] Frontend build prochází → 🤖 AUTO: `npm --prefix frontend run build`
- [x] Dokumentace obsahuje OAuth callback URL → 🤖 AUTO: read `LOCAL_SETUP.md`

### Kontext
- `LOCAL_SETUP.md`
- `backend/.env.example`

### Poznámky
>

### Report
👀 REVIEW: Verification and deployment notes
- Backend build, frontend build a backend unit testy prošly.
- Smoke start kompilovaného backendu proběhl až po úspěšné nastartování Nest aplikace a mapování rout.
- OAuth callback URL a env proměnné jsou popsané v `LOCAL_SETUP.md`.
- DoD: 3/3 AUTO ✅, USER ověření čeká.
