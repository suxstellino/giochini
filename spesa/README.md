# 🛒 Spesa di famiglia

App web (installabile sul telefono) per gestire la spesa di famiglia:

- **più liste** (es. "Spesa settimanale", "Farmacia", "Festa di compleanno");
- **catalogo base** di oltre 200 prodotti in 16 categorie, pensato per un supermercato italiano;
- **catalogo estendibile**: aggiungi, rinomina, sposta o cancella prodotti e categorie,
  e riordina le categorie secondo il percorso del tuo supermercato;
- **liste condivise** con la famiglia, aggiornate in tempo reale (con Firebase).

Niente build e niente dipendenze da installare: HTML + moduli JavaScript.

## Avvio in locale

```bash
cd spesa
python3 -m http.server 8000
```

Poi apri <http://localhost:8000>. Serve un server (non basta aprire `index.html` dal disco)
perché i moduli ES non funzionano con `file://`.

## Come si usa

- **Home**: elenco delle liste, con quanti prodotti mancano. `＋ Nuova lista` per crearne una.
- **Lista**: scrivi nel campo in alto. Mentre scrivi compaiono i prodotti del catalogo;
  se il prodotto non c'è, scegli la categoria e (di default) viene salvato nel catalogo.
  📚 apre il catalogo per aggiungere prodotti con un tocco.
  Tocca un prodotto per segnarlo come preso; ✎ per quantità, note, categoria o eliminazione.
  I prodotti sono raggruppati per categoria, nell'ordine del catalogo.
- **Prodotti e categorie**: gestione del catalogo. ▲▼ riordinano le categorie.
  Dal menu ⋯ puoi esportare il catalogo in JSON, importarne uno (viene unito al tuo) o
  ripristinare i prodotti base che hai cancellato.
- **⚙️ Impostazioni**: il tuo nome, mostrato accanto ai prodotti che aggiungi nelle liste condivise.

## Condivisione

L'app ha due modalità, scelte in base a `firebase-config.js`:

| | Locale (default) | Firebase |
|---|---|---|
| Dove stanno le liste | solo in questo browser | nel cloud, sincronizzate |
| 📤 Condividi | link che crea una **copia** della lista | link di **invito**: chi lo apre entra nella lista |
| Modifiche degli altri | non le vedi | in tempo reale |
| Offline | sì | sì (si sincronizza quando torna la rete) |

In entrambe le modalità, dal menu ⋯ di una lista c'è anche **Invia come testo**
(per WhatsApp & co.).

### Attivare la condivisione in tempo reale (Firebase, piano gratuito)

1. Vai su <https://console.firebase.google.com> e crea un progetto (Analytics non serve).
2. **Build → Authentication → Inizia → Sign-in method**: abilita **Anonimo**.
3. **Build → Firestore Database → Crea database** (modalità produzione, regione `eur3` o vicina).
4. Nella scheda **Regole** di Firestore incolla il contenuto di [`firestore.rules`](firestore.rules) e pubblica.
5. **Impostazioni progetto → Le tue app → Web (`</>`)**: registra l'app e copia l'oggetto `firebaseConfig`.
6. Incollalo in [`firebase-config.js`](firebase-config.js) al posto di `null`.
7. Se pubblichi l'app su un dominio (es. GitHub Pages), aggiungilo in
   **Authentication → Impostazioni → Domini autorizzati**.

La configurazione web di Firebase non è segreta: la sicurezza è data dalle regole.
Con quelle incluse ogni lista è visibile solo ai suoi membri; chi ha il link d'invito
può unirsi; solo chi l'ha creata può eliminarla, gli altri possono uscirne.

Nota: il login è anonimo e legato al browser. Se cancelli i dati del sito o cambi
telefono, riapri il link d'invito per rientrare nelle liste.

## Struttura

```
spesa/
├── index.html, manifest.webmanifest, icon.svg
├── firebase-config.js        # null = modalità locale
├── firestore.rules           # regole di sicurezza da pubblicare su Firebase
└── src/
    ├── main.js               # avvio e routing (#/, #/list/:id, #/catalog, #/join/:id, #/import/:dati)
    ├── data/baseCatalog.js   # categorie e prodotti di partenza
    ├── store/
    │   ├── catalog.js        # catalogo personale (localStorage), estendibile
    │   ├── localBackend.js   # liste nel browser
    │   └── firebaseBackend.js# liste su Firestore, condivise
    ├── views/                # home, lista, catalogo, condivisione
    └── ui/dom.js             # dialog, toast, escape HTML
```

Per ampliare il **catalogo base** per tutti, modifica `src/data/baseCatalog.js`:
chi ha già l'app riceve le nuove voci con "Ripristina prodotti base mancanti".
Il catalogo personale resta sul dispositivo; per allinearlo tra familiari usa esporta/importa.
