# OpenGarden — Databázové schéma

PostgreSQL schéma spravované přes Drizzle ORM. Definice v `src/database/schema.ts`.

---

## Enums

| Název | Hodnoty |
|-------|---------|
| `user_role` | `member`, `admin` |
| `garden_bed_status` | `available`, `reserved`, `inactive` |
| `task_status` | `open`, `in_progress`, `done` |
| `task_linked_type` | `plot`, `report`, `event` |
| `equipment_status` | `ok`, `damaged`, `under_repair`, `retired` |
| `report_status` | `new`, `in_progress`, `resolved` |
| `event_status` | `active`, `cancelled` |
| `participation_status` | `going`, `not_going`, `maybe` |

---

## Tabulky

### `users`

| Sloupec | Typ | Nullable | Default | Popis |
|---------|-----|----------|---------|-------|
| `id` | serial PK | — | auto | Unikátní ID |
| `name` | varchar(100) | Ne | — | Zobrazované jméno |
| `email` | varchar(150) | Ne | — | Unikátní e-mail |
| `password` | varchar(255) | Ne | — | Hashované heslo |
| `role` | user_role | Ne | `member` | Role v systému |
| `created_at` | timestamp | Ne | now() | Datum registrace |

---

### `garden_beds`

| Sloupec | Typ | Nullable | Default | Popis |
|---------|-----|----------|---------|-------|
| `id` | serial PK | — | auto | Unikátní ID |
| `label` | varchar(50) | Ne | — | Označení záhonu (např. "A1") |
| `description` | text | Ano | null | Popis záhonu |
| `status` | garden_bed_status | Ne | `available` | Stav dostupnosti |
| `user_id` | integer FK → users | Ano | null | Vlastník záhonu |
| `owner_name` | varchar(100) | Ano | null | Cache jména vlastníka pro UI |
| `reserved_at` | timestamp | Ano | null | Datum rezervace |

**FK:** `user_id` → `users.id` ON DELETE SET NULL

---

### `tasks`

| Sloupec | Typ | Nullable | Default | Popis |
|---------|-----|----------|---------|-------|
| `id` | serial PK | — | auto | Unikátní ID |
| `title` | varchar(200) | Ne | — | Název úkolu |
| `description` | text | Ano | null | Detailní popis |
| `status` | task_status | Ne | `open` | Stav dokončení |
| `context` | varchar(100) | Ne | `General` | Auto-generovaný label kontextu |
| `created_by` | integer FK → users | Ne | — | Autor (= Author role) |
| `assigned_to` | integer FK → users | Ano | null | Přiřazený řešitel |
| `created_at` | timestamp | Ne | now() | Datum vytvoření |
| `due_date` | date | Ano | null | Termín splnění |
| `linked_type` | task_linked_type | Ano | null | Typ linked entity |
| `linked_id` | integer | Ano | null | ID linked entity (aplikační FK) |

**FK:**
- `created_by` → `users.id` ON DELETE CASCADE
- `assigned_to` → `users.id` ON DELETE SET NULL

> `linked_type` + `linked_id` tvoří flexibilní vazbu na `garden_beds`, `reports` nebo `community_events`. Jsou to aplikační FK bez DB constraintu (různé cílové tabulky).

---

### `equipment`

| Sloupec | Typ | Nullable | Default | Popis |
|---------|-----|----------|---------|-------|
| `id` | serial PK | — | auto | Unikátní ID |
| `name` | varchar(100) | Ne | — | Název vybavení |
| `description` | text | Ano | null | Popis |
| `status` | equipment_status | Ne | `ok` | Provozní stav |
| `created_by` | integer FK → users | Ano | null | Registrátor (= Author role) |
| `created_at` | timestamp | Ne | now() | Datum registrace |

**FK:** `created_by` → `users.id` ON DELETE SET NULL

---

### `reports`

| Sloupec | Typ | Nullable | Default | Popis |
|---------|-----|----------|---------|-------|
| `id` | serial PK | — | auto | Unikátní ID |
| `title` | varchar(200) | Ne | — | Stručný popis problému |
| `description` | text | Ne | — | Detailní popis |
| `reported_by` | integer FK → users | Ne | — | Autor hlášení (= Author role) |
| `author_name` | varchar(100) | Ne | — | Cache jména autora pro UI |
| `equipment_id` | integer FK → equipment | Ano | null | Linked vybavení (repair report) |
| `context` | varchar(100) | Ne | `General` | Textový kontext hlášení |
| `status` | report_status | Ne | `new` | Stav řešení |
| `created_at` | timestamp | Ne | now() | Datum vytvoření |

**FK:**
- `reported_by` → `users.id` ON DELETE CASCADE
- `equipment_id` → `equipment.id` ON DELETE SET NULL

---

### `community_events`

| Sloupec | Typ | Nullable | Default | Popis |
|---------|-----|----------|---------|-------|
| `id` | serial PK | — | auto | Unikátní ID |
| `title` | varchar(200) | Ne | — | Název akce |
| `description` | text | Ano | null | Popis akce |
| `event_date` | timestamp | Ne | — | Datum a čas konání |
| `status` | event_status | Ne | `active` | Stav akce |
| `created_by` | integer FK → users | Ne | — | Autor (= Author role) |
| `created_at` | timestamp | Ne | now() | Datum vytvoření |

**FK:** `created_by` → `users.id` ON DELETE CASCADE

---

### `event_participations`

| Sloupec | Typ | Nullable | Default | Popis |
|---------|-----|----------|---------|-------|
| `id` | serial PK | — | auto | Unikátní ID |
| `event_id` | integer FK → community_events | Ne | — | Akce |
| `user_id` | integer FK → users | Ne | — | Účastník |
| `status` | participation_status | Ne | `maybe` | RSVP stav |
| `updated_at` | timestamp | Ne | now() | Datum poslední změny |

**FK:**
- `event_id` → `community_events.id` ON DELETE CASCADE
- `user_id` → `users.id` ON DELETE CASCADE

**Unique index:** `(event_id, user_id)` — jeden záznam RSVP na kombinaci akce + uživatel

---

## Vztahy (ERD)

```
users ──< garden_beds          (userId = vlastník záhonu)
users ──< tasks                (createdBy = autor, assignedTo = řešitel)
users ──< equipment            (createdBy = registrátor)
users ──< reports              (reportedBy = autor)
users ──< community_events     (createdBy = autor)
users ──< event_participations (userId)

equipment ──< reports          (equipmentId = repair report)

garden_beds ──< tasks          (linkedType='plot', linkedId)
reports     ──< tasks          (linkedType='report', linkedId)
community_events ──< tasks     (linkedType='event', linkedId)

community_events ──< event_participations (eventId)
```

---

## Drizzle příkazy

```bash
# Pushnout schema přímo do DB (vývoj)
npm run db:push

# Vygenerovat SQL migrace
npm run db:generate

# Spustit migrace
npm run db:migrate

# Otevřít Drizzle Studio (GUI)
npm run db:studio
```
