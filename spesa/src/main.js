import { firebaseConfig } from '../firebase-config.js';
import { createLocalBackend } from './store/localBackend.js';
import { createFirebaseBackend } from './store/firebaseBackend.js';
import { renderHome } from './views/home.js';
import { renderList } from './views/list.js';
import { renderCatalog } from './views/catalog.js';
import { renderJoin, renderImport } from './views/share.js';
import { esc } from './ui/dom.js';

const app = document.getElementById('app');

const ROUTES = [
  [/^#\/list\/([\w-]+)$/, renderList],
  [/^#\/catalog$/, renderCatalog],
  [/^#\/join\/([\w-]+)$/, renderJoin],
  [/^#\/import\/(.+)$/, renderImport],
  [/^.*$/, renderHome],
];

let cleanup = null;

function route(ctx) {
  cleanup?.();
  cleanup = null;
  const hash = location.hash || '#/';
  for (const [pattern, view] of ROUTES) {
    const m = hash.match(pattern);
    if (m) {
      cleanup = view(app, m.slice(1), ctx) || null;
      window.scrollTo(0, 0);
      return;
    }
  }
}

async function boot() {
  let backend;
  if (firebaseConfig) {
    try {
      backend = await createFirebaseBackend(firebaseConfig);
    } catch (err) {
      console.error(err);
      app.innerHTML = `<div class="page"><p class="error">Impossibile collegarsi a Firebase: ${esc(err.message)}</p>
        <p>Controlla la configurazione in <code>firebase-config.js</code>.</p></div>`;
      return;
    }
  } else {
    backend = createLocalBackend();
  }
  const ctx = { backend, go: (hash) => { location.hash = hash; } };
  window.addEventListener('hashchange', () => route(ctx));
  route(ctx);
}

boot();
