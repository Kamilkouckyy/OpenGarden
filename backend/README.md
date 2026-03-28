# Open Garden — Backend

NestJS backend s PostgreSQL (Docker) a Drizzle ORM.

---

## Prerekvizity

- [Node.js](https://nodejs.org/) >= 20
- [Docker](https://docs.docker.com/get-docker/) + Docker Compose

---

## Lokální vývoj — rychlý start

### 1. Nainstaluj závislosti

```bash
npm install
```

### 2. Nastav environment proměnné

```bash
cp .env.example .env
```

Defaultní hodnoty v `.env` fungují rovnou s přiloženým `docker-compose.yml` — nic měnit nemusíš.

### 3. Spusť databázi v Dockeru

```bash
npm run db:up
```

PostgreSQL poběží na `localhost:5432`, Adminer (DB GUI) na `http://localhost:8080`.

### 4. Pushni schéma do databáze

```bash
npm run db:push
```

### 5. Spusť aplikaci

```bash
npm run start:dev
```

API běží na `http://localhost:3000`.

---

## Příkazy

### Aplikace

| Příkaz | Popis |
|--------|-------|
| `npm run start:dev` | Spustí server s hot-reload |
| `npm run build` | Buildí produkční verzi |
| `npm run start:prod` | Spustí produkční build |

### Databáze

| Příkaz | Popis |
|--------|-------|
| `npm run db:up` | Spustí PostgreSQL + Adminer v Dockeru |
| `npm run db:down` | Zastaví Docker kontejnery |
| `npm run db:push` | Pushne schéma přímo do DB (vhodné pro vývoj) |
| `npm run db:generate` | Vygeneruje SQL migraci ze schématu |
| `npm run db:migrate` | Spustí vygenerované migrace |
| `npm run db:studio` | Otevře Drizzle Studio (DB GUI v prohlížeči) |

### Testy

| Příkaz | Popis |
|--------|-------|
| `npm run test` | Spustí unit testy |
| `npm run test:e2e` | Spustí e2e testy |
| `npm run test:cov` | Spustí testy s coverage reportem |

---

## Struktura projektu

```
src/
├── database/
│   ├── database.module.ts   # NestJS modul pro Drizzle připojení
│   └── schema.ts            # Definice DB tabulek
├── app.module.ts
├── app.controller.ts
├── app.service.ts
└── main.ts
drizzle.config.ts            # Konfigurace Drizzle Kit
docker-compose.yml           # PostgreSQL + Adminer
.env.example                 # Vzorové env proměnné
```

---

## Přidání nové tabulky

1. Přidej definici do `src/database/schema.ts`
2. Spusť `npm run db:push` (vývoj) nebo `npm run db:generate && npm run db:migrate` (produkce)
3. Injectni Drizzle do service pomocí tokenu `DRIZZLE`:

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../database/database.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../database/schema';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
  ) {}

  findAll() {
    return this.db.select().from(schema.users);
  }
}
```

---

## Adminer (DB GUI)

Po spuštění `npm run db:up` je dostupný na `http://localhost:8080`.

| Pole | Hodnota |
|------|---------|
| System | PostgreSQL |
| Server | postgres |
| Username | postgres |
| Password | postgres |
| Database | open_garden |
