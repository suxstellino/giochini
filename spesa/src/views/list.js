import { Catalog, normalize } from '../store/catalog.js';
import { newId, getUserName } from '../store/util.js';
import {
  esc, toast, openForm, confirmDialog, categoryOptions,
} from '../ui/dom.js';
import { shareList, shareAsText } from './share.js';

export function renderList(app, [listId], { backend, go }) {
  let list = null;

  // Lo scheletro si disegna una volta sola: così aggiornamenti in tempo reale
  // non fanno perdere il focus al campo di ricerca mentre si scrive.
  app.innerHTML = `
    <header class="topbar">
      <a class="icon-btn" href="#/" aria-label="Indietro">←</a>
      <h1 id="list-title"></h1>
      <button class="icon-btn" data-action="share" aria-label="Condividi">📤</button>
      <button class="icon-btn" data-action="menu" aria-label="Altro">⋯</button>
    </header>
    <div class="addbar">
      <form id="add-form" autocomplete="off">
        <input id="add-input" type="search" placeholder="Aggiungi prodotto…" enterkeyhint="done" aria-label="Aggiungi prodotto">
        <button type="button" class="icon-btn" data-action="browse" aria-label="Sfoglia catalogo">📚</button>
      </form>
      <ul id="suggestions" class="suggestions" hidden></ul>
    </div>
    <main class="page" id="items"><p class="loading">Caricamento…</p></main>`;

  const titleEl = app.querySelector('#list-title');
  const itemsEl = app.querySelector('#items');
  const input = app.querySelector('#add-input');
  const suggestionsEl = app.querySelector('#suggestions');

  const items = () => Object.values(list?.items || {});
  const findItemByName = (name) => items().find((i) => normalize(i.name) === normalize(name));

  function categoryOf(item) {
    const c = Catalog.category(item.categoryId);
    return c || { id: item.categoryId, name: item.categoryName || 'Altro', icon: item.categoryIcon || '🛒', order: 9999 };
  }

  function drawItems() {
    if (!list) {
      itemsEl.innerHTML = '<p class="error">Lista non trovata o non sei tra i membri.</p><a class="btn" href="#/">Torna alle liste</a>';
      return;
    }
    titleEl.textContent = list.name;
    const all = items();
    const todo = all.filter((i) => !i.checked);
    const done = all.filter((i) => i.checked).sort((a, b) => a.name.localeCompare(b.name, 'it'));

    const groups = new Map();
    for (const item of todo) {
      const cat = categoryOf(item);
      if (!groups.has(cat.id)) groups.set(cat.id, { cat, items: [] });
      groups.get(cat.id).items.push(item);
    }
    const sortedGroups = [...groups.values()].sort((a, b) => a.cat.order - b.cat.order);

    itemsEl.innerHTML = `
      ${!all.length ? '<p class="empty">La lista è vuota.<br>Scrivi un prodotto qui sopra o sfoglia il catalogo 📚</p>' : ''}
      ${!todo.length && all.length ? '<p class="empty">Tutto preso! 🎉</p>' : ''}
      ${sortedGroups.map(({ cat, items: group }) => `
        <section class="group">
          <h2>${esc(cat.icon)} ${esc(cat.name)}</h2>
          <ul class="items">${group.sort((a, b) => a.name.localeCompare(b.name, 'it')).map(itemHtml).join('')}</ul>
        </section>`).join('')}
      ${done.length ? `
        <section class="group done">
          <h2>✓ Nel carrello (${done.length})
            <button class="link-btn" data-action="clear-checked">Rimuovi</button>
          </h2>
          <ul class="items">${done.map(itemHtml).join('')}</ul>
        </section>` : ''}`;
  }

  function itemHtml(item) {
    const details = [item.qty, item.note].filter(Boolean).map(esc).join(' · ');
    const by = list.members.length > 1 && item.addedBy ? `<span class="by">${esc(item.addedBy)}</span>` : '';
    return `
      <li class="item ${item.checked ? 'checked' : ''}" data-id="${esc(item.id)}">
        <button class="check" data-action="toggle" aria-label="${item.checked ? 'Rimetti in lista' : 'Preso'}"></button>
        <span class="item-main" data-action="toggle">
          <span class="item-name">${esc(item.name)}</span>
          ${details || by ? `<span class="item-details">${details}${by}</span>` : ''}
        </span>
        <button class="icon-btn small" data-action="edit" aria-label="Modifica">✎</button>
      </li>`;
  }

  async function addProduct({ name, productId = null, categoryId }) {
    const existing = findItemByName(name);
    if (existing) {
      if (existing.checked) {
        await backend.updateItem(listId, existing.id, { checked: false });
        toast(`${existing.name} rimesso in lista`);
      } else {
        toast(`${existing.name} è già in lista`);
      }
      return;
    }
    const cat = Catalog.category(categoryId) || Catalog.category('altro');
    const item = {
      id: newId('i'),
      name: name.trim(),
      productId,
      categoryId: cat.id,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      qty: '',
      note: '',
      checked: false,
      addedBy: getUserName(),
      addedAt: Date.now(),
    };
    await backend.putItem(listId, item);
  }

  // Prodotto non in catalogo: si sceglie la categoria e, volendo, lo si salva nel catalogo.
  async function addNewProduct(name) {
    const res = await openForm({
      title: `Nuovo prodotto: ${name}`,
      body: `
        <label>Nome<input name="name" required maxlength="80" value="${esc(name)}"></label>
        <label>Categoria<select name="categoryId">${categoryOptions(Catalog.categories, 'altro')}</select></label>
        <label class="row"><input type="checkbox" name="save" checked> Salva nel catalogo</label>`,
      submitLabel: 'Aggiungi',
    });
    if (!res?.name?.trim()) return;
    let productId = null;
    if (res.save) productId = Catalog.addProduct({ name: res.name, categoryId: res.categoryId }).id;
    await addProduct({ name: res.name, productId, categoryId: res.categoryId });
  }

  function drawSuggestions() {
    const text = input.value.trim();
    if (!text) {
      suggestionsEl.hidden = true;
      return;
    }
    const matches = Catalog.search(text);
    const exact = matches.some((p) => normalize(p.name) === normalize(text));
    suggestionsEl.innerHTML = [
      ...matches.map((p) => {
        const cat = Catalog.category(p.categoryId);
        const inList = findItemByName(p.name);
        return `<li><button type="button" data-product="${esc(p.id)}">
          <span>${esc(cat?.icon || '')} ${esc(p.name)}</span>
          ${inList && !inList.checked ? '<small>in lista</small>' : ''}
        </button></li>`;
      }),
      exact ? '' : `<li><button type="button" data-new="1">＋ Aggiungi «${esc(text)}»</button></li>`,
    ].join('');
    suggestionsEl.hidden = false;
  }

  function resetInput() {
    input.value = '';
    suggestionsEl.hidden = true;
    input.focus();
  }

  input.addEventListener('input', drawSuggestions);
  input.addEventListener('focus', drawSuggestions);
  app.querySelector('#add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    const product = Catalog.findProductByName(text);
    resetInput();
    if (product) await addProduct({ name: product.name, productId: product.id, categoryId: product.categoryId });
    else await addNewProduct(text);
  });
  suggestionsEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const text = input.value.trim();
    resetInput();
    if (btn.dataset.new) return addNewProduct(text);
    const product = Catalog.products.find((p) => p.id === btn.dataset.product);
    if (product) await addProduct({ name: product.name, productId: product.id, categoryId: product.categoryId });
  });

  async function editItem(item) {
    const res = await openForm({
      title: 'Modifica prodotto',
      body: `
        <label>Nome<input name="name" required maxlength="80" value="${esc(item.name)}"></label>
        <label>Quantità<input name="qty" maxlength="30" value="${esc(item.qty)}" placeholder="es. 2, 1 kg, 3 confezioni"></label>
        <label>Nota<input name="note" maxlength="120" value="${esc(item.note)}" placeholder="es. marca, offerta…"></label>
        <label>Categoria<select name="categoryId">${categoryOptions(Catalog.categories, item.categoryId)}</select></label>`,
      danger: 'Elimina',
    });
    if (!res) return;
    if (res._action === 'danger') return backend.removeItems(listId, [item.id]);
    const cat = Catalog.category(res.categoryId) || categoryOf(item);
    await backend.updateItem(listId, item.id, {
      name: res.name.trim() || item.name,
      qty: res.qty.trim(),
      note: res.note.trim(),
      categoryId: cat.id,
      categoryName: cat.name,
      categoryIcon: cat.icon,
    });
  }

  async function browseCatalog() {
    const inList = (p) => {
      const i = findItemByName(p.name);
      return i && !i.checked;
    };
    await openForm({
      title: 'Sfoglia catalogo',
      submitLabel: 'Fatto',
      body: `<div class="browse">${Catalog.categories.map((c) => {
        const products = Catalog.productsIn(c.id);
        if (!products.length) return '';
        return `<details><summary>${esc(c.icon)} ${esc(c.name)}</summary><div class="chips">
          ${products.map((p) => `<button type="button" class="chip ${inList(p) ? 'on' : ''}" data-product="${esc(p.id)}">${esc(p.name)}</button>`).join('')}
        </div></details>`;
      }).join('')}</div>`,
      onOpen(form) {
        form.querySelector('.browse').addEventListener('click', async (e) => {
          const chip = e.target.closest('[data-product]');
          if (!chip) return;
          const product = Catalog.products.find((p) => p.id === chip.dataset.product);
          const existing = findItemByName(product.name);
          if (existing && !existing.checked) {
            await backend.removeItems(listId, [existing.id]);
            chip.classList.remove('on');
          } else {
            await addProduct({ name: product.name, productId: product.id, categoryId: product.categoryId });
            chip.classList.add('on');
          }
        });
      },
    });
  }

  async function showMenu() {
    const isOwner = list.ownerId === backend.uid;
    const res = await openForm({
      title: list.name,
      body: `
        <label>Nome lista<input name="name" required maxlength="60" value="${esc(list.name)}"></label>
        <button type="button" class="btn btn-block" data-menu="text">📝 Invia come testo</button>
        ${list.members.length > 1 ? `<p class="hint">👥 Condivisa con ${list.members.length - 1} ${list.members.length === 2 ? 'persona' : 'persone'}</p>` : ''}`,
      danger: isOwner ? 'Elimina lista' : 'Esci dalla lista',
      onOpen(form, close) {
        form.querySelector('[data-menu=text]').addEventListener('click', () => {
          close(null);
          shareAsText(list);
        });
      },
    });
    if (!res) return;
    if (res._action === 'danger') {
      const msg = isOwner ? 'La lista verrà eliminata per tutti.' : 'Non vedrai più questa lista.';
      if (!await confirmDialog(isOwner ? 'Eliminare la lista?' : 'Uscire dalla lista?', msg)) return;
      await (isOwner ? backend.deleteList(listId) : backend.leaveList(listId));
      return go('#/');
    }
    if (res.name.trim() && res.name.trim() !== list.name) await backend.renameList(listId, res.name.trim());
  }

  app.onclick = async (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) {
      if (!e.target.closest('.addbar')) suggestionsEl.hidden = true;
      return;
    }
    const action = target.dataset.action;
    const itemId = target.closest('[data-id]')?.dataset.id;
    const item = itemId && list?.items[itemId];
    if (action === 'toggle' && item) await backend.updateItem(listId, item.id, { checked: !item.checked });
    else if (action === 'edit' && item) await editItem(item);
    else if (action === 'clear-checked') await backend.removeItems(listId, items().filter((i) => i.checked).map((i) => i.id));
    else if (action === 'browse') await browseCatalog();
    else if (action === 'share' && list) await shareList(backend, list);
    else if (action === 'menu' && list) await showMenu();
  };

  const unsubList = backend.subscribeList(listId, (next) => {
    list = next;
    drawItems();
  });
  // Nuove categorie o un diverso ordine nel catalogo cambiano il raggruppamento.
  const unsubCatalog = Catalog.subscribe(drawItems);
  return () => {
    unsubList();
    unsubCatalog();
    app.onclick = null;
  };
}
