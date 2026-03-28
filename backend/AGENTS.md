# AGENTS.md — OpenGarden Backend

Tento dokument slouzi jako hlavni reference pro vsechny AI agenty pracujici na tomto projektu.
Obsahuje business kontext, domenovy model, pravidla a implementacni smernice.

---

## 1. Vize projektu

OpenGarden je webova aplikace pro spravu komunitnich zahrad. Cilem je centralizovat:
- rezervace zahradnich zaberek (garden beds)
- sledovani ukolu (tasks)
- hlaseni problemu se zarizenim a zahradou (reports)
- planovani komunitnich akci (events)
- evidenci sdilenych nastroju (equipment)

Aplikace nahrazuje neformalni komunikaci (skupinove chaty) transparentnim systemem s jasnou zodpovednosti.

---

## 2. Actors (role uzivatelu)

### Gardener
- Standardni clen komunitni zahrady
- Muze si narokovat jeden volny zaberek (plot) a uvolnit vlastni
- Muze vytvaret: ukoly, reporty, eventy, registrovat equipment
- Vytvořenim polozky automaticky ziska roli **Author** pro dany item

### Author (kontextova role)
- Pridelena Gardeneru pri vytvoreni konkretniho Tasku, Reportu, Equipment nebo Eventu
- Ma vyhradni pravo (spolu s Adminem) editovat, menit stav a mazat dane polozky
- Neni globalni role — plati jen pro konkretni entitu

### Admin
- Nejvyssi opravneni
- Muze vytvaret, prejmenovavat a trvale mazat garden beds (zaberky)
- Muze nasilne uvolnit zaberku od kohokoliv
- Ma Author-level prava nad VSEMI entitami v systemu (global moderator)

### System (automatizovany actor)
- Bez lidskeho zasahu provadi:
  - Synchronizace stavu equipment: pokud je repair report vyreseny → equipment se oznaci jako `functional`
  - Auto-completion tasku: pokud je linked report uzavren → linked task se automaticky dokoncuje
  - Cascade delete: smazani garden bed → smaze vsechny linked reporty a tasky
  - Task visibility: pokud je event zrusen/obnoven → ovlivni viditelnost linked tasku

---

## 3. Domenovy model (entity)

### GardenBed (zaberka)
Fyzicky kus pudy v komunitni zahrade.

| Atribut | Typ | Popis |
|---------|-----|-------|
| `id` | uuid / serial | Unikatni system ID |
| `name` | string | Zobrazovany nazev (napr. "Bed A1", "Herb Garden") |
| `status` | enum: `free` \| `occupied` | Dostupnost zaberky, rika UI co zobrazit (Claim / Release) |
| `ownerId` | FK → User \| null | ID aktualne prihlaseneho vlastnika, null pokud free |
| `ownerName` | string \| null | Cachovane jmeno vlastnika pro optimalizaci UI |

**Pravidla:**
- Gardener muze mit najednou max. 1 zaberku
- Pouze vlastnik (nebo Admin) muze zaberku uvolnit
- Smazani zaberky kaskadove smaze vsechny linked reporty a tasky

---

### Task (ukol)
Konkretni akce k provedeni v zahrade. Muze byt obecny nebo navazany na entitu.

| Atribut | Typ | Popis |
|---------|-----|-------|
| `id` | uuid / serial | Unikatni system ID |
| `title` | string (max 255) | Strucny popis ukolu |
| `description` | string (max 4000) | Volitelny detailni popis |
| `status` | enum: `in_progress` \| `completed` | Stav ukolu |
| `context` | string | Citelny label kontextu (napr. "General", "Plot A1", "Event: Spring Bonfire") |
| `dueDate` | date \| null | Termin splneni; system vizualne zvyrazni preslouzene / blizici se |
| `authorId` | FK → User | Tvorce ukolu = Author |
| `resolverId` | FK → User \| null | Prirazeny resitel |
| `linkedType` | enum: `plot` \| `report` \| `event` \| null | Typ rodice pro cascade operace |
| `linkedId` | FK \| null | ID rodice (GardenBed, Report, nebo Event) |

**Pravidla:**
- Pouze Author nebo Admin muze editovat/mazat task
- Pokud je linked report uzavren → task se auto-completes (System actor)
- Pokud je linked event zrusen → task meni viditelnost (System actor)
- Pri zadani linked entity (report/plot/event) se `context` generuje automaticky
- Prepnuti na `completed` archivuje task (vizualne preskretnuto)

---

### Report (hlaseni problemu)
Hlaseni incidentu nebo problemu v zahrade.

| Atribut | Typ | Popis |
|---------|-----|-------|
| `id` | uuid / serial | Unikatni system ID |
| `title` | string | Strucny popis problemu |
| `desc` | string | Detailni popis |
| `photoUrl` | string \| null | URL fotodukazu (volitelne) |
| `context` | string | Misto/entita (napr. "General", "Equipment", "Garden Bed: A1") |
| `status` | enum: `new` \| `in_progress` \| `resolved` | Stav reseni |
| `authorId` | FK → User | Tvorce reportu = Author |
| `authorName` | string | Cachovane jmeno pro UI |

**Pravidla:**
- Pouze Author nebo Admin muze editovat/mazat report
- Pokud je status preepnut na `resolved` a report je linked na Equipment → equipment se automaticky oznaci jako `functional`
- Uzavreni reportu auto-completes vsechny linked tasky

---

### Equipment (sdilene vybaveni)
Sdilene nastroje a zarizeni komunitni zahrady.

| Atribut | Typ | Popis |
|---------|-----|-------|
| `id` | uuid / serial | Unikatni system ID |
| `name` | string | Nazev nastroje (napr. "Wheelbarrow", "Shared Grill") |
| `status` | enum: `functional` \| `non_functional` | Provozni stav |
| `authorId` | FK → User | Kdo zarizeni zaregistroval = Author |

**Pravidla:**
- Pouze Author nebo Admin muze editovat/mazat equipment
- Pokud je linked repair report vyreseny → status se automaticky prepne na `functional` (System actor)

---

### CommunityEvent (komunitni akce)
Planovana akce nebo setkani clenu zahrady.

| Atribut | Typ | Popis |
|---------|-----|-------|
| `id` | uuid / serial | Unikatni system ID |
| `title` | string | Nazev akce (napr. "Spring Bonfire") |
| `date` | date | Datum konani akce |
| `status` | enum: `active` \| `cancelled` | Stav akce |
| `participants` | JSONB / map | `{ userId: 'going' \| 'maybe' \| 'not_going' }` |
| `authorId` | FK → User | Tvorce akce = Author |

**Pravidla:**
- Pouze Author nebo Admin muze editovat/rusit/mazat event
- Pokud date < dnes → event je archivovan (past events)
- Zruseni eventu → linked tasky meni viditelnost (System actor)
- Obnoveni zruseneho eventu → tasky se obnoví (System actor)
- Kazdy Gardener muze nastavit svuj RSVP stav (`going` / `maybe` / `not_going`)

---

## 4. Klic business use cases

### UC1: Garden Bed Reservation (Narokovani zaberky)
- **Actor:** Gardener
- **Predpodminky:** Gardener nema zadnou zaberku, existuje alespon jedna `free` zaberka
- **Happy path:**
  1. Gardener vidi dashboard se vsemi zaberkami a jejich stavy
  2. Klikne na volnou zaberku → tlacitko "Claim"
  3. System nastavi `status = occupied`, `ownerId = user.id`, `ownerName = user.name`
  4. Dashboard se aktualizuje

### UC2: Task Creation (Vytvoreni ukolu)
- **Actor:** Gardener, Admin
- **Predpodminky:** Uzivatel je autentizovany
- **Formular:**
  - `title` — povinne, max 255 znaku
  - `dueDate` — datum v budoucnosti, volitelne
  - `resolverId` — prirazeny resitel, volitelne
  - Vazba: vyber jedne z moznosti: Report | Garden Bed | Event (vzajemne se vylucuji)
  - `description` — max 4000 znaku, volitelne
- **Post-conditions:** Task vytvoren, `authorId = current user`, `status = in_progress`

### UC3: Task Panel Overview (Prehled ukolu)
- **Actor:** vsichni autentizovani uzivatele
- **Popis:** Zobrazeni vsech ukolu s filtraci (stav, kontext, termin)
- Vizualni zvyrazneni preslouzilych a blizicich se terminu

### UC4: Equipment Issue Report (Hlaseni problemu se zarizenim)
- **Actor:** Gardener, Admin
- **Predpodminky:** Equipment existuje v systemu
- **Post-conditions:** Report vytvoren, linked na Equipment, `status = new`
- **System side-effect:** Pokud je report `resolved` → Equipment `status = functional`

### UC5: Event Participation Update (Aktualizace ucast na eventu)
- **Actor:** Gardener
- **Predpodminky:** Event existuje a ma `status = active`
- **Akce:** Nastavi `participants[userId]` na `going` | `maybe` | `not_going`

### UC6: Task Status Update (Aktualizace stavu ukolu)
- **Actor:** Gardener (Author), Admin
- **Akce:** Prepnuti `status` mezi `in_progress` a `completed`
- **Side-effect:** `completed` = vizualni preskrtnuti + archivace

---

## 5. Systemova automatizace (System actor rules)

```
IF report.status → 'resolved' AND report.linkedEquipmentId IS NOT NULL
  THEN equipment.status = 'functional'

IF report.status → 'resolved'
  THEN all tasks WHERE linkedType='report' AND linkedId=report.id → status='completed'

IF gardenBed.deleted
  THEN cascade delete: reports WHERE context=gardenBed, tasks WHERE linkedType='plot' AND linkedId=gardenBed.id

IF event.status → 'cancelled'
  THEN tasks WHERE linkedType='event' AND linkedId=event.id → hidden/visibility=false

IF event.status → 'active' (restored)
  THEN tasks WHERE linkedType='event' AND linkedId=event.id → visible
```

---

## 6. Autorizacni matice

| Akce | Gardener | Author (vlastnik) | Admin |
|------|----------|-------------------|-------|
| Cist vsechny entity | ✓ | ✓ | ✓ |
| Vytvorit task/report/equipment/event | ✓ | ✓ | ✓ |
| Narokovat volnou zaberku | ✓ (max 1) | ✓ | ✓ |
| Uvolnit vlastni zaberku | ✓ | ✓ | ✓ |
| Uvolnit cizi zaberku | ✗ | ✗ | ✓ |
| Vytvorit/smazat/prejmenovar zaberku | ✗ | ✗ | ✓ |
| Editovat vlastni item | ✗ | ✓ | ✓ |
| Smazat vlastni item | ✗ | ✓ | ✓ |
| Editovat/smazat cizi item | ✗ | ✗ | ✓ |
| RSVP na event | ✓ | ✓ | ✓ |

---

## 7. Implementacni smernice pro BE

### Stack
- **Framework:** NestJS (TypeScript)
- **ORM:** Drizzle ORM
- **DB:** PostgreSQL (Docker)
- **Auth:** JWT (planovano)

### Konvence

- Drizzle schema je single source of truth — definice tabulek v `src/database/schema.ts`
- Kazdy domenovy celek ma vlastni NestJS modul: `GardenBedsModule`, `TasksModule`, `ReportsModule`, `EquipmentModule`, `EventsModule`
- System automation logika (cascade, auto-complete, status sync) patri do servisni vrstvy, ne do DB triggeru — kvuli testovatelnosti
- `authorId` se plni automaticky ze JWT tokenu v controlleru, nikdy z request body
- `ownerName`, `authorName` jsou cachovane stringy — aktualizuji se pri zmene User profilu
- Enum hodnoty pouzivat jako TypeScript `const` objekty a Drizzle `pgEnum`
- Vsechny cascade operace resit v transakci

### Struktura modulu (vzor)
```
src/
  garden-beds/
    garden-beds.module.ts
    garden-beds.controller.ts
    garden-beds.service.ts
    dto/
      create-garden-bed.dto.ts
      update-garden-bed.dto.ts
  tasks/
    ...
  reports/
    ...
  equipment/
    ...
  events/
    ...
  database/
    schema.ts          ← vsechny tabulky
    database.module.ts
```

### Validace (dle BRD)
- `task.title` max 255 znaku
- `task.description` max 4000 znaku
- `task.dueDate` nesmi byt v minulosti pri vytvoreni
- `event.date` nesmi byt v minulosti pri vytvoreni
- Gardener nesmi narokovat zaberku pokud uz jednu ma
- `linkedType` a `linkedId` jsou bud oba vyplnene nebo oba null (vzajemna zavislost)

---

## 8. Datove vztahy (ERD prehled)

```
User ──< GardenBed (ownerId)
User ──< Task (authorId, resolverId)
User ──< Report (authorId)
User ──< Equipment (authorId)
User ──< CommunityEvent (authorId)

GardenBed ──< Task (linkedId, linkedType='plot')
GardenBed ──< Report (context)

Report ──< Task (linkedId, linkedType='report')
Report >── Equipment (repair report linked to equipment)

CommunityEvent ──< Task (linkedId, linkedType='event')
CommunityEvent ──< participants (JSONB map userId→status)
```
