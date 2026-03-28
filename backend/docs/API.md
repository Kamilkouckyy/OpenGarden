# OpenGarden — API Reference

Swagger UI (interaktivní): `http://localhost:3000/api/docs`

---

## Obsah

- [Autentizace](#autentizace)
- [Users](#users)
- [Garden Beds](#garden-beds)
- [Tasks](#tasks)
- [Equipment](#equipment)
- [Reports](#reports)
- [Events](#events)

---

## Autentizace

> JWT autentizace je plánována. Dočasně se identity předává přes HTTP hlavičky.

| Hlavička | Popis | Povinná |
|----------|-------|---------|
| `X-User-Id` | ID přihlášeného uživatele | Ano (pro chráněné endpointy) |
| `X-User-Role` | `admin` nebo `member` | Ne (výchozí = `member`) |

---

## Users

### `GET /users`
Vrátí seznam všech uživatelů (bez hesla).

**Response 200**
```json
[
  {
    "id": 1,
    "name": "Jan Novák",
    "email": "jan@example.com",
    "role": "member",
    "createdAt": "2025-04-01T10:00:00.000Z"
  }
]
```

---

### `GET /users/:id`
Detail jednoho uživatele.

**Response 200**
```json
{
  "id": 1,
  "name": "Jan Novák",
  "email": "jan@example.com",
  "role": "member",
  "createdAt": "2025-04-01T10:00:00.000Z"
}
```

**Response 404** — uživatel nenalezen

---

### `POST /users`
Registrace nového uživatele.

**Request body**
```json
{
  "name": "Jan Novák",
  "email": "jan@example.com",
  "password": "securePassword123",
  "role": "member"
}
```

| Pole | Typ | Povinné | Validace |
|------|-----|---------|----------|
| `name` | string | Ano | max 100 znaků |
| `email` | string | Ano | validní e-mail, max 150 znaků |
| `password` | string | Ano | min 6, max 255 znaků |
| `role` | `member` \| `admin` | Ne | výchozí `member` |

**Response 201** — vrací nového uživatele (bez hesla)

---

### `PATCH /users/:id`
Částečná aktualizace uživatele.

**Headers:** `X-User-Id`

**Request body** — libovolná kombinace polí z `POST /users`

**Response 200** — aktualizovaný uživatel

---

### `DELETE /users/:id`
Smazání uživatele. Kaskádně smaže jeho tasky a reporty (DB constraint).

**Headers:** `X-User-Id`

**Response 200**

---

## Garden Beds

### `GET /garden-beds`
Seznam všech záhonů s jejich aktuálním stavem.

**Response 200**
```json
[
  {
    "id": 1,
    "label": "A1",
    "description": "Slunný záhon u plotu",
    "status": "reserved",
    "userId": 3,
    "ownerName": "Jan Novák",
    "reservedAt": "2025-04-10T08:30:00.000Z"
  },
  {
    "id": 2,
    "label": "B3",
    "description": null,
    "status": "available",
    "userId": null,
    "ownerName": null,
    "reservedAt": null
  }
]
```

---

### `GET /garden-beds/:id`
Detail záhonu.

**Response 404** — záhon nenalezen

---

### `POST /garden-beds`
Vytvoření nového záhonu. *(Admin only)*

**Headers:** `X-User-Id`, `X-User-Role: admin`

**Request body**
```json
{
  "label": "C5",
  "description": "Rohový záhon u kompostéru",
  "status": "available"
}
```

| Pole | Typ | Povinné | Validace |
|------|-----|---------|----------|
| `label` | string | Ano | max 50 znaků |
| `description` | string | Ne | — |
| `status` | `available` \| `reserved` \| `inactive` | Ne | výchozí `available` |

**Response 201**

---

### `PATCH /garden-beds/:id`
Úprava záhonu (přejmenování, změna popisu, deaktivace). *(Admin only)*

**Headers:** `X-User-Id`, `X-User-Role: admin`

**Request body** — libovolná kombinace polí z `POST /garden-beds`

**Response 200**

---

### `DELETE /garden-beds/:id`
Trvalé smazání záhonu. *(Admin only)*

**Headers:** `X-User-Id`, `X-User-Role: admin`

> **System automation:** Kaskádně smaže všechny tasky s `linkedType=plot` a `linkedId=<id>`.

**Response 200**

---

### `POST /garden-beds/:id/claim`
Gardener si nárokuje volný záhon. *(UC1)*

**Headers:** `X-User-Id`

**Podmínky:**
- záhon musí mít `status = available`
- uživatel nesmí mít jiný záhon (`max 1 záhon / uživatel`)

**Response 201** — záhon s `status: reserved` a vyplněným `ownerName`

**Response 400**
```json
{ "message": "Záhon není volný" }
{ "message": "Uživatel již má rezervovaný záhon" }
```

---

### `POST /garden-beds/:id/release`
Uvolnění záhonu — vlastník nebo Admin.

**Headers:** `X-User-Id`, `X-User-Role` (admin = může uvolnit komukoliv)

**Response 200** — záhon s `status: available`, `userId: null`, `ownerName: null`

**Response 400**
```json
{ "message": "Záhon není rezervován" }
{ "message": "Nemáte oprávnění uvolnit tento záhon" }
```

---

## Tasks

### `GET /tasks`
Seznam všech úkolů.

**Response 200**
```json
[
  {
    "id": 1,
    "title": "Weed the herbs",
    "description": "Focus on the mint bed",
    "status": "in_progress",
    "context": "Plot A1",
    "createdBy": 2,
    "assignedTo": 3,
    "createdAt": "2025-04-12T09:00:00.000Z",
    "dueDate": "2025-04-20",
    "linkedType": "plot",
    "linkedId": 1
  }
]
```

---

### `GET /tasks/:id`
Detail úkolu.

**Response 404** — úkol nenalezen

---

### `POST /tasks`
Vytvoření úkolu. *(UC2)*

**Headers:** `X-User-Id`

**Request body**
```json
{
  "title": "Weed the herbs",
  "description": "Focus on the mint bed",
  "dueDate": "2025-04-20",
  "assignedTo": 3,
  "linkedType": "plot",
  "linkedId": 1
}
```

| Pole | Typ | Povinné | Validace |
|------|-----|---------|----------|
| `title` | string | Ano | max 200 znaků |
| `description` | string | Ne | max 4000 znaků |
| `dueDate` | string | Ne | formát `YYYY-MM-DD` |
| `assignedTo` | number | Ne | ID uživatele |
| `linkedType` | `plot` \| `report` \| `event` | Ne | musí být s `linkedId` |
| `linkedId` | number | Podmíněně | povinné pokud je `linkedType` |

> **Auto-context:** `context` se generuje automaticky z linked entity:
> - `plot` → `"Plot A1"`
> - `report` → `"Report: Zlomené kolo"`
> - `event` → `"Event: Spring Bonfire"`
> - bez vazby → `"General"`

**Response 201**

**Response 400**
```json
{ "message": "linkedType a linkedId musí být vyplněny oba nebo ani jeden" }
```

---

### `PATCH /tasks/:id`
Úprava úkolu. *(Author nebo Admin)*

**Headers:** `X-User-Id`, `X-User-Role`

**Request body** — libovolná kombinace polí z `POST /tasks` + `status`

**Response 403** — pokud není autor ani admin

---

### `PATCH /tasks/:id/status`
Přepnutí stavu úkolu (toggle). *(UC6 — Author nebo Admin)*

**Headers:** `X-User-Id`, `X-User-Role`

| Aktuální stav | Po přepnutí |
|---------------|-------------|
| `open` | `done` |
| `in_progress` | `done` |
| `done` | `in_progress` |

**Response 200** — úkol s novým stavem

---

### `DELETE /tasks/:id`
Trvalé smazání úkolu. *(Author nebo Admin)*

**Headers:** `X-User-Id`, `X-User-Role`

**Response 403** — pokud není autor ani admin

---

## Equipment

### `GET /equipment`
Seznam veškerého vybavení.

**Response 200**
```json
[
  {
    "id": 1,
    "name": "Wheelbarrow",
    "description": "Velké červené kolečko v kůlně",
    "status": "ok",
    "createdBy": 2,
    "createdAt": "2025-03-15T11:00:00.000Z"
  }
]
```

---

### `GET /equipment/:id`
Detail vybavení.

---

### `POST /equipment`
Registrace nového vybavení do systému.

**Headers:** `X-User-Id`

**Request body**
```json
{
  "name": "Shared Grill",
  "description": "Velký gril u altánu",
  "status": "ok"
}
```

| Pole | Typ | Povinné | Validace |
|------|-----|---------|----------|
| `name` | string | Ano | max 100 znaků |
| `description` | string | Ne | — |
| `status` | `ok` \| `damaged` \| `under_repair` \| `retired` | Ne | výchozí `ok` |

**Response 201**

---

### `PATCH /equipment/:id`
Úprava vybavení. *(Author nebo Admin)*

**Headers:** `X-User-Id`, `X-User-Role`

> **Poznámka:** Status `ok` se nastavuje automaticky při vyřešení repair reportu — viz [System automations](#system-automations).

---

### `DELETE /equipment/:id`
Smazání vybavení. *(Author nebo Admin)*

**Headers:** `X-User-Id`, `X-User-Role`

---

## Reports

### `GET /reports`
Seznam všech hlášení.

**Response 200**
```json
[
  {
    "id": 1,
    "title": "Zlomené kolo na kolečku",
    "description": "Kolo se odlomilo při převozu kompostu.",
    "reportedBy": 3,
    "authorName": "Jan Novák",
    "equipmentId": 1,
    "context": "Equipment: Wheelbarrow",
    "status": "new",
    "createdAt": "2025-04-15T14:00:00.000Z"
  }
]
```

---

### `GET /reports/:id`
Detail hlášení.

---

### `POST /reports`
Vytvoření hlášení problému. *(UC4)*

**Headers:** `X-User-Id`

**Request body**
```json
{
  "title": "Zlomené kolo na kolečku",
  "description": "Kolo se odlomilo při převozu kompostu.",
  "equipmentId": 1,
  "context": "Equipment: Wheelbarrow"
}
```

| Pole | Typ | Povinné | Validace |
|------|-----|---------|----------|
| `title` | string | Ano | max 200 znaků |
| `description` | string | Ano | — |
| `equipmentId` | number | Ne | ID vybavení |
| `context` | string | Ne | auto-generuje se z `equipmentId` pokud není vyplněn |

> **Auto-context:** Pokud je `equipmentId` vyplněno a `context` není, nastaví se automaticky na `"Equipment: <name>"`.

**Response 201**

---

### `PATCH /reports/:id`
Úprava nebo změna stavu hlášení. *(Author nebo Admin)*

**Headers:** `X-User-Id`, `X-User-Role`

**Request body**
```json
{
  "status": "resolved"
}
```

| Pole | Typ | Povinné |
|------|-----|---------|
| `title` | string | Ne |
| `description` | string | Ne |
| `status` | `new` \| `in_progress` \| `resolved` | Ne |
| `context` | string | Ne |

> **System automations při `status → resolved`:**
> 1. Všechny tasky s `linkedType=report` a `linkedId=<id>` → `status: done`
> 2. Pokud je `equipmentId` vyplněno → equipment `status: ok`

**Response 200** — aktualizované hlášení

**Response 403** — pokud není autor ani admin

---

### `DELETE /reports/:id`
Trvalé smazání hlášení. *(Author nebo Admin)*

**Headers:** `X-User-Id`, `X-User-Role`

---

## Events

### `GET /events`
Seznam všech komunitních akcí.

**Response 200**
```json
[
  {
    "id": 1,
    "title": "Spring Bonfire",
    "description": "Společné opékání a úklid zahrady",
    "eventDate": "2025-05-10T17:00:00.000Z",
    "status": "active",
    "createdBy": 2,
    "createdAt": "2025-04-01T09:00:00.000Z"
  }
]
```

---

### `GET /events/:id`
Detail akce.

---

### `POST /events`
Vytvoření komunitní akce.

**Headers:** `X-User-Id`

**Request body**
```json
{
  "title": "Spring Bonfire",
  "description": "Společné opékání a úklid zahrady",
  "eventDate": "2025-05-10T17:00:00.000Z"
}
```

| Pole | Typ | Povinné | Validace |
|------|-----|---------|----------|
| `title` | string | Ano | max 200 znaků |
| `description` | string | Ne | — |
| `eventDate` | string | Ano | ISO 8601, nesmí být v minulosti |

**Response 201**

**Response 400**
```json
{ "message": "Datum akce nemůže být v minulosti" }
```

---

### `PATCH /events/:id`
Úprava akce. *(Author nebo Admin)*

**Headers:** `X-User-Id`, `X-User-Role`

**Request body** — libovolná kombinace polí z `POST /events`

---

### `PATCH /events/:id/cancel`
Zrušení akce. *(Author nebo Admin)*

**Headers:** `X-User-Id`, `X-User-Role`

> Nastaví `status: cancelled`. Linked tasky s `linkedType=event` jsou připraveny ke skrytí (TODO: visibility field).

**Response 400**
```json
{ "message": "Akce je již zrušena" }
```

---

### `PATCH /events/:id/restore`
Obnovení zrušené akce. *(Author nebo Admin)*

**Headers:** `X-User-Id`, `X-User-Role`

**Response 400**
```json
{ "message": "Akce již je aktivní" }
```

---

### `DELETE /events/:id`
Trvalé smazání akce. *(Author nebo Admin)*

**Headers:** `X-User-Id`, `X-User-Role`

> Kaskádně smaže všechny záznamy `event_participations`.

---

### `GET /events/:id/participations`
Přehled všech RSVP záznamů pro danou akci.

**Response 200**
```json
[
  { "id": 1, "eventId": 1, "userId": 3, "status": "going", "updatedAt": "2025-04-20T10:00:00.000Z" },
  { "id": 2, "eventId": 1, "userId": 5, "status": "maybe", "updatedAt": "2025-04-21T08:00:00.000Z" }
]
```

---

### `PUT /events/:id/participation`
Nastavení nebo aktualizace RSVP statusu. *(UC5)*

**Headers:** `X-User-Id`

**Request body**
```json
{
  "status": "going"
}
```

| Hodnota | Popis |
|---------|-------|
| `going` | Zúčastním se |
| `maybe` | Možná se zúčastním |
| `not_going` | Nezúčastním se |

> Upsert — pokud záznam existuje, aktualizuje se. Pokud ne, vytvoří se nový.

**Response 200** — aktuální záznam účasti

**Response 400**
```json
{ "message": "Na zrušenou akci nelze nastavit účast" }
```

---

## System automations

Automatické akce prováděné systémem bez zásahu uživatele (implementováno v servisní vrstvě).

| Trigger | Akce |
|---------|------|
| `PATCH /reports/:id` → `status: resolved` | Všechny linked tasky (`linkedType=report`) → `status: done` |
| `PATCH /reports/:id` → `status: resolved` + report má `equipmentId` | Equipment → `status: ok` |
| `DELETE /garden-beds/:id` | Všechny tasky s `linkedType=plot, linkedId=<id>` smazány |
| `DELETE /events/:id` | Všechny `event_participations` smazány (DB cascade) |
| `PATCH /events/:id/cancel` | Linked tasky připraveny ke skrytí *(visibility field – TODO)* |

---

## Chybové odpovědi

Všechny endpointy vracejí standardní NestJS error formát:

```json
{
  "statusCode": 404,
  "message": "Záhon #99 nenalezen",
  "error": "Not Found"
}
```

| HTTP kód | Situace |
|----------|---------|
| `400` | Nevalidní data nebo porušené business pravidlo |
| `403` | Operace není povolena pro danou roli / autora |
| `404` | Entita nenalezena |
| `422` | Validační chyba DTO |
