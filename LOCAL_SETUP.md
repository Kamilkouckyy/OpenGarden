# Lokální spuštění OpenGarden

## Požadavky

- Node.js 18+
- PostgreSQL běžící lokálně (nebo přes Docker)
- npm

---

## 1. Databáze

### Varianta A – Docker (doporučeno)

```bash
cd backend
npm run db:up
```

### Varianta B – vlastní PostgreSQL

Ujisti se, že máš databázi `open_garden` dostupnou na `localhost:5432`.

Přihlašovací údaje jsou v `backend/.env`:

```
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=open_garden
```

---

## 2. Schéma databáze a seed

Po spuštění DB **vždy** spusť migrace (nastaví správné tabulky a sloupce):

```bash
cd backend
npm run db:migrate
```

Poté spusť seed – vytvoří výchozího **admin** uživatele:

```bash
npm run db:seed
```

Seed je bezpečné spustit vícekrát (pokud admin již existuje, přeskočí se).

Výchozí admin přihlašovací údaje:
- **E-mail:** `admin@opengarden.cz`
- **Heslo:** `admin123`

---

## 3. Backend (NestJS) – port 3000

```bash
cd backend
npm install          # první spuštění
npm run start:dev
```

Backend běží na: http://localhost:3000  
Swagger dokumentace: http://localhost:3000/api/docs

---

## 3. Frontend (React) – port 3001

**Důležité:** Frontend musí být spuštěn na portu **3001**, ne 3000 (ten patří backendu).

```bash
cd frontend
npm install          # první spuštění
PORT=3001 npm start
```

Frontend běží na: http://localhost:3001

---

## Přihlášení

1. Otevři http://localhost:3001
2. Zaregistruj se (záložka "Registrovat") – zadej jméno, e-mail a heslo
3. Nebo použij existujícího uživatele (záložka "Přihlásit se") – stačí jen e-mail

---

## Časté problémy

### Port 3000 je obsazený

```
Error: listen EADDRINUSE: address already in use :::3000
```

Zkontroluj, co na portu běží, a ukonči to:

```bash
fuser -k 3000/tcp
```

Pak restartuj backend.

---

### Backend vrací 500 Internal Server Error

Obvyklá příčina: databáze není spuštěna nebo migrace nebyly aplikovány.

**Zkontroluj DB:**

```bash
cd backend
npm run db:up        # spustí Docker Postgres
```

**Aplikuj migrace:**

```bash
npm run db:migrate
```

---

### CORS chyba v prohlížeči

Ujisti se, že backend je spuštěn na portu **3000** a frontend na **3001**.  
CORS je nakonfigurován pro tyto dva porty v `backend/src/main.ts`.

---

### Staré schéma DB (sloupce `label`, `user_id`, `created_by`, ...)

Pokud jsi DB vytvořil/a před generováním migrací (např. přes `db:push` se starým kódem), tabulky mají staré názvy sloupců. Nejjednodušší řešení je smazat a znovu vytvořit DB:

```bash
# Zastav Docker
npm run db:down

# Spusť čistou DB a aplikuj migrace
npm run db:up
npm run db:migrate
```

---

## Struktura portů

| Služba   | Port | URL                          |
|----------|------|------------------------------|
| Backend  | 3000 | http://localhost:3000        |
| Swagger  | 3000 | http://localhost:3000/api/docs |
| Frontend | 3001 | http://localhost:3001        |
