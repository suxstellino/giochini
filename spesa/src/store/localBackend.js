// Backend locale: le liste vivono solo in questo browser (localStorage).
// Si possono comunque "condividere" inviando un link che ne crea una copia.
import { newId } from './util.js';

const KEY = 'spesa.lists.v1';
const UID_KEY = 'spesa.localUid';

export function createLocalBackend() {
  let uid = localStorage.getItem(UID_KEY);
  if (!uid) {
    uid = newId('u');
    localStorage.setItem(UID_KEY, uid);
  }

  const listeners = new Set();
  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
  };
  let lists = read();

  const emit = () => listeners.forEach((fn) => fn());
  const save = () => {
    localStorage.setItem(KEY, JSON.stringify(lists));
    emit();
  };
  // Tiene sincronizzate più schede aperte sullo stesso browser.
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      lists = read();
      emit();
    }
  });

  const watch = (fn) => {
    listeners.add(fn);
    fn();
    return () => listeners.delete(fn);
  };

  const mutateItems = (listId, fn) => {
    const list = lists[listId];
    if (!list) return;
    fn(list.items);
    list.updatedAt = Date.now();
    save();
  };

  return {
    mode: 'local',
    uid,

    subscribeLists(cb) {
      return watch(() => cb(Object.values(lists)));
    },

    subscribeList(id, cb) {
      return watch(() => cb(lists[id] || null));
    },

    async createList(name, items = {}) {
      const id = newId();
      const now = Date.now();
      lists[id] = { id, name, ownerId: uid, members: [uid], items, createdAt: now, updatedAt: now };
      save();
      return id;
    },

    async renameList(id, name) {
      if (!lists[id]) return;
      lists[id].name = name;
      save();
    },

    async deleteList(id) {
      delete lists[id];
      save();
    },

    async leaveList(id) {
      return this.deleteList(id);
    },

    async joinList() {
      throw new Error('La condivisione in tempo reale richiede Firebase (vedi README).');
    },

    async putItem(listId, item) {
      mutateItems(listId, (items) => { items[item.id] = item; });
    },

    async updateItem(listId, itemId, patch) {
      mutateItems(listId, (items) => {
        if (items[itemId]) Object.assign(items[itemId], patch);
      });
    },

    async removeItems(listId, itemIds) {
      mutateItems(listId, (items) => itemIds.forEach((id) => delete items[id]));
    },
  };
}
