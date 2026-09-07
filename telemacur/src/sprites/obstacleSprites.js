// Ostacoli generici (rocce, crateri) parametrizzati per colore, cosi' lo stesso set di
// forme si riusa su ogni pianeta cambiando solo la palette passata in missions.js.
import { buildSprite, row } from '../engine/Pixel.js';

const PX = 4;

const TALL_ROCK_ROWS = [
  row(8, [['.', 3], ['r', 2], ['.', 3]]),
  row(8, [['.', 2], ['r', 4], ['.', 2]]),
  row(8, [['.', 1], ['r', 6], ['.', 1]]),
  row(8, [['r', 8]]),
  row(8, [['r', 8]]),
  row(8, [['r', 8]]),
  row(8, [['r', 1], ['d', 6], ['r', 1]]),
  row(8, [['r', 8]]),
  row(8, [['.', 1], ['r', 6], ['.', 1]]),
  row(8, [['.', 2], ['d', 4], ['.', 2]]),
];

const SMALL_ROCK_ROWS = [
  row(8, [['.', 2], ['r', 4], ['.', 2]]),
  row(8, [['.', 1], ['r', 6], ['.', 1]]),
  row(8, [['r', 8]]),
  row(8, [['r', 1], ['d', 6], ['r', 1]]),
  row(8, [['.', 1], ['r', 6], ['.', 1]]),
  row(8, [['.', 2], ['d', 4], ['.', 2]]),
];

const CRATER_ROWS = [
  row(12, [['.', 2], ['r', 8], ['.', 2]]),
  row(12, [['r', 12]]),
  row(12, [['r', 2], ['d', 8], ['r', 2]]),
  row(12, [['r', 12]]),
  row(12, [['.', 1], ['r', 10], ['.', 1]]),
];

// Creatura aliena semplice (usata dalla missione di Marte in poi): corpo basso con
// antenna, resa minacciosa quanto basta per un runner a un tasto solo.
const CREATURE_ROWS = [
  row(9, [['.', 3], ['a', 1], ['.', 1], ['a', 1], ['.', 3]]),
  row(9, [['.', 2], ['c', 5], ['.', 2]]),
  row(9, [['.', 1], ['c', 2], ['e', 1], ['c', 1], ['e', 1], ['c', 2], ['.', 1]]),
  row(9, [['c', 9]]),
  row(9, [['c', 9]]),
  row(9, [['.', 1], ['c', 7], ['.', 1]]),
  row(9, [['.', 2], ['d', 1], ['.', 3], ['d', 1], ['.', 2]]),
];

function build(rows, r, d) {
  return buildSprite(rows, { r, d }, PX);
}

export function makeObstacleSet(rockColor, rockDark, craterColor, craterDark) {
  return {
    tallRock: build(TALL_ROCK_ROWS, rockColor, rockDark),
    smallRock: build(SMALL_ROCK_ROWS, rockColor, rockDark),
    crater: build(CRATER_ROWS, craterColor, craterDark),
  };
}

export function makeCreature(bodyColor, darkColor, antennaColor, eyeColor) {
  return buildSprite(CREATURE_ROWS, { c: bodyColor, d: darkColor, a: antennaColor, e: eyeColor }, PX);
}
