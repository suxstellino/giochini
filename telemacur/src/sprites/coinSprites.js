// Monete gialle, blu e diamanti. Ogni tipo ha 2 frame (con/ senza luccichio) per una
// piccola animazione a scintillio mentre scorrono sullo schermo.
import { buildSprite, row } from '../engine/Pixel.js';
import { PALETTE } from './palettes.js';

const PX = 4;

const ROUND_ROWS_A = [
  row(8, [['.', 2], ['d', 4], ['.', 2]]),
  row(8, [['.', 1], ['c', 6], ['.', 1]]),
  row(8, [['c', 1], ['s', 1], ['c', 6]]),
  row(8, [['c', 8]]),
  row(8, [['c', 8]]),
  row(8, [['c', 8]]),
  row(8, [['.', 1], ['c', 6], ['.', 1]]),
  row(8, [['.', 2], ['d', 4], ['.', 2]]),
];

const ROUND_ROWS_B = [
  row(8, [['.', 2], ['d', 4], ['.', 2]]),
  row(8, [['.', 1], ['c', 6], ['.', 1]]),
  row(8, [['c', 8]]),
  row(8, [['c', 8]]),
  row(8, [['c', 1], ['s', 1], ['c', 6]]),
  row(8, [['c', 8]]),
  row(8, [['.', 1], ['c', 6], ['.', 1]]),
  row(8, [['.', 2], ['d', 4], ['.', 2]]),
];

const DIAMOND_ROWS_A = [
  row(8, [['.', 3], ['c', 2], ['.', 3]]),
  row(8, [['.', 2], ['c', 4], ['.', 2]]),
  row(8, [['.', 1], ['c', 1], ['s', 1], ['c', 4], ['.', 1]]),
  row(8, [['c', 8]]),
  row(8, [['c', 8]]),
  row(8, [['.', 1], ['c', 6], ['.', 1]]),
  row(8, [['.', 2], ['c', 4], ['.', 2]]),
  row(8, [['.', 3], ['d', 2], ['.', 3]]),
];

const DIAMOND_ROWS_B = [
  row(8, [['.', 3], ['c', 2], ['.', 3]]),
  row(8, [['.', 2], ['c', 4], ['.', 2]]),
  row(8, [['.', 1], ['c', 6], ['.', 1]]),
  row(8, [['c', 4], ['s', 1], ['c', 3]]),
  row(8, [['c', 8]]),
  row(8, [['.', 1], ['c', 6], ['.', 1]]),
  row(8, [['.', 2], ['c', 4], ['.', 2]]),
  row(8, [['.', 3], ['d', 2], ['.', 3]]),
];

function makeCoin(rowsA, rowsB, c, d, s) {
  const colors = { c, d, s };
  return { a: buildSprite(rowsA, colors, PX), b: buildSprite(rowsB, colors, PX) };
}

export const COIN_YELLOW = makeCoin(ROUND_ROWS_A, ROUND_ROWS_B, PALETTE.yellowCoin, PALETTE.yellowCoinDark, PALETTE.white);
export const COIN_BLUE = makeCoin(ROUND_ROWS_A, ROUND_ROWS_B, PALETTE.blueCoin, PALETTE.blueCoinDark, PALETTE.white);
export const COIN_DIAMOND = makeCoin(DIAMOND_ROWS_A, DIAMOND_ROWS_B, PALETTE.diamond, PALETTE.diamondDark, PALETTE.white);

export const COIN_SIZE = 8 * PX;
