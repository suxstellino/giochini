// Catalogo personale di categorie e prodotti, salvato nel browser.
// Al primo avvio è una copia del catalogo base; poi è liberamente modificabile.
import { BASE_CATEGORIES, BASE_PRODUCTS } from '../data/baseCatalog.js';
import { newId } from './util.js';

const KEY = 'spesa.catalog.v1';
const FALLBACK_CATEGORY = 'altro';

let state = load();
const listeners = new Set();

function seed() {
  return {
    categories: BASE_CATEGORIES.map((c, i) => ({ ...c, order: i })),
    products: BASE_PRODUCTS.map((p) => ({ ...p })),
  };
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Array.isArray(saved.categories) && Array.isArray(saved.products)) return saved;
  } catch { /* catalogo corrotto: si riparte dal base */ }
  return seed();
}

function commit() {
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((fn) => fn(state));
}

export const Catalog = {
  get categories() {
    return [...state.categories].sort((a, b) => a.order - b.order);
  },
  get products() {
    return state.products;
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  category(id) {
    return state.categories.find((c) => c.id === id);
  },

  productsIn(categoryId) {
    return state.products
      .filter((p) => p.categoryId === categoryId)
      .sort((a, b) => a.name.localeCompare(b.name, 'it'));
  },

  findProductByName(name) {
    const n = normalize(name);
    return state.products.find((p) => normalize(p.name) === n);
  },

  search(text, limit = 8) {
    const q = normalize(text);
    if (!q) return [];
    const starts = [];
    const contains = [];
    for (const p of state.products) {
      const n = normalize(p.name);
      if (n.startsWith(q)) starts.push(p);
      else if (n.includes(q)) contains.push(p);
    }
    const byName = (a, b) => a.name.localeCompare(b.name, 'it');
    return [...starts.sort(byName), ...contains.sort(byName)].slice(0, limit);
  },

  addCategory({ name, icon }) {
    const order = Math.max(-1, ...state.categories.map((c) => c.order)) + 1;
    const category = { id: newId('c'), name: name.trim(), icon: icon || '🛒', order };
    state.categories.push(category);
    commit();
    return category;
  },

  updateCategory(id, patch) {
    const c = this.category(id);
    if (!c) return;
    Object.assign(c, patch);
    commit();
  },

  // I prodotti di una categoria cancellata finiscono in "Altro".
  deleteCategory(id) {
    if (id === FALLBACK_CATEGORY) return;
    state.categories = state.categories.filter((c) => c.id !== id);
    state.products.forEach((p) => {
      if (p.categoryId === id) p.categoryId = FALLBACK_CATEGORY;
    });
    ensureFallbackCategory();
    commit();
  },

  // Sposta una categoria su (-1) o giù (+1): l'ordine segue il percorso nel supermercato.
  moveCategory(id, delta) {
    const sorted = this.categories;
    const i = sorted.findIndex((c) => c.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= sorted.length) return;
    [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
    sorted.forEach((c, k) => { c.order = k; });
    commit();
  },

  addProduct({ name, categoryId }) {
    const existing = this.findProductByName(name);
    if (existing) return existing;
    const product = { id: newId('p'), name: name.trim(), categoryId: categoryId || FALLBACK_CATEGORY };
    state.products.push(product);
    commit();
    return product;
  },

  updateProduct(id, patch) {
    const p = state.products.find((x) => x.id === id);
    if (!p) return;
    Object.assign(p, patch);
    commit();
  },

  deleteProduct(id) {
    state.products = state.products.filter((p) => p.id !== id);
    commit();
  },

  // Riaggiunge categorie e prodotti base mancanti; non tocca quelli modificati o aggiunti.
  restoreBase() {
    let order = Math.max(-1, ...state.categories.map((c) => c.order)) + 1;
    for (const c of BASE_CATEGORIES) {
      if (!this.category(c.id)) state.categories.push({ ...c, order: order++ });
    }
    for (const p of BASE_PRODUCTS) {
      if (!state.products.some((x) => x.id === p.id) && !this.findProductByName(p.name)) {
        state.products.push({ ...p });
      }
    }
    commit();
  },

  exportJSON() {
    return JSON.stringify({ format: 'spesa-catalog', version: 1, ...state }, null, 2);
  },

  // Unisce un catalogo esportato (es. da un altro familiare) a quello attuale.
  importJSON(text) {
    const data = JSON.parse(text);
    if (data.format !== 'spesa-catalog') throw new Error('File non valido');
    let order = Math.max(-1, ...state.categories.map((c) => c.order)) + 1;
    let added = 0;
    for (const c of data.categories || []) {
      if (!c?.id || !c?.name || this.category(c.id)) continue;
      state.categories.push({ id: String(c.id), name: String(c.name), icon: String(c.icon || '🛒'), order: order++ });
      added++;
    }
    for (const p of data.products || []) {
      if (!p?.id || !p?.name || this.findProductByName(p.name)) continue;
      const categoryId = this.category(p.categoryId) ? p.categoryId : FALLBACK_CATEGORY;
      state.products.push({ id: String(p.id), name: String(p.name), categoryId });
      added++;
    }
    ensureFallbackCategory();
    commit();
    return added;
  },
};

function ensureFallbackCategory() {
  if (!state.categories.some((c) => c.id === FALLBACK_CATEGORY)) {
    const base = BASE_CATEGORIES.find((c) => c.id === FALLBACK_CATEGORY);
    state.categories.push({ ...base, order: state.categories.length });
  }
}

export function normalize(text) {
  return String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
