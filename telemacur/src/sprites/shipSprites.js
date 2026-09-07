// Navicella di Telemacur: 6 stadi visivi distinti, sbloccati ai passaggi di missione.
// 0 Base (Terra) -> 1 Razzi laterali (dopo Luna) -> 2 Potenziata da Agri (dopo Venere)
// -> 3 Propulsore ibrido/doppio (dopo Marte) -> 4 Tripla uscita (dopo Saturno)
// -> 5 Teletrasporto (dopo Nettuno)
import { buildSprite, row } from '../engine/Pixel.js';
import { PALETTE } from './palettes.js';

const PX = 4;

// Corpo base: muso, fusoliera, oblo' di pilotaggio, alette di coda. Condiviso da tutti gli stadi.
const CORE_ROWS = [
  row(14, [['.', 5], ['n', 4], ['.', 5]]),
  row(14, [['.', 3], ['n', 8], ['.', 3]]),
  row(14, [['.', 1], ['m', 12], ['.', 1]]),
  row(14, [['.', 1], ['m', 3], ['w', 4], ['m', 5], ['.', 1]]),
  row(14, [['.', 1], ['m', 12], ['.', 1]]),
  row(14, [['f', 2], ['.', 1], ['m', 9], ['.', 1], ['f', 1]]),
];

const BOOSTER_TOP = row(14, [['.', 3], ['k', 3], ['.', 8]]);
const BOOSTER_BOTTOM = row(14, [['.', 3], ['k', 3], ['.', 8]]);
const ENGINE_NUB_2 = row(14, [['.', 2], ['e', 2], ['.', 2], ['e', 2], ['.', 6]]);
const ENGINE_NUB_3 = row(14, [['.', 1], ['e', 2], ['.', 2], ['e', 2], ['.', 2], ['e', 2], ['.', 3]]);

function ship(rows, colors) {
  return buildSprite(rows, colors, PX);
}

const BASE_COLORS = { n: PALETTE.metalLight, m: PALETTE.metalMid, w: PALETTE.cockpit, f: PALETTE.metalDark };

export const SHIP_STAGES = [
  {
    name: 'Base',
    sprite: ship(CORE_ROWS, { ...BASE_COLORS }),
    flameCount: 1,
  },
  {
    name: 'Razzi laterali',
    sprite: ship([BOOSTER_TOP, ...CORE_ROWS, BOOSTER_BOTTOM], { ...BASE_COLORS, k: PALETTE.metalDark }),
    flameCount: 1,
  },
  {
    name: 'Potenziata da Agri',
    sprite: ship([BOOSTER_TOP, ...CORE_ROWS, BOOSTER_BOTTOM], {
      ...BASE_COLORS, f: PALETTE.boosterGreen, k: PALETTE.boosterGreen,
    }),
    flameCount: 1,
  },
  {
    name: 'Propulsore ibrido',
    sprite: ship([BOOSTER_TOP, ...CORE_ROWS, BOOSTER_BOTTOM, ENGINE_NUB_2], {
      ...BASE_COLORS, f: PALETTE.boosterGreen, k: PALETTE.boosterGreen, e: PALETTE.metalMid,
    }),
    flameCount: 2,
  },
  {
    name: 'Tripla uscita',
    sprite: ship([BOOSTER_TOP, ...CORE_ROWS, BOOSTER_BOTTOM, ENGINE_NUB_2, ENGINE_NUB_3], {
      ...BASE_COLORS, f: PALETTE.boosterTeal, k: PALETTE.boosterTeal, e: PALETTE.boosterOrange,
    }),
    flameCount: 3,
  },
  {
    name: 'Teletrasporto',
    sprite: ship([BOOSTER_TOP, ...CORE_ROWS, BOOSTER_BOTTOM, ENGINE_NUB_2, ENGINE_NUB_3], {
      ...BASE_COLORS, f: PALETTE.boosterTeal, k: PALETTE.boosterTeal, e: PALETTE.boosterOrange,
    }),
    flameCount: 3,
    hasTeleport: true,
  },
];

// Disegna i getti di propulsione a sinistra della navicella (la prua e' a destra).
// shipX/shipY/shipW/shipH sono il rettangolo su schermo della navicella.
export function drawEngineFlames(ctx, shipX, shipY, shipW, shipH, stageIndex, time) {
  const stage = SHIP_STAGES[stageIndex] || SHIP_STAGES[0];
  const count = stage.flameCount;
  const flicker = 0.75 + 0.25 * Math.sin(time * 30);
  const baseLen = 14 * flicker;
  const slotH = shipH / (count + 1);
  for (let i = 0; i < count; i++) {
    const y = shipY + slotH * (i + 1);
    const len = baseLen * (0.8 + 0.2 * Math.sin(time * 20 + i));
    ctx.fillStyle = PALETTE.boosterOrange;
    ctx.fillRect(shipX - len, y - 4, len, 8);
    ctx.fillStyle = PALETTE.boosterFlame;
    ctx.fillRect(shipX - len * 0.55, y - 2, len * 0.55, 4);
  }
}

// Alone di teletrasporto per lo stadio finale della navicella.
export function drawTeleportRing(ctx, cx, cy, radius, time) {
  ctx.save();
  ctx.globalAlpha = 0.5 + 0.3 * Math.sin(time * 4);
  ctx.strokeStyle = PALETTE.cockpit;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius, radius * 0.4, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
