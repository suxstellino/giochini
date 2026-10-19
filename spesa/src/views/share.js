// Condivisione liste:
// - con Firebase: link "#/join/{id}" che aggiunge chi lo apre ai membri della lista;
// - in locale: link "#/import/{dati}" che contiene la lista e ne crea una copia.
import { esc, confirmDialog, shareOrCopy } from '../ui/dom.js';
import { newId } from '../store/util.js';

const baseUrl = () => `${location.origin}${location.pathname}`;

export async function shareList(backend, list) {
  if (backend.mode === 'firebase') {
    await shareOrCopy({
      title: list.name,
      text: `Unisciti alla lista della spesa "${list.name}"`,
      url: `${baseUrl()}#/join/${list.id}`,
    });
  } else {
    const items = Object.values(list.items).map(({ name, categoryId, categoryName, categoryIcon, qty, note, checked }) => (
      { name, categoryId, categoryName, categoryIcon, qty, note, checked }
    ));
    await shareOrCopy({
      title: list.name,
      text: `Lista della spesa "${list.name}"`,
      url: `${baseUrl()}#/import/${encode({ name: list.name, items })}`,
    });
  }
}

export async function shareAsText(list) {
  const items = Object.values(list.items).filter((i) => !i.checked);
  const text = [`🛒 ${list.name}`, ...items.map((i) => `• ${i.name}${i.qty ? ` (${i.qty})` : ''}${i.note ? ` – ${i.note}` : ''}`)].join('\n');
  await shareOrCopy({ title: list.name, text });
}

export function renderJoin(app, [id], { backend, go }) {
  app.innerHTML = '<main class="page"><p class="loading">Mi unisco alla lista…</p></main>';
  backend.joinList(id)
    .then(() => go(`#/list/${id}`))
    .catch((err) => {
      console.error(err);
      app.innerHTML = `<main class="page"><p class="error">Non riesco ad aprire questa lista: ${esc(err.message)}</p>
        <a class="btn" href="#/">Torna alle liste</a></main>`;
    });
}

export function renderImport(app, [data], { backend, go }) {
  let payload;
  try {
    payload = decode(data);
  } catch {
    app.innerHTML = '<main class="page"><p class="error">Link non valido.</p><a class="btn" href="#/">Torna alle liste</a></main>';
    return;
  }
  app.innerHTML = '<main class="page"></main>';
  (async () => {
    const count = payload.items?.length || 0;
    const ok = await confirmDialog('Lista ricevuta', `Vuoi aggiungere "${payload.name}" (${count} prodotti) alle tue liste?`, 'Aggiungi');
    if (!ok) return go('#/');
    const items = {};
    for (const raw of payload.items || []) {
      const id = newId('i');
      items[id] = {
        id,
        name: String(raw.name || '').slice(0, 80),
        productId: null,
        categoryId: String(raw.categoryId || 'altro'),
        categoryName: String(raw.categoryName || 'Altro'),
        categoryIcon: String(raw.categoryIcon || '🛒'),
        qty: String(raw.qty || ''),
        note: String(raw.note || ''),
        checked: !!raw.checked,
        addedBy: '',
        addedAt: Date.now(),
      };
    }
    const listId = await backend.createList(String(payload.name || 'Lista').slice(0, 60), items);
    go(`#/list/${listId}`);
  })();
}

function encode(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decode(str) {
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
}
