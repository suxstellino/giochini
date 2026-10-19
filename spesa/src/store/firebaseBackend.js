// Backend condiviso su Firebase Firestore, con login anonimo.
// Ogni lista è un documento in "lists/{id}" con l'elenco dei membri; i prodotti sono
// una mappa "items" aggiornata campo per campo, così modifiche contemporanee non si pestano.
// L'id della lista è casuale e non indovinabile: chi riceve il link può unirsi.
const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';

export async function createFirebaseBackend(config) {
  const [{ initializeApp }, auth, fs] = await Promise.all([
    import(`${SDK}/firebase-app.js`),
    import(`${SDK}/firebase-auth.js`),
    import(`${SDK}/firebase-firestore.js`),
  ]);
  const {
    initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
    collection, doc, query, where, onSnapshot, setDoc, updateDoc, deleteDoc,
    arrayUnion, arrayRemove, deleteField, serverTimestamp,
  } = fs;

  const app = initializeApp(config);
  // Cache persistente: l'app funziona anche offline (es. al supermercato senza campo).
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  const authInstance = auth.getAuth(app);
  const user = await new Promise((resolve, reject) => {
    const stop = auth.onAuthStateChanged(authInstance, (u) => {
      if (u) {
        stop();
        resolve(u);
      }
    }, reject);
    auth.signInAnonymously(authInstance).catch(reject);
  });
  const uid = user.uid;

  const listRef = (id) => doc(db, 'lists', id);
  const fromSnap = (snap) => {
    const data = snap.data();
    return {
      ...data,
      id: snap.id,
      items: data.items || {},
      createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
      updatedAt: data.updatedAt?.toMillis?.() ?? Date.now(),
    };
  };
  const touch = { updatedAt: serverTimestamp() };

  return {
    mode: 'firebase',
    uid,

    subscribeLists(cb) {
      const q = query(collection(db, 'lists'), where('members', 'array-contains', uid));
      return onSnapshot(q, (snap) => cb(snap.docs.map(fromSnap)), (err) => console.error(err));
    },

    subscribeList(id, cb) {
      return onSnapshot(
        listRef(id),
        (snap) => cb(snap.exists() ? fromSnap(snap) : null),
        (err) => {
          console.error(err);
          cb(null);
        },
      );
    },

    async createList(name, items = {}) {
      const ref = doc(collection(db, 'lists'));
      await setDoc(ref, {
        name, ownerId: uid, members: [uid], items, createdAt: serverTimestamp(), ...touch,
      });
      return ref.id;
    },

    renameList(id, name) {
      return updateDoc(listRef(id), { name, ...touch });
    },

    deleteList(id) {
      return deleteDoc(listRef(id));
    },

    leaveList(id) {
      return updateDoc(listRef(id), { members: arrayRemove(uid) });
    },

    // Le regole di sicurezza permettono a chiunque sia autenticato di aggiungere
    // solo se stesso ai membri, conoscendo l'id.
    joinList(id) {
      return updateDoc(listRef(id), { members: arrayUnion(uid) });
    },

    putItem(listId, item) {
      return updateDoc(listRef(listId), { [`items.${item.id}`]: item, ...touch });
    },

    updateItem(listId, itemId, patch) {
      const fields = Object.fromEntries(
        Object.entries(patch).map(([k, v]) => [`items.${itemId}.${k}`, v]),
      );
      return updateDoc(listRef(listId), { ...fields, ...touch });
    },

    removeItems(listId, itemIds) {
      if (!itemIds.length) return Promise.resolve();
      const fields = Object.fromEntries(itemIds.map((id) => [`items.${id}`, deleteField()]));
      return updateDoc(listRef(listId), { ...fields, ...touch });
    },
  };
}
