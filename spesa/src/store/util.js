export function newId(prefix = '') {
  const rand = crypto.getRandomValues(new Uint8Array(12));
  const id = Array.from(rand, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 20);
  return prefix ? `${prefix}-${id}` : id;
}

// Nome mostrato accanto ai prodotti aggiunti, per sapere chi ha messo cosa in lista.
const NAME_KEY = 'spesa.userName';

export function getUserName() {
  return localStorage.getItem(NAME_KEY) || '';
}

export function setUserName(name) {
  localStorage.setItem(NAME_KEY, name.trim());
}
