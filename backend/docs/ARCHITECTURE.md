# OpenGarden — Architektura backendu

---

## Stack

| Vrstva | Technologie |
|--------|-------------|
| Framework | NestJS 10 (TypeScript) |
| ORM | Drizzle ORM 0.45 |
| Databáze | PostgreSQL 16 |
| Lokální DB | Docker Compose |
| Dokumentace | Swagger / OpenAPI (`@nestjs/swagger`) |
| Validace | `class-validator` + `class-transformer` |
| Konfigurace | `@nestjs/config` (`.env`) |

---

## Adresářová struktura

```
src/
├── app.module.ts                  # Root modul – importuje vše
├── main.ts                        # Bootstrap, Swagger setup, ValidationPipe
│
├── database/
│   ├── schema.ts                  # Drizzle schéma (single source of truth)
│   └── database.module.ts         # Global modul – poskytuje DRIZZLE token
│
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts        # GET/POST/PATCH/DELETE /users
│   ├── users.service.ts
│   └── dto/
│       ├── create-user.dto.ts
│       └── update-user.dto.ts
│
├── garden-beds/
│   ├── garden-beds.module.ts
│   ├── garden-beds.controller.ts  # + /claim, /release
│   ├── garden-beds.service.ts
│   └── dto/
│       ├── create-garden-bed.dto.ts
│       └── update-garden-bed.dto.ts
│
├── tasks/
│   ├── tasks.module.ts
│   ├── tasks.controller.ts        # + /status (toggle)
│   ├── tasks.service.ts           # autoCompleteLinked() pro System actor
│   └── dto/
│       ├── create-task.dto.ts
│       └── update-task.dto.ts
│
├── equipment/
│   ├── equipment.module.ts
│   ├── equipment.controller.ts
│   ├── equipment.service.ts       # markFunctional() pro System actor
│   └── dto/
│       ├── create-equipment.dto.ts
│       └── update-equipment.dto.ts
│
├── reports/
│   ├── reports.module.ts          # importuje EquipmentModule + TasksModule
│   ├── reports.controller.ts
│   ├── reports.service.ts         # orchestruje System automations
│   └── dto/
│       ├── create-report.dto.ts
│       └── update-report.dto.ts
│
└── events/
    ├── events.module.ts
    ├── events.controller.ts       # + /cancel, /restore, /participations, /participation
    ├── events.service.ts
    └── dto/
        ├── create-event.dto.ts
        ├── update-event.dto.ts
        └── update-participation.dto.ts
```

---

## Vrstvy aplikace

```
HTTP Request
     │
     ▼
┌─────────────────┐
│   Controller    │  Přijímá request, čte headery (X-User-Id, X-User-Role),
│                 │  volá Service, vrací response
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Service      │  Business logika, autorizační kontroly (Author/Admin),
│                 │  System automations, volá Drizzle ORM
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Drizzle ORM    │  Type-safe SQL query builder
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL     │  Databáze (Docker)
└─────────────────┘
```

---

## Dependency injection — DRIZZLE token

Databázové připojení se sdílí přes globální `DatabaseModule` pomocí symbolu `DRIZZLE`:

```typescript
// Jak injectovat Drizzle do libovolné service:
import { Inject } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../database/schema';

constructor(
  @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>
) {}
```

---

## Autorizační model

Autorizace je implementována v servisní vrstvě. Každá chráněná metoda dostává `userId` a `isAdmin` flag:

```typescript
async update(id: number, dto: UpdateTaskDto, userId: number, isAdmin: boolean) {
  const task = await this.findOne(id);
  if (!isAdmin && task.createdBy !== userId) {
    throw new ForbiddenException('Pouze autor nebo admin může upravovat úkol');
  }
  // ...
}
```

**Dočasný mechanismus** — `userId` a role se čtou z HTTP hlaviček `X-User-Id` a `X-User-Role`.
**Plánováno** — nahradit JWT guard dekorátory (`@UseGuards(JwtAuthGuard)`).

---

## System automations

Automatické akce jsou implementovány jako metody ve službách, volané ze `ReportsService` a `GardenBedsService`. Žádné DB triggery — vše je testovatelné na úrovni unit testů.

### Tok při vyřešení reportu

```
PATCH /reports/:id { status: "resolved" }
         │
         ▼
   ReportsService.update()
         │
         ├──► TasksService.autoCompleteLinked('report', reportId)
         │         └── UPDATE tasks SET status='done'
         │              WHERE linked_type='report' AND linked_id=reportId
         │
         └──► EquipmentService.markFunctional(equipmentId)  [pokud report.equipmentId]
                   └── UPDATE equipment SET status='ok'
                        WHERE id=equipmentId
```

### Tok při smazání záhonu

```
DELETE /garden-beds/:id
         │
         ▼
   GardenBedsService.remove()
         │
         └──► DELETE tasks WHERE linked_type='plot' AND linked_id=bedId
              DELETE garden_beds WHERE id=bedId
```

---

## Validace

Globální `ValidationPipe` v `main.ts`:

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,            // odstraní neznámé fieldy z body
  forbidNonWhitelisted: true, // hodí 400 pro neznámé fieldy
  transform: true,            // automatický casting typů
}));
```

DTO validační pravidla (příklady):

| Pole | Pravidlo |
|------|----------|
| `task.title` | max 200 znaků |
| `task.description` | max 4000 znaků |
| `task.dueDate` | ISO date string |
| `task.linkedType` + `task.linkedId` | musí být oba nebo ani jeden |
| `event.eventDate` | ISO datetime, nesmí být v minulosti |
| `user.email` | validní e-mail formát |
| `user.password` | min 6 znaků |

---

## Plánované rozšíření (TODO)

| Oblast | Popis |
|--------|-------|
| **Auth modul** | JWT přihlašení, `@UseGuards(JwtAuthGuard)`, `@CurrentUser()` dekorátor |
| **Task visibility** | Přidat `isVisible` flag pro skrytí tasků při cancel eventu |
| **Filtrace** | Query parametry pro `GET /tasks` (status, linkedType, dueDate) |
| **Hashování hesel** | `bcrypt` při vytváření a ověřování uživatelů |
| **Paginace** | `limit` + `offset` pro list endpointy |
| **Photo upload** | URL nebo S3 upload pro `reports.photoUrl` |
