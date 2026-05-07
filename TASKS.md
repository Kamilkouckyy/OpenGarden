# OpenGarden Better Auth — Task List

**Generated:** 2026-05-06 17:13
**Generator:** GPT-5.5 coder workflow
**Doc State:** **executing**
**Progress:** **0/5** done | ⬜ 5 remaining

---

═══════════════════════════════════════════════════════════════════
## Task #001: Better Auth backend foundation
═══════════════════════════════════════════════════════════════════

**Status:** 🚫 BLOCKED — čeká na dostupnost npm registry
**Priority:** 🔴 HIGH
**Created:** 2026-05-06
**Updated:** 2026-05-06

### Zadání
Přidat Better Auth konfiguraci do backendu a připravit Google/Microsoft OAuth provider nastavení pro lokální i produkční běh.

### Požadavky
- [ ] Přidat Better Auth dependency a Drizzle adapter.
- [ ] Vytvořit backend auth konfiguraci se social providers Google a Microsoft.
- [ ] Přidat Better Auth databázové tabulky do Drizzle schema.
- [ ] Doplnit `.env.example` o Better Auth a OAuth proměnné.

### Kritéria dokončení (Definition of Done)
- [ ] Backend build prochází → 🤖 AUTO: `npm --prefix backend run build`
- [ ] Auth konfigurace existuje → 🤖 AUTO: file exists `backend/src/auth/better-auth.ts`
- [ ] Env proměnné zdokumentované → 🤖 AUTO: read `backend/.env.example`

### Kontext
- `backend/src/auth/`
- `backend/src/database/schema.ts`
- `backend/src/main.ts`
- `backend/.env.example`

### Poznámky
> 🚫 [2026-05-06 17:21] Implementace Better Auth je blokovaná instalací balíčků. `npm install better-auth @better-auth/drizzle-adapter` i `npm install better-auth` pro frontend selhávají na `EAI_AGAIN registry.npmjs.org`; `npm ping` selhal stejně. Bez dependency nelze přidat importy a zachovat buildovatelný projekt.

### Report
🚫 BLOCKED: Better Auth backend foundation
- Vytvořen implementační task list v `TASKS.md`.
- Instalace dependency je blokovaná DNS/síťovou chybou vůči npm registry.
- Repo jsem nenechal rozbité neověřitelnými importy.

═══════════════════════════════════════════════════════════════════
## Task #002: Server-side session identity for API
═══════════════════════════════════════════════════════════════════

**Status:** ⬜ TODO
**Priority:** 🔴 HIGH
**Created:** 2026-05-06
**Updated:** 2026-05-06

### Zadání
Nahradit spoofovatelné `X-User-Id` / `X-User-Role` hlavičky server-side session identitou z Better Auth.

### Požadavky
- [ ] Přidat helper/dekorátor/guard pro načtení aktuální session.
- [ ] Aktualizovat doménové controllery, aby nepoužívaly klientem poslanou identitu.
- [ ] Zachovat author/admin business pravidla podle existujících service metod.

### Kritéria dokončení (Definition of Done)
- [ ] Backend build prochází → 🤖 AUTO: `npm --prefix backend run build`
- [ ] API helper používá Better Auth session → 🤖 AUTO: read relevant auth helper
- [ ] `X-User-Role` není potřeba pro protected operace → 🤖 AUTO: search controllers

### Kontext
- `backend/src/garden-beds/garden-beds.controller.ts`
- `backend/src/tasks/tasks.controller.ts`
- `backend/src/reports/reports.controller.ts`
- `backend/src/equipment/equipment.controller.ts`
- `backend/src/events/events.controller.ts`

### Poznámky
>

### Report
_Agent fills this section after processing the task._

═══════════════════════════════════════════════════════════════════
## Task #003: Frontend Better Auth client and social login
═══════════════════════════════════════════════════════════════════

**Status:** ⬜ TODO
**Priority:** 🔴 HIGH
**Created:** 2026-05-06
**Updated:** 2026-05-06

### Zadání
Nahradit provizorní login přes `/users` za Better Auth React client a tlačítka pro Google/Microsoft přihlášení.

### Požadavky
- [ ] Přidat Better Auth React client.
- [ ] Upravit login obrazovku na Google/Microsoft social sign-in.
- [ ] Odstranit self-service výběr role admin.
- [ ] Ukládat aktuální session/user podle Better Auth session endpointu.

### Kritéria dokončení (Definition of Done)
- [ ] Frontend build prochází → 🤖 AUTO: `npm --prefix frontend run build`
- [ ] Login nevolá `usersApi.list()` → 🤖 AUTO: read `LoginScreen.jsx`
- [ ] UI obsahuje Google/Microsoft login akce → 🤖 AUTO: read `LoginScreen.jsx`

### Kontext
- `frontend/src/components/auth/LoginScreen.jsx`
- `frontend/src/context/UserContext.jsx`
- `frontend/src/services/api.js`

### Poznámky
>

### Report
_Agent fills this section after processing the task._

═══════════════════════════════════════════════════════════════════
## Task #004: Frontend API session transport
═══════════════════════════════════════════════════════════════════

**Status:** ⬜ TODO
**Priority:** 🟡 MEDIUM
**Created:** 2026-05-06
**Updated:** 2026-05-06

### Zadání
Upravit frontend API klienta tak, aby používal session cookies/credentials místo `X-User-*` identity.

### Požadavky
- [ ] Nastavit `credentials: "include"` pro API requesty.
- [ ] Odstranit generování `X-User-Id` a `X-User-Role`.
- [ ] Připravit API base URL přes env proměnnou místo hardcoded localhost.

### Kritéria dokončení (Definition of Done)
- [ ] Frontend build prochází → 🤖 AUTO: `npm --prefix frontend run build`
- [ ] API base URL je konfigurovatelná → 🤖 AUTO: read `frontend/src/services/api.js`
- [ ] Klient neposílá spoofovatelné role → 🤖 AUTO: read `frontend/src/services/api.js`

### Kontext
- `frontend/src/services/api.js`

### Poznámky
>

### Report
_Agent fills this section after processing the task._

═══════════════════════════════════════════════════════════════════
## Task #005: Verification and deployment notes
═══════════════════════════════════════════════════════════════════

**Status:** ⬜ TODO
**Priority:** 🟡 MEDIUM
**Created:** 2026-05-06
**Updated:** 2026-05-06

### Zadání
Ověřit build/testy a doplnit dokumentaci k lokálnímu/prod OAuth nastavení.

### Požadavky
- [ ] Spustit backend build/testy.
- [ ] Spustit frontend build.
- [ ] Doplnit setup dokumentaci s callback URL pro Google/Microsoft.
- [ ] Popsat zbývající ruční kroky pro provider credentials.

### Kritéria dokončení (Definition of Done)
- [ ] Backend build prochází → 🤖 AUTO: `npm --prefix backend run build`
- [ ] Frontend build prochází → 🤖 AUTO: `npm --prefix frontend run build`
- [ ] Dokumentace obsahuje OAuth callback URL → 🤖 AUTO: read `LOCAL_SETUP.md`

### Kontext
- `LOCAL_SETUP.md`
- `backend/.env.example`

### Poznámky
>

### Report
_Agent fills this section after processing the task._
