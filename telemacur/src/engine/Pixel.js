// Utility per costruire sprite pixel-art da griglie testuali disegnate a mano,
// renderizzate una volta su un canvas offscreen e poi riusate con drawImage.

// rows: array di stringhe di uguale lunghezza. '.' = trasparente, ogni altro carattere
// e' una chiave nella mappa colorMap (es. {K:'#222', S:'#e8b382', ...}).
export function buildSprite(rows, colorMap, pixelSize = 4) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  if (rows.some((r) => r.length !== w)) {
    console.warn('buildSprite: righe di lunghezza diversa nella griglia', rows);
  }
  const canvas = document.createElement('canvas');
  canvas.width = w * pixelSize;
  canvas.height = h * pixelSize;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === '.' || ch === undefined) continue;
      const color = colorMap[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }
  }
  return canvas;
}

// Semplice PRNG deterministico (mulberry32) cosi' i fondali procedurali sono stabili
// tra un frame e l'altro invece di rigenerarsi a caso ogni volta.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Costruisce una riga di griglia di lunghezza esatta da coppie [carattere, ripetizioni],
// cosi' le griglie pixel-art si scrivono senza dover contare i caratteri a mano.
export function row(width, segments) {
  let s = '';
  for (const [ch, n] of segments) s += ch.repeat(n);
  if (s.length !== width) {
    console.warn(`row(): lunghezza attesa ${width}, ottenuta ${s.length}`, segments);
  }
  return s;
}

export function drawPixelRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
