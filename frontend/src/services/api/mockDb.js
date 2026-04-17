const STORAGE_KEY = "openGarden.mockDb";
const DB_CHANGE_EVENT = "openGarden:mock-db-changed";
const MOCK_DELAY_MS = 120;

const defaultDb = {
  gardenBeds: [
    {
      id: 1,
      code: "A1",
      name: "Záhon A1",
      status: "obsazený",
      gardener: "Anna",
      description: "Záhon určený pro pěstování rajčat a bylinek.",
    },
    {
      id: 2,
      code: "A2",
      name: "Záhon A2",
      status: "obsazený",
      gardener: "David",
      description: "Záhon rezervovaný pro sezónní zeleninu.",
    },
    {
      id: 3,
      code: "H1",
      name: "Záhon horní",
      status: "obsazený",
      gardener: "Karel",
      description: "Vyvýšený záhon v horní části zahrady.",
    },
    {
      id: 4,
      code: "D1",
      name: "Záhon dolní",
      status: "volný",
      gardener: null,
      description: "Volný záhon připravený k rezervaci.",
    },
    {
      id: 5,
      code: "B3",
      name: "Záhon B3",
      status: "volný",
      gardener: null,
      description: "Záhon vhodný pro kořenovou zeleninu.",
    },
  ],
  tasks: [
    {
      id: 1,
      title: "Úkol: Prořezat maliník",
      resolver: "Anna",
      deadline: "2026-03-27",
      assignment: "Zahrádka A3",
      description:
        "Prořežte maliník a odstraňte suché nebo poškozené větve.",
      status: "open",
      author: "Anna",
      color: "red",
    },
    {
      id: 2,
      title: "Úkol: Zalít rajčata",
      resolver: "Eva Nováková",
      deadline: "2026-03-30",
      assignment: "Zahrádka A1",
      description: "Zalijte rajčata a zkontrolujte vlhkost půdy.",
      status: "open",
      author: "Anna",
      color: "yellow",
    },
    {
      id: 3,
      title: "Úkol: Zalít rajčata",
      resolver: "David",
      deadline: "2026-03-30",
      assignment: "Zahrádka A3",
      description: "Zalijte rajčata na zahrádce A3.",
      status: "open",
      author: "David",
      color: "yellow",
    },
    {
      id: 4,
      title: "Úkol: Opravit hrábě",
      resolver: "David",
      deadline: "2026-03-31",
      assignment: "Nářadí",
      description: "Zkontrolujte poškozené hrábě a opravte nebo vyměňte násadu.",
      status: "in_progress",
      author: "David",
      color: "blue",
    },
    {
      id: 5,
      title: "Úkol: Zamést celou zahradu",
      resolver: "Anna",
      deadline: "2026-03-27",
      assignment: "Celá zahrada",
      description: "Zameťte společné cesty a sdílené prostory po celé zahradě.",
      status: "done",
      author: "Anna",
      color: "green",
    },
  ],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitDbChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DB_CHANGE_EVENT));
  }
}

function ensureDbShape(db) {
  return {
    gardenBeds: Array.isArray(db?.gardenBeds) ? db.gardenBeds : clone(defaultDb.gardenBeds),
    tasks: Array.isArray(db?.tasks) ? db.tasks : clone(defaultDb.tasks),
  };
}

export function loadDb() {
  if (!canUseLocalStorage()) return clone(defaultDb);

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = clone(defaultDb);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    return ensureDbShape(JSON.parse(raw));
  } catch (error) {
    const seeded = clone(defaultDb);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

export function saveDb(db) {
  const safeDb = ensureDbShape(db);

  if (canUseLocalStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safeDb));
  }

  emitDbChange();
  return clone(safeDb);
}

export function resetDb() {
  return saveDb(clone(defaultDb));
}

export function getCollection(collectionName) {
  const db = loadDb();
  return clone(db[collectionName] || []);
}

export function getItemById(collectionName, id) {
  const items = getCollection(collectionName);
  return items.find((item) => String(item.id) === String(id)) || null;
}

export function insertItem(collectionName, item) {
  const db = loadDb();
  const items = Array.isArray(db[collectionName]) ? db[collectionName] : [];
  const nextId = items.reduce((max, current) => Math.max(max, Number(current.id) || 0), 0) + 1;
  const createdItem = { ...item, id: nextId };

  db[collectionName] = [...items, createdItem];
  saveDb(db);

  return clone(createdItem);
}

export function updateItem(collectionName, id, patch) {
  const db = loadDb();
  const items = Array.isArray(db[collectionName]) ? db[collectionName] : [];
  let updatedItem = null;

  db[collectionName] = items.map((item) => {
    if (String(item.id) !== String(id)) return item;
    updatedItem = { ...item, ...patch, id: item.id };
    return updatedItem;
  });

  if (!updatedItem) return null;

  saveDb(db);
  return clone(updatedItem);
}

export function deleteItem(collectionName, id) {
  const db = loadDb();
  const items = Array.isArray(db[collectionName]) ? db[collectionName] : [];
  const itemToDelete = items.find((item) => String(item.id) === String(id)) || null;

  db[collectionName] = items.filter((item) => String(item.id) !== String(id));
  saveDb(db);

  return clone(itemToDelete);
}

export function subscribeToDbChanges(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => callback();
  window.addEventListener(DB_CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(DB_CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function simulateDelay(result, delay = MOCK_DELAY_MS) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(clone(result)), delay);
  });
}
