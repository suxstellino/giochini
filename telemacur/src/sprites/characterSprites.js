// Sprite pixel-art di Telemacur e dei personaggi non giocanti, costruiti da griglie
// testuali (vedi engine/Pixel.js). Palette bassa, coerente in tutto il gioco.
import { buildSprite, row } from '../engine/Pixel.js';
import { PALETTE } from './palettes.js';

const PX = 4; // dimensione di un "pixel" di gioco in pixel reali dello schermo

// --- Telemacur -------------------------------------------------------------
// Busto comune (10 colonne x 10 righe): spuntoni di capelli, viso, tuta con taschino.
const TELEMACUR_UPPER = [
  row(10, [['.', 1], ['h', 2], ['.', 1], ['h', 2], ['.', 1], ['h', 2], ['.', 1]]),
  row(10, [['.', 1], ['h', 8], ['.', 1]]),
  row(10, [['h', 10]]),
  row(10, [['.', 1], ['s', 8], ['.', 1]]),
  row(10, [['.', 1], ['s', 1], ['k', 1], ['.', 1], ['s', 2], ['.', 1], ['k', 1], ['s', 1], ['.', 1]]),
  row(10, [['.', 1], ['s', 8], ['.', 1]]),
  row(10, [['.', 2], ['b', 6], ['.', 2]]),
  row(10, [['.', 1], ['s', 1], ['b', 6], ['s', 1], ['.', 1]]),
  row(10, [['.', 1], ['s', 1], ['b', 2], ['p', 1], ['b', 3], ['s', 1], ['.', 1]]),
  row(10, [['.', 1], ['d', 1], ['b', 6], ['d', 1], ['.', 1]]),
];

const HIP_ROW = row(10, [['.', 1], ['d', 2], ['.', 4], ['d', 2], ['.', 1]]);
const BOTH_BOOTS = row(10, [['.', 1], ['o', 2], ['.', 4], ['o', 2], ['.', 1]]);
const LEFT_BOOT_ONLY = row(10, [['.', 1], ['o', 2], ['.', 7]]);
const RIGHT_BOOT_ONLY = row(10, [['.', 7], ['o', 2], ['.', 1]]);
const NO_BOOTS = row(10, [['.', 10]]);

const TELEMACUR_COLORS = {
  h: PALETTE.hairDark,
  s: PALETTE.skin,
  k: PALETTE.outline,
  b: PALETTE.suitBlue,
  p: PALETTE.suitPocket,
  d: PALETTE.suitBlueDark,
  o: PALETTE.boot,
};

function telemacurFrame(legRows) {
  return buildSprite([...TELEMACUR_UPPER, HIP_ROW, HIP_ROW, ...legRows], TELEMACUR_COLORS, PX);
}

export const TELEMACUR = {
  stand: telemacurFrame([BOTH_BOOTS, BOTH_BOOTS]),
  runA: telemacurFrame([BOTH_BOOTS, LEFT_BOOT_ONLY]),
  runB: telemacurFrame([BOTH_BOOTS, RIGHT_BOOT_ONLY]),
  jump: telemacurFrame([BOTH_BOOTS, NO_BOOTS]),
  width: 10 * PX,
  height: 14 * PX,
};

// --- Generico umanoide (Scalino, Benzo) ------------------------------------
function buildHumanoid(colors) {
  const head = [
    row(10, [['.', 1], ['h', 8], ['.', 1]]),
    row(10, [['h', 10]]),
    row(10, [['h', 1], ['.', 1], ['k', 2], ['.', 2], ['k', 2], ['.', 1], ['h', 1]]),
    row(10, [['h', 10]]),
  ];
  const torso = [
    row(10, [['.', 2], ['b', 6], ['.', 2]]),
    row(10, [['.', 1], ['g', 1], ['b', 6], ['g', 1], ['.', 1]]),
    row(10, [['.', 1], ['g', 1], ['b', 2], ['a', 1], ['b', 3], ['g', 1], ['.', 1]]),
    row(10, [['.', 1], ['d', 1], ['b', 6], ['d', 1], ['.', 1]]),
  ];
  const legs = [
    row(10, [['.', 1], ['d', 2], ['.', 4], ['d', 2], ['.', 1]]),
    row(10, [['.', 1], ['d', 2], ['.', 4], ['d', 2], ['.', 1]]),
    row(10, [['.', 1], ['o', 2], ['.', 4], ['o', 2], ['.', 1]]),
    row(10, [['.', 1], ['o', 2], ['.', 4], ['o', 2], ['.', 1]]),
  ];
  return buildSprite([...head, ...torso, ...legs], colors, PX);
}

export const SCALINO = {
  stand: buildHumanoid({
    h: PALETTE.scalinoTan, k: PALETTE.outline, b: PALETTE.scalinoTanDark,
    g: PALETTE.scalinoTan, a: PALETTE.metalMid, d: PALETTE.scalinoTanDark, o: PALETTE.boot,
  }),
  width: 10 * PX, height: 12 * PX,
};

export const BENZO = {
  stand: buildHumanoid({
    h: PALETTE.benzoOrange, k: PALETTE.outline, b: PALETTE.benzoOrangeDark,
    g: PALETTE.benzoOrange, a: PALETTE.metalLight, d: PALETTE.benzoOrangeDark, o: PALETTE.boot,
  }),
  width: 10 * PX, height: 12 * PX,
};

// --- Agri (alieno di Venere, minuto, un po' storto) ------------------------
const AGRI_ROWS = [
  row(10, [['.', 2], ['o', 1], ['.', 4], ['o', 1], ['.', 2]]),
  row(10, [['.', 2], ['a', 1], ['.', 4], ['a', 1], ['.', 2]]),
  row(10, [['.', 1], ['g', 8], ['.', 1]]),
  row(10, [['g', 10]]),
  row(10, [['g', 1], ['.', 1], ['k', 1], ['.', 2], ['k', 1], ['.', 1], ['g', 2], ['.', 1]]),
  row(10, [['g', 10]]),
  row(10, [['.', 1], ['g', 8], ['.', 1]]),
  row(10, [['.', 2], ['g', 6], ['.', 2]]),
  row(10, [['.', 3], ['g', 4], ['.', 3]]),
  row(10, [['.', 2], ['g', 1], ['d', 3], ['g', 1], ['.', 3]]),
  row(10, [['.', 3], ['g', 1], ['.', 2], ['g', 1], ['.', 3]]),
  row(10, [['.', 2], ['o', 1], ['.', 4], ['o', 1], ['.', 2]]),
];
export const AGRI = {
  stand: buildSprite(AGRI_ROWS, {
    o: PALETTE.white, a: PALETTE.agriGreenDark, g: PALETTE.agriGreen,
    k: PALETTE.outline, d: PALETTE.agriGreenDark,
  }, PX),
  width: 10 * PX, height: 12 * PX,
};

// --- Gasolio (venditore peloso/nuvoloso di Saturno) -------------------------
const GASOLIO_ROWS = [
  row(10, [['.', 2], ['g', 1], ['.', 1], ['g', 2], ['.', 1], ['g', 1], ['.', 2]]),
  row(10, [['.', 1], ['g', 8], ['.', 1]]),
  row(10, [['g', 10]]),
  row(10, [['g', 2], ['.', 1], ['k', 2], ['.', 2], ['k', 1], ['g', 2]]),
  row(10, [['g', 10]]),
  row(10, [['g', 10]]),
  row(10, [['.', 1], ['g', 8], ['.', 1]]),
  row(10, [['.', 1], ['g', 8], ['.', 1]]),
  row(10, [['.', 2], ['g', 6], ['.', 2]]),
  row(10, [['.', 2], ['g', 1], ['.', 4], ['g', 1], ['.', 2]]),
  row(10, [['.', 2], ['o', 1], ['.', 4], ['o', 1], ['.', 2]]),
];
export const GASOLIO = {
  stand: buildSprite(GASOLIO_ROWS, {
    g: PALETTE.gasolioGrey, k: PALETTE.outline, o: PALETTE.gasolioGreyDark,
  }, PX),
  width: 10 * PX, height: 11 * PX,
};

// --- Acquazzone (venditore a forma di goccia di Nettuno) -------------------
const ACQUAZZONE_ROWS = [
  row(10, [['.', 4], ['t', 2], ['.', 4]]),
  row(10, [['.', 3], ['t', 4], ['.', 3]]),
  row(10, [['.', 2], ['t', 6], ['.', 2]]),
  row(10, [['.', 1], ['t', 8], ['.', 1]]),
  row(10, [['t', 2], ['.', 1], ['k', 2], ['.', 2], ['t', 2], ['.', 1]]),
  row(10, [['t', 10]]),
  row(10, [['t', 10]]),
  row(10, [['.', 1], ['t', 8], ['.', 1]]),
  row(10, [['.', 2], ['t', 6], ['.', 2]]),
  row(10, [['.', 3], ['t', 1], ['.', 2], ['t', 1], ['.', 3]]),
  row(10, [['.', 3], ['d', 1], ['.', 2], ['d', 1], ['.', 3]]),
];
export const ACQUAZZONE = {
  stand: buildSprite(ACQUAZZONE_ROWS, {
    t: PALETTE.acquazzoneTeal, k: PALETTE.outline, d: PALETTE.acquazzoneTealDark,
  }, PX),
  width: 10 * PX, height: 11 * PX,
};

// --- Luciastro (boss finale su Finishinis) ----------------------------------
const LUCIASTRO_ROWS = [
  row(12, [['.', 2], ['d', 1], ['.', 6], ['d', 1], ['.', 2]]),
  row(12, [['.', 1], ['d', 2], ['.', 6], ['d', 2], ['.', 1]]),
  row(12, [['.', 1], ['b', 10], ['.', 1]]),
  row(12, [['b', 12]]),
  row(12, [['b', 2], ['e', 2], ['.', 4], ['e', 2], ['b', 2]]),
  row(12, [['b', 12]]),
  row(12, [['.', 1], ['b', 10], ['.', 1]]),
  row(12, [['.', 1], ['b', 10], ['.', 1]]),
  row(12, [['.', 2], ['b', 8], ['.', 2]]),
  row(12, [['.', 1], ['b', 2], ['d', 6], ['b', 2], ['.', 1]]),
  row(12, [['.', 1], ['d', 10], ['.', 1]]),
  row(12, [['.', 2], ['b', 8], ['.', 2]]),
  row(12, [['.', 2], ['b', 2], ['.', 4], ['b', 2], ['.', 2]]),
  row(12, [['.', 2], ['b', 2], ['.', 4], ['b', 2], ['.', 2]]),
  row(12, [['.', 2], ['d', 2], ['.', 4], ['d', 2], ['.', 2]]),
];
export const LUCIASTRO = {
  stand: buildSprite(LUCIASTRO_ROWS, {
    d: PALETTE.luciastroPurpleDark, b: PALETTE.luciastroPurple, e: PALETTE.eyeGlow,
  }, PX),
  width: 12 * PX, height: 15 * PX,
};
