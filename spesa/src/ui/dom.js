// Piccoli aiuti per l'interfaccia: escape HTML, toast e finestre di dialogo.

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

let toastTimer;
export function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

const dialog = document.getElementById('dialog');

// Apre il <dialog> con un form. Risolve con i valori del form (FormData come oggetto),
// oppure con null se l'utente annulla. `onOpen` riceve il form per collegare eventi extra.
export function openForm({ title, body, submitLabel = 'Salva', danger, onOpen }) {
  dialog.innerHTML = `
    <form method="dialog" class="dialog-form">
      <h2>${esc(title)}</h2>
      <div class="dialog-body">${body}</div>
      <div class="dialog-actions">
        ${danger ? `<button type="submit" value="danger" class="btn btn-danger" formnovalidate>${esc(danger)}</button>` : ''}
        <span class="spacer"></span>
        <button type="submit" value="cancel" class="btn" formnovalidate>Annulla</button>
        <button type="submit" value="ok" class="btn btn-primary">${esc(submitLabel)}</button>
      </div>
    </form>`;
  const form = dialog.querySelector('form');
  onOpen?.(form, close);
  dialog.showModal();
  form.querySelector('input:not([type=hidden]), select, textarea')?.focus();

  let resolveFn;
  function close(value) {
    dialog.close();
    resolveFn(value);
  }
  form.addEventListener('submit', (e) => {
    const action = e.submitter?.value;
    if (action === 'cancel') return close(null);
    if (action === 'danger') return close({ _action: 'danger' });
    close(Object.fromEntries(new FormData(form)));
  });
  dialog.addEventListener('cancel', () => resolveFn(null), { once: true });
  return new Promise((resolve) => { resolveFn = resolve; });
}

export async function confirmDialog(title, message, okLabel = 'Conferma') {
  const res = await openForm({ title, body: `<p>${esc(message)}</p>`, submitLabel: okLabel });
  return res !== null;
}

export function categoryOptions(categories, selectedId) {
  return categories
    .map((c) => `<option value="${esc(c.id)}" ${c.id === selectedId ? 'selected' : ''}>${esc(c.icon)} ${esc(c.name)}</option>`)
    .join('');
}

// Condivide un testo/link con il pannello nativo del telefono, oppure lo copia.
export async function shareOrCopy({ title, text, url }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }
  await navigator.clipboard.writeText(url ? `${text ? `${text}\n` : ''}${url}` : text);
  toast('Copiato negli appunti');
}
