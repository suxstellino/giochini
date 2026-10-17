import { esc, openForm, toast } from '../ui/dom.js';
import { getUserName, setUserName } from '../store/util.js';

export function renderHome(app, _params, { backend, go }) {
  let lists = [];

  function draw() {
    const sorted = [...lists].sort((a, b) => b.updatedAt - a.updatedAt);
    app.innerHTML = `
      <header class="topbar">
        <h1>🛒 Spesa di famiglia</h1>
        <button class="icon-btn" data-action="settings" aria-label="Impostazioni">⚙️</button>
      </header>
      <main class="page">
        ${backend.mode === 'local' ? `
          <p class="hint">Modalità locale: le liste restano su questo dispositivo e si condividono come copia.
          Per liste condivise in tempo reale configura Firebase (vedi README).</p>` : ''}
        <section class="cards">
          ${sorted.map(cardHtml).join('') || '<p class="empty">Nessuna lista. Creane una!</p>'}
        </section>
        <button class="btn btn-primary btn-block" data-action="new">＋ Nuova lista</button>
        <a class="btn btn-block" href="#/catalog">📚 Prodotti e categorie</a>
      </main>`;
  }

  function cardHtml(list) {
    const items = Object.values(list.items);
    const todo = items.filter((i) => !i.checked).length;
    const shared = list.members.length > 1;
    return `
      <a class="card" href="#/list/${esc(list.id)}">
        <span class="card-title">${esc(list.name)}</span>
        <span class="card-meta">
          ${todo ? `${todo} da prendere` : items.length ? 'Tutto preso ✓' : 'Vuota'}
          ${items.length && todo ? ` · ${items.length - todo} nel carrello` : ''}
          ${shared ? ` · 👥 ${list.members.length}` : ''}
        </span>
      </a>`;
  }

  app.onclick = async (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'new') {
      const res = await openForm({
        title: 'Nuova lista',
        body: '<label>Nome<input name="name" required maxlength="60" placeholder="es. Spesa settimanale"></label>',
        submitLabel: 'Crea',
      });
      if (!res?.name?.trim()) return;
      const id = await backend.createList(res.name.trim());
      go(`#/list/${id}`);
    } else if (action === 'settings') {
      const res = await openForm({
        title: 'Impostazioni',
        body: `
          <label>Il tuo nome <small>(mostrato sui prodotti che aggiungi)</small>
            <input name="userName" maxlength="30" value="${esc(getUserName())}" placeholder="es. Mamma">
          </label>
          <p class="hint">Modalità: <strong>${backend.mode === 'firebase' ? 'condivisa (Firebase)' : 'locale'}</strong></p>`,
      });
      if (res) {
        setUserName(res.userName || '');
        toast('Salvato');
      }
    }
  };

  const unsub = backend.subscribeLists((next) => {
    lists = next;
    draw();
  });
  return () => {
    unsub();
    app.onclick = null;
  };
}
