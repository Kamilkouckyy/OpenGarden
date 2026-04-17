import {
  deleteItem,
  getCollection,
  getItemById,
  insertItem,
  simulateDelay,
  updateItem,
} from "./mockDb";

const COLLECTION = "gardenBeds";

export const gardenBedApi = {
  async list() {
    return simulateDelay(getCollection(COLLECTION));
  },

  async getById(id) {
    return simulateDelay(getItemById(COLLECTION, id));
  },

  async create(payload) {
    return simulateDelay(
      insertItem(COLLECTION, {
        code: payload.code || payload.name,
        name: payload.name,
        status: payload.status || "volný",
        gardener: payload.gardener || null,
        description: payload.description || "",
      })
    );
  },

  async update(id, payload) {
    return simulateDelay(updateItem(COLLECTION, id, payload));
  },

  async reserve(id, gardener) {
    return simulateDelay(
      updateItem(COLLECTION, id, {
        status: "obsazený",
        gardener,
      })
    );
  },

  async release(id) {
    return simulateDelay(
      updateItem(COLLECTION, id, {
        status: "volný",
        gardener: null,
      })
    );
  },

  async remove(id) {
    return simulateDelay(deleteItem(COLLECTION, id));
  },
};
