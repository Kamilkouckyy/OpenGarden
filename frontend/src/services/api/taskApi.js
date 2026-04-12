import {
  deleteItem,
  getCollection,
  getItemById,
  insertItem,
  simulateDelay,
  updateItem,
} from "./mockDb";

const COLLECTION = "tasks";

function pickColorFromStatus(status) {
  if (status === "done") return "green";
  if (status === "in_progress") return "blue";
  return "yellow";
}

export const taskApi = {
  async list() {
    return simulateDelay(getCollection(COLLECTION));
  },

  async getById(id) {
    return simulateDelay(getItemById(COLLECTION, id));
  },

  async create(payload) {
    const status = payload.status || "open";
    return simulateDelay(
      insertItem(COLLECTION, {
        title: payload.title,
        resolver: payload.resolver || "",
        deadline: payload.deadline || "",
        assignment: payload.assignment || "",
        description: payload.description || "",
        status,
        author: payload.author || "",
        color: payload.color || pickColorFromStatus(status),
      })
    );
  },

  async update(id, payload) {
    const patch = { ...payload };
    if (patch.status && !patch.color) {
      patch.color = pickColorFromStatus(patch.status);
    }

    return simulateDelay(updateItem(COLLECTION, id, patch));
  },

  async updateStatus(id, status) {
    return simulateDelay(
      updateItem(COLLECTION, id, {
        status,
        color: pickColorFromStatus(status),
      })
    );
  },

  async remove(id) {
    return simulateDelay(deleteItem(COLLECTION, id));
  },
};
