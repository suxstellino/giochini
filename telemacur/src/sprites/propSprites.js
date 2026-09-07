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

const LEVER_ROWS = [
  row(6, [['.', 2], ['k', 2], ['.', 2]]),
  row(6, [['.', 2], ['k', 2], ['.', 2]]),
  row(6, [['k', 6]]),
  row(6, [['.', 1], ['b', 4], ['.', 1]]),
];
export const LEVER_SPRITE = buildSprite(LEVER_ROWS, {
  k: PALETTE.metalDark, b: PALETTE.metalLight,
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
