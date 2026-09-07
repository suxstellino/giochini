// Oggetti di scena del finale: l'arma di Luciastro, la pizza dell'epilogo, la leva del
// boss. Piccoli sprite pixel-art, stessa tecnica degli altri (griglie -> buildSprite).
import { buildSprite, row } from '../engine/Pixel.js';
import { PALETTE } from './palettes.js';

const PX = 4;

const WEAPON_ROWS = [
  row(6, [['.', 2], ['g', 2], ['.', 2]]),
  row(6, [['.', 1], ['g', 4], ['.', 1]]),
  row(6, [['.', 2], ['s', 2], ['.', 2]]),
  row(6, [['.', 2], ['s', 2], ['.', 2]]),
  row(6, [['.', 2], ['s', 2], ['.', 2]]),
  row(6, [['.', 1], ['d', 4], ['.', 1]]),
];
export const WEAPON_SPRITE = buildSprite(WEAPON_ROWS, {
  g: PALETTE.weaponGlow, s: PALETTE.luciastroPurple, d: PALETTE.luciastroPurpleDark,
}, PX);

// Razzo sparato da Luciastro contro Telemacur durante la traversata delle piattaforme.
// Punta a sinistra (viaggia verso il giocatore, che si trova a ovest).
const ROCKET_ROWS = [
  row(10, [['.', 4], ['m', 4], ['.', 2]]),
  row(10, [['n', 2], ['m', 6], ['.', 2]]),
  row(10, [['n', 2], ['m', 4], ['f', 2], ['.', 2]]),
  row(10, [['n', 2], ['m', 4], ['f', 2], ['.', 2]]),
  row(10, [['n', 2], ['m', 6], ['.', 2]]),
  row(10, [['.', 4], ['m', 4], ['.', 2]]),
];
export const ROCKET_SPRITE = buildSprite(ROCKET_ROWS, {
  n: PALETTE.lavaOrange, m: PALETTE.metalMid, f: PALETTE.boosterFlame,
}, PX);

// La pizza e' disegnata direttamente con forme canvas (cerchi) invece che a griglia:
// e' rotonda, una griglia quadrata sprecherebbe piu' pixel di quanti ne servano.
export function drawPizza(ctx, cx, cy, radius) {
  ctx.fillStyle = PALETTE.pizzaCrust;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.pizzaDough;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.88, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.pizzaSauce;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.74, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.pizzaCheese;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.68, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.pizzaPepperoni;
  const spots = [[-0.3, -0.2], [0.25, -0.3], [0, 0.15], [-0.35, 0.3], [0.35, 0.25]];
  for (const [ox, oy] of spots) {
    ctx.beginPath();
    ctx.arc(cx + ox * radius, cy + oy * radius, radius * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
}
