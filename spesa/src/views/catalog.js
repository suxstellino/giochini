import { Catalog, normalize } from '../store/catalog.js';
import {
  esc, toast, openForm, confirmDialog, categoryOptions,
} from '../ui/dom.js';

export function renderCatalog(app) {
  let filter = '';
  const open = new Set();

  app.innerHTML = `
    <header class="topbar">
      <a class="icon-btn" href="#/" aria-label="Indietro">←</a>
      <h1>Prodotti e categorie</h1>
      <button class="icon-btn" data-action="tools" aria-label="Importa / esporta">⋯</button>
    </header>
    <div class="addbar">
      <input id="filter" type="search" placeholder="Cerca nel catalogo…" aria-label="Cerca nel catalogo">
    </div>
    <main class="page">
      <div class="row-actions">
        <button class="btn btn-primary" data-action="add-product">＋ Prodotto</button>
        <button class="btn" data-action="add-category">＋ Categoria</button>
      </div>
      <div id="cats"></div>
      <input type="file" id="import-file" accept="application/json,.json" hidden>
    </main>`;

  const catsEl = app.querySelector('#cats');
  const filterEl = app.querySelector('#filter');
  const fileEl = app.querySelector('#import-file');

  function draw() {
    const q = normalize(filter);
    const categories = Catalog.categories;
    catsEl.innerHTML = categories.map((c, i) => {
      const products = Catalog.productsIn(c.id).filter((p) => !q || normalize(p.name).includes(q));
      if (q && !products.length) return '';
      return `
        <details class="cat" data-cat="${esc(c.id)}" ${open.has(c.id) || q ? 'open' : ''}>
          <summary>
            <span class="cat-name">${esc(c.icon)} ${esc(c.name)} <small>${products.length}</small></span>
            <span class="cat-tools">
              <button class="icon-btn small" data-action="up" ${i === 0 ? 'disabled' : ''} aria-label="Sposta su">▲</button>
              <button class="icon-btn small" data-action="down" ${i === categories.length - 1 ? 'disabled' : ''} aria-label="Sposta giù">▼</button>
              <button class="icon-btn small" data-action="edit-category" aria-label="Modifica categoria">✎</button>
            </span>
          </summary>
          <ul class="products">
            ${products.map((p) => `
              <li data-product="${esc(p.id)}">
                <span>${esc(p.name)}</span>
                <button class="icon-btn small" data-action="edit-product" aria-label="Modifica prodotto">✎</button>
              </li>`).join('')}
            <li><button class="link-btn" data-action="add-product">＋ Aggiungi a ${esc(c.name)}</button></li>
          </ul>
        </details>`;
    }).join('') || '<p class="empty">Nessun prodotto trovato.</p>';
  }

  async function productForm(product, categoryId) {
    const res = await openForm({
      title: product ? 'Modifica prodotto' : 'Nuovo prodotto',
      body: `
        <label>Nome<input name="name" required maxlength="80" value="${esc(product?.name || filter)}"></label>
        <label>Categoria<select name="categoryId">${categoryOptions(Catalog.categories, product?.categoryId || categoryId || 'altro')}</select></label>`,
      danger: product ? 'Elimina' : null,
      submitLabel: product ? 'Salva' : 'Aggiungi',
    });
    if (!res) return;
    if (res._action === 'danger') {
      Catalog.deleteProduct(product.id);
      return;
    }
    const name = res.name.trim();
    if (!name) return;
    const duplicate = Catalog.findProductByName(name);
    if (duplicate && duplicate.id !== product?.id) {
      toast(`«${duplicate.name}» esiste già`);
      return;
    }
    open.add(res.categoryId);
    if (product) Catalog.updateProduct(product.id, { name, categoryId: res.categoryId });
    else Catalog.addProduct({ name, categoryId: res.categoryId });
  }

  async function categoryForm(category) {
    const res = await openForm({
      title: category ? 'Modifica categoria' : 'Nuova categoria',
      body: `
        <div class="row">
          <label class="emoji-field">Icona<input name="icon" maxlength="4" value="${esc(category?.icon || '🛒')}"></label>
          <label class="grow">Nome<input name="name" required maxlength="40" value="${esc(category?.name || '')}"></label>
        </div>`,
      danger: category && category.id !== 'altro' ? 'Elimina' : null,
      submitLabel: category ? 'Salva' : 'Aggiungi',
    });
    if (!res) return;
    if (res._action === 'danger') {
      const n = Catalog.productsIn(category.id).length;
      const ok = await confirmDialog('Eliminare la categoria?', n ? `I suoi ${n} prodotti finiranno in "Altro".` : 'La categoria è vuota.', 'Elimina');
      if (ok) Catalog.deleteCategory(category.id);
      return;
    }
    const name = res.name.trim();
    if (!name) return;
    if (category) Catalog.updateCategory(category.id, { name, icon: res.icon.trim() || '🛒' });
    else {
      open.add(Catalog.addCategory({ name, icon: res.icon.trim() }).id);
      draw();
    }
  }

  async function tools() {
    const res = await openForm({
      title: 'Catalogo',
      body: `
        <p class="hint">Esporta il catalogo per passarlo a un familiare, o importa il suo: i prodotti verranno uniti ai tuoi.</p>
        <button type="button" class="btn btn-block" data-tool="export">⬇️ Esporta catalogo</button>
        <button type="button" class="btn btn-block" data-tool="import">⬆️ Importa catalogo</button>
        <button type="button" class="btn btn-block" data-tool="restore">↺ Ripristina prodotti base mancanti</button>`,
      submitLabel: 'Chiudi',
      onOpen(form, close) {
        form.addEventListener('click', (e) => {
          const tool = e.target.closest('[data-tool]')?.dataset.tool;
          if (tool) close({ tool });
        });
      },
    });
    if (res?.tool === 'export') {
      const blob = new Blob([Catalog.exportJSON()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'catalogo-spesa.json';
      a.click();
      URL.revokeObjectURL(a.href);
    } else if (res?.tool === 'import') {
      fileEl.click();
    } else if (res?.tool === 'restore') {
      Catalog.restoreBase();
      toast('Catalogo base ripristinato');
    }
  }

  fileEl.addEventListener('change', async () => {
    const file = fileEl.files[0];
    fileEl.value = '';
    if (!file) return;
    try {
      const added = Catalog.importJSON(await file.text());
      toast(added ? `Aggiunte ${added} voci` : 'Niente di nuovo da aggiungere');
    } catch (err) {
      toast(`Importazione fallita: ${err.message}`);
    }
  });

  filterEl.addEventListener('input', () => {
    filter = filterEl.value;
    draw();
  });

  // Ricorda quali categorie sono aperte tra un ridisegno e l'altro.
  catsEl.addEventListener('toggle', (e) => {
    const id = e.target.dataset.cat;
    if (id && !filter) e.target.open ? open.add(id) : open.delete(id);
  }, true);

  app.onclick = async (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    const catId = target.closest('[data-cat]')?.dataset.cat;
    const productId = target.closest('[data-product]')?.dataset.product;
    // I pulsanti dentro <summary> non devono aprire/chiudere la categoria.
    if (target.closest('summary')) e.preventDefault();
    if (action === 'add-product') await productForm(null, catId);
    else if (action === 'add-category') await categoryForm(null);
    else if (action === 'edit-product') await productForm(Catalog.products.find((p) => p.id === productId));
    else if (action === 'edit-category') await categoryForm(Catalog.category(catId));
    else if (action === 'up') Catalog.moveCategory(catId, -1);
    else if (action === 'down') Catalog.moveCategory(catId, 1);
    else if (action === 'tools') await tools();
  };

  const unsub = Catalog.subscribe(draw);
  draw();
  return () => {
    unsub();
    app.onclick = null;
  };
}
