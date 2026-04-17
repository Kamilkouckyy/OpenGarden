# OpenGarden — Frontend Integration Guide

Tento dokument popisuje, jak se FE připojí k backendu: autentizace přes JWT, správa tokenu, field mapping a konkrétní příklady volání API.

---

## Obsah

1. [Přehled auth flow](#1-přehled-auth-flow)
2. [Registrace uživatele](#2-registrace-uživatele)
3. [Přihlášení — získání JWT tokenu](#3-přihlášení--získání-jwt-tokenu)
4. [Uložení tokenu a kontextu](#4-uložení-tokenu-a-kontextu)
5. [Sdílený API klient](#5-sdílený-api-klient)
6. [Role-based access](#6-role-based-access)
7. [Field mapping — Garden Beds](#7-field-mapping--garden-beds)
8. [Field mapping — Tasks](#8-field-mapping--tasks)
9. [Field mapping — Events](#9-field-mapping--events)
10. [Chybové stavy](#10-chybové-stavy)
11. [Chráněné endpointy — přehled](#11-chráněné-endpointy--přehled)

---

## 1. Přehled auth flow

```
FE                         BE
 │                          │
 ├─ POST /auth/login ──────►│  ověří email + bcrypt heslo
 │◄─ { accessToken, user } ─┤  vrátí JWT + info o uživateli
 │                          │
 │  uloží token             │
 │                          │
 ├─ GET /garden-beds ──────►│  (veřejný endpoint, bez tokenu)
 │◄─ [{ id, label, ... }] ──┤
 │                          │
 ├─ POST /garden-beds/1/claim  (Authorization: Bearer <token>)
 │◄─ { id, status: "reserved", ownerName: "Jan" }
```

Token se posílá jako **Bearer token** v hlavičce každého chráněného requestu:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 2. Registrace uživatele

```
POST /users
Content-Type: application/json
```

```json
{
  "name": "Jan Novák",
  "email": "jan@zahrada.cz",
  "password": "heslo123",
  "role": "member"
}
```

| Pole | Typ | Povinné | Poznámka |
|------|-----|---------|----------|
| `name` | string | Ano | max 100 znaků |
| `email` | string | Ano | unikátní, validní e-mail |
| `password` | string | Ano | min 6 znaků, hashuje se bcryptem |
| `role` | `member` \| `admin` | Ne | výchozí `member` |

**Response 201** — uživatel bez hesla:
```json
{
  "id": 5,
  "name": "Jan Novák",
  "email": "jan@zahrada.cz",
  "role": "member",
  "createdAt": "2026-04-17T10:00:00.000Z"
}
```

---

## 3. Přihlášení — získání JWT tokenu

```
POST /auth/login
Content-Type: application/json
```

```json
{
  "email": "jan@zahrada.cz",
  "password": "heslo123"
}
```

**Response 201:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjUsIm5hbWUiOiJKYW4gTm92w6FrIiwiZW1haWwiOiJqYW5AemFocmFkYS5jeiIsInJvbGUiOiJtZW1iZXIiLCJpYXQiOjE3MTM1MDAwMDAsImV4cCI6MTcxNDEwNDgwMH0",
  "user": {
    "id": 5,
    "name": "Jan Novák",
    "email": "jan@zahrada.cz",
    "role": "member"
  }
}
```

**Response 401** — špatné přihlašovací údaje:
```json
{
  "statusCode": 401,
  "message": "Nesprávný email nebo heslo"
}
```

### JWT payload (obsah tokenu)

Token obsahuje tyto informace (lze dekódovat na [jwt.io](https://jwt.io)):

```json
{
  "sub": 5,
  "name": "Jan Novák",
  "email": "jan@zahrada.cz",
  "role": "member",
  "iat": 1713500000,
  "exp": 1714104800
}
```

| Pole | Popis |
|------|-------|
| `sub` | ID uživatele v DB |
| `name` | Jméno uživatele |
| `email` | Email |
| `role` | `member` nebo `admin` |
| `iat` | Issued at (Unix timestamp) |
| `exp` | Expiration (výchozí platnost **7 dní**) |

---

## 4. Uložení tokenu a kontextu

Doporučené uložení v `localStorage`:

```js
// po přihlášení
localStorage.setItem('token', data.accessToken);
localStorage.setItem('currentUser', JSON.stringify(data.user));

// při odhlášení
localStorage.removeItem('token');
localStorage.removeItem('currentUser');

// načtení při startu aplikace
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
```

> **Poznámka k bezpečnosti:** `localStorage` je dostupné JavaScriptem (XSS riziko). Pro produkci zvážit `httpOnly` cookie. Pro tento projekt je `localStorage` dostačující.

---

## 5. Sdílený API klient

Doporučená implementace sdíleného `fetch` wrapperu:

```js
// src/services/api/apiClient.js

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

function getToken() {
  return localStorage.getItem('token');
}

async function request(method, path, body) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    // token expiroval nebo je neplatný — odhlásit uživatele
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    window.location.href = '/login';
    throw new Error('Neautorizován');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  patch:  (path, body)  => request('PATCH',  path, body),
  put:    (path, body)  => request('PUT',    path, body),
  delete: (path)        => request('DELETE', path),
};
```

### Příklady použití

```js
// Login
const { accessToken, user } = await api.post('/auth/login', {
  email: 'jan@zahrada.cz',
  password: 'heslo123',
});

// Výpis záhonů (veřejné, token není nutný)
const beds = await api.get('/garden-beds');

// Rezervace záhonu (vyžaduje token)
const reserved = await api.post('/garden-beds/3/claim');

// Vytvoření úkolu (vyžaduje token)
const task = await api.post('/tasks', {
  title: 'Zalít rajčata',
  dueDate: '2026-04-30',
});
```

---

## 6. Role-based access

Backend rozlišuje dvě role. Roli uživatele dostaneš z JWT tokenu (`user.role`) nebo z odpovědi na `/auth/login`.

| Role | Hodnota v JWT | Popis |
|------|---------------|-------|
| Člen | `member` | Základní oprávnění |
| Správce | `admin` | Plná správa, může editovat vše |

### Pravidla na FE (skrývání UI prvků)

```js
const isAdmin = currentUser?.role === 'admin';

// Záhony
isAdmin          // → zobrazit tlačítka "Přidat záhon", "Upravit", "Smazat"
!isAdmin         // → skrýt admin tlačítka

// Kdo může záhon uvolnit?
const isOwner = bed.userId === currentUser?.id;
const canRelease = isOwner || isAdmin;

// Kdo může editovat/mazat úkol/event?
const isAuthor = item.createdBy === currentUser?.id;
const canEdit = isAuthor || isAdmin;
```

---

## 7. Field mapping — Garden Beds

Backend vrací tato pole. FE si je musí namapovat na svoje komponenty.

### Response z BE (`GET /garden-beds`, `GET /garden-beds/:id`)

```json
{
  "id": 1,
  "label": "A1",
  "description": "Slunný záhon u plotu",
  "status": "available",
  "userId": null,
  "ownerName": null,
  "reservedAt": null
}
```

### Mapping na UI

| BE pole | UI použití | Poznámka |
|---------|-----------|----------|
| `id` | `bed.id` | shodné |
| `label` | zobrazit jako název i kód záhonu | dříve `name` a `code` v mocku |
| `description` | `bed.description` | shodné |
| `status: "available"` | zobrazit jako "volný" | CSS třída: `available` |
| `status: "reserved"` | zobrazit jako "obsazený" | CSS třída: `reserved` |
| `status: "inactive"` | zobrazit jako "neaktivní" | CSS třída: `inactive` |
| `userId` | porovnat s `currentUser.id` → zjistit vlastnictví | dříve porovnával jméno |
| `ownerName` | zobrazit jako "Zahradník" | dříve `gardener` v mocku |
| `reservedAt` | zobrazit datum rezervace | nové pole |

### Normalizační funkce (doporučeno)

```js
const STATUS_LABEL = {
  available: 'volný',
  reserved:  'obsazený',
  inactive:  'neaktivní',
};

function normalizeBed(bed, currentUserId) {
  return {
    id:          bed.id,
    code:        bed.label,
    name:        bed.label,
    status:      STATUS_LABEL[bed.status] || bed.status,
    statusRaw:   bed.status,          // pro logiku
    gardener:    bed.ownerName,
    ownerId:     bed.userId,
    description: bed.description || '',
    reservedAt:  bed.reservedAt,
    isOwner:     bed.userId === currentUserId,
    isOccupied:  bed.status === 'reserved',
    isFree:      bed.status === 'available',
  };
}
```

### Vytvoření záhonu (pouze admin)

```js
// POST /garden-beds
await api.post('/garden-beds', {
  label: 'C5',
  description: 'Rohový záhon',
  // status: 'available' je výchozí
});
```

### Rezervace záhonu

```js
// POST /garden-beds/:id/claim  — token nutný
await api.post(`/garden-beds/${bed.id}/claim`);
// Backend sám zjistí userId z JWT tokenu
// Podmínky: záhon musí být 'available', uživatel nesmí mít jiný záhon
```

### Uvolnění záhonu

```js
// POST /garden-beds/:id/release  — token nutný
await api.post(`/garden-beds/${bed.id}/release`);
// Backend zjistí userId a role z JWT
// Vlastník může uvolnit vlastní, admin může uvolnit komukoliv
```

---

## 8. Field mapping — Tasks

### Response z BE (`GET /tasks`, `GET /tasks/:id`)

```json
{
  "id": 1,
  "title": "Zalít rajčata",
  "description": "Zalijte rajčata v záhonu A1.",
  "status": "open",
  "context": "Plot A1",
  "createdBy": 2,
  "assignedTo": 3,
  "createdAt": "2026-04-01T10:00:00.000Z",
  "dueDate": "2026-04-20",
  "linkedType": "plot",
  "linkedId": 1
}
```

### Mapping na UI

| BE pole | UI použití | Poznámka |
|---------|-----------|----------|
| `id` | `task.id` | shodné |
| `title` | `task.title` | shodné |
| `description` | `task.description` | shodné |
| `status: "open"` | zobrazit jako "otevřený" | žlutá barva |
| `status: "in_progress"` | zobrazit jako "rozpracovaný" | modrá barva |
| `status: "done"` | zobrazit jako "dokončený" | zelená barva |
| `context` | zobrazit jako "Kontext/Záhon" | dříve `assignment` v mocku |
| `dueDate` | `task.deadline` | dříve `deadline` v mocku |
| `createdBy` | porovnat s `currentUser.id` → `isAuthor` | dříve `author` (jméno) |
| `assignedTo` | ID přiřazeného uživatele | pro zobrazení jména fetch `/users/:id` |
| `linkedType` | typ provázané entity | `plot` / `report` / `event` |
| `linkedId` | ID provázané entity | |

### Normalizační funkce (doporučeno)

```js
const STATUS_LABEL = {
  open:        'otevřený',
  in_progress: 'rozpracovaný',
  done:        'dokončený',
};

const STATUS_COLOR = {
  open:        'yellow',
  in_progress: 'blue',
  done:        'green',
};

function normalizeTask(task, currentUserId) {
  return {
    ...task,
    deadline:    task.dueDate,
    assignment:  task.context,
    statusLabel: STATUS_LABEL[task.status] || task.status,
    color:       STATUS_COLOR[task.status] || 'yellow',
    isAuthor:    task.createdBy === currentUserId,
  };
}
```

### Vytvoření úkolu

```js
// POST /tasks  — token nutný
await api.post('/tasks', {
  title: 'Zalít rajčata',
  description: 'Zalijte rajčata v záhonu A1.',
  dueDate: '2026-04-30',            // YYYY-MM-DD
  assignedTo: 3,                    // ID uživatele (volitelné)
  linkedType: 'plot',               // 'plot' | 'report' | 'event' (volitelné)
  linkedId: 1,                      // ID záhonu (povinné pokud linkedType vyplněn)
});
// Backend automaticky nastaví context = "Plot A1"
// Bez linkedType/linkedId → context = "General"
```

### Toggle stavu úkolu

```js
// PATCH /tasks/:id/status  — token nutný
// Přepíná: open/in_progress → done, done → in_progress
await api.patch(`/tasks/${task.id}/status`);
// Žádné body není potřeba
```

---

## 9. Field mapping — Events

### Response z BE (`GET /events`, `GET /events/:id`)

```json
{
  "id": 1,
  "title": "Spring Bonfire",
  "description": "Společné opékání a úklid zahrady",
  "eventDate": "2026-05-10T17:00:00.000Z",
  "status": "active",
  "createdBy": 2,
  "createdAt": "2026-04-01T09:00:00.000Z"
}
```

### Mapping na UI

| BE pole | UI použití | Poznámka |
|---------|-----------|----------|
| `id` | `event.id` | shodné |
| `title` | `event.title` | shodné |
| `description` | `event.description` | shodné |
| `eventDate` | formátovat jako datum | ISO 8601 string |
| `status: "active"` | zobrazit jako "Aktivní" | zelená |
| `status: "cancelled"` | zobrazit jako "Zrušeno" | šedá/červená |
| `createdBy` | porovnat s `currentUser.id` → `isAuthor` | |

### RSVP — nastavení účasti

```js
// PUT /events/:id/participation  — token nutný
await api.put(`/events/${event.id}/participation`, {
  status: 'going',    // 'going' | 'maybe' | 'not_going'
});
// Upsert — vytvoří nebo aktualizuje záznam účasti
```

### Výpis účastníků

```js
// GET /events/:id/participations  — veřejné
const participations = await api.get(`/events/${event.id}/participations`);
// [{ id, eventId, userId, status: 'going'|'maybe'|'not_going', updatedAt }]
```

---

## 10. Chybové stavy

Každý endpoint vrací standardní NestJS error:

```json
{
  "statusCode": 403,
  "message": "Pouze autor nebo admin může upravovat úkol",
  "error": "Forbidden"
}
```

### Doporučené zpracování na FE

```js
async function apiCall() {
  try {
    const result = await api.post('/garden-beds/5/claim');
    showSuccess('Záhon byl rezervován');
  } catch (err) {
    // err.message je text z BE (např. "Záhon není volný")
    showError(err.message);
  }
}
```

### Přehled HTTP stavů

| Kód | Situace | Doporučená akce FE |
|-----|---------|-------------------|
| `400` | Nevalidní vstup nebo porušené business pravidlo | Zobrazit `err.message` uživateli |
| `401` | Chybí nebo expiroval token | Přesměrovat na přihlášení |
| `403` | Nemáš oprávnění (role / autor) | Zobrazit chybovou hlášku, skrýt tlačítko |
| `404` | Entita neexistuje | Zobrazit "Nenalezeno" stránku |
| `422` | Validační chyba DTO | Zobrazit pole-level chyby z `err.message` |

---

## 11. Chráněné endpointy — přehled

Endpointy označené 🔒 **vyžadují** `Authorization: Bearer <token>`.  
Endpointy bez 🔒 jsou veřejné (token nemusí být přítomen).

### Auth
| Metoda | Endpoint | Ochrana | Popis |
|--------|----------|---------|-------|
| `POST` | `/auth/login` | — | Přihlášení |

### Users
| Metoda | Endpoint | Ochrana | Popis |
|--------|----------|---------|-------|
| `GET` | `/users` | — | Seznam uživatelů |
| `GET` | `/users/:id` | — | Detail uživatele |
| `POST` | `/users` | — | Registrace |
| `PATCH` | `/users/:id` | 🔒 | Úprava profilu |
| `DELETE` | `/users/:id` | 🔒 | Smazání účtu |

### Garden Beds
| Metoda | Endpoint | Ochrana | Kdo může |
|--------|----------|---------|----------|
| `GET` | `/garden-beds` | — | Kdokoli |
| `GET` | `/garden-beds/:id` | — | Kdokoli |
| `POST` | `/garden-beds` | 🔒 `admin` | Pouze admin |
| `PATCH` | `/garden-beds/:id` | 🔒 `admin` | Pouze admin |
| `DELETE` | `/garden-beds/:id` | 🔒 `admin` | Pouze admin |
| `POST` | `/garden-beds/:id/claim` | 🔒 | Přihlášený uživatel |
| `POST` | `/garden-beds/:id/release` | 🔒 | Vlastník nebo admin |

### Tasks
| Metoda | Endpoint | Ochrana | Kdo může |
|--------|----------|---------|----------|
| `GET` | `/tasks` | — | Kdokoli |
| `GET` | `/tasks/:id` | — | Kdokoli |
| `POST` | `/tasks` | 🔒 | Přihlášený uživatel |
| `PATCH` | `/tasks/:id` | 🔒 | Autor nebo admin |
| `PATCH` | `/tasks/:id/status` | 🔒 | Autor nebo admin |
| `DELETE` | `/tasks/:id` | 🔒 | Autor nebo admin |

### Events
| Metoda | Endpoint | Ochrana | Kdo může |
|--------|----------|---------|----------|
| `GET` | `/events` | — | Kdokoli |
| `GET` | `/events/:id` | — | Kdokoli |
| `GET` | `/events/:id/participations` | — | Kdokoli |
| `POST` | `/events` | 🔒 | Přihlášený uživatel |
| `PATCH` | `/events/:id` | 🔒 | Autor nebo admin |
| `PATCH` | `/events/:id/cancel` | 🔒 | Autor nebo admin |
| `PATCH` | `/events/:id/restore` | 🔒 | Autor nebo admin |
| `DELETE` | `/events/:id` | 🔒 | Autor nebo admin |
| `PUT` | `/events/:id/participation` | 🔒 | Přihlášený uživatel |

### Equipment & Reports
| Metoda | Endpoint | Ochrana | Kdo může |
|--------|----------|---------|----------|
| `GET` | `/equipment` | — | Kdokoli |
| `GET` | `/equipment/:id` | — | Kdokoli |
| `POST` | `/equipment` | 🔒 | Přihlášený uživatel |
| `PATCH` | `/equipment/:id` | 🔒 | Autor nebo admin |
| `DELETE` | `/equipment/:id` | 🔒 | Autor nebo admin |
| `GET` | `/reports` | — | Kdokoli |
| `GET` | `/reports/:id` | — | Kdokoli |
| `POST` | `/reports` | 🔒 | Přihlášený uživatel |
| `PATCH` | `/reports/:id` | 🔒 | Autor nebo admin |
| `DELETE` | `/reports/:id` | 🔒 | Autor nebo admin |

---

## Interaktivní dokumentace

Swagger UI s možností testovat endpointy přímo v prohlížeči:

```
http://localhost:3000/api/docs
```

V Swagger UI klikni na **Authorize** (tlačítko vpravo nahoře), vlož token ve formátu `Bearer eyJ...` a všechny chráněné requesty budou automaticky autorizovány.
