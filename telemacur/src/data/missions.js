// Configurazione delle missioni: parametri diversi sullo stesso motore (RunnerScene).
import { makeObstacleSet, makeCreature } from '../sprites/obstacleSprites.js';
import { PALETTE } from '../sprites/palettes.js';
import {
  createMoonBackground, createVenusBackground, createMarsBackground,
  createSaturnBackground, createNeptuneBackground,
} from '../sprites/backgrounds.js';
import { AGRI, SCALINO, GASOLIO, ACQUAZZONE } from '../sprites/characterSprites.js';

export const MISSIONS = {
  moon: {
    id: 'moon',
    planetName: 'Luna',
    objectiveLabel: 'Raccogli 20 monete gialle',
    createBackground: createMoonBackground,
    createObstacles: () => makeObstacleSet(PALETTE.rockGrey, PALETTE.rockGreyDark, PALETTE.moonSurface, PALETTE.rockGreyDarker),
    objective: { type: 'yellow', target: 20 },
    coinSpawn: { yellow: 1, blue: 0, diamond: 0 },
    groundY: 460,
    baseSpeed: 260,
    maxSpeed: 480,
    speedRampPerSecond: 2.4,
    nextMissionId: 'venus',
    onCompleteShipStage: 1,
    completionMessage: 'La navicella monta dei razzi laterali!',
  },

  venus: {
    id: 'venus',
    planetName: 'Venere',
    objectiveLabel: 'Raccogli 30 monete blu',
    createBackground: createVenusBackground,
    createObstacles: () => ({
      ...makeObstacleSet(PALETTE.venusRock, PALETTE.venusOrange, PALETTE.venusRock, PALETTE.venusOrange),
      creature: makeCreature(PALETTE.venusOrange, PALETTE.venusRock, PALETTE.agriGreen, PALETTE.eyeGlow),
    }),
    objective: { type: 'blue', target: 30 },
    coinSpawn: { yellow: 0, blue: 1, diamond: 0 },
    groundY: 460,
    baseSpeed: 275,
    maxSpeed: 520,
    speedRampPerSecond: 2.6,
    nextMissionId: 'mars',
    onCompleteShipStage: 2,
    completionMessage: 'La navicella e\' potenziata da Agri!',
    npc: {
      name: 'Agri',
      sprite: AGRI.stand,
      lines: [
        'Ehi! Fermo li\'! Sei arrivato dalla Terra con quella scatola di latta?',
        'Ti ho visto schivare le rocce, niente male per uno con due gambe sole. Tieni, ho costruito questo booster io stesso.',
        'Montalo bene: saro\' anche un po\' storto, ma il mio lavoro e\' preciso!',
      ],
    },
  },

  mars: {
    id: 'mars',
    planetName: 'Marte',
    objectiveLabel: 'Raccogli 40 monete (gialle + blu)',
    createBackground: createMarsBackground,
    createObstacles: () => ({
      ...makeObstacleSet(PALETTE.marsRust, PALETTE.marsDune, PALETTE.marsDune, PALETTE.marsRust),
      creature: makeCreature(PALETTE.marsRust, PALETTE.marsDune, PALETTE.scalinoTan, PALETTE.eyeGlow),
    }),
    objective: { type: 'mixed', target: 40 },
    coinSpawn: { yellow: 0.5, blue: 0.5, diamond: 0 },
    groundY: 460,
    baseSpeed: 290,
    maxSpeed: 560,
    speedRampPerSecond: 2.8,
    nextMissionId: 'saturn',
    onCompleteShipStage: 3,
    completionMessage: 'La navicella ha un propulsore ibrido!',
    companionKey: 'scalino',
    npc: {
      name: 'Scalino',
      sprite: SCALINO.stand,
      lines: [
        'Finalmente qualcuno! Aspettavo un passaggio da secoli, praticamente.',
        'Ho smontato meta\' dei motori di questo pianeta. Ti serve un propulsore ibrido, vero?',
        'Da ora vengo con te. Due cervelli sono meglio di uno, no?',
      ],
    },
  },

  saturn: {
    id: 'saturn',
    planetName: 'Saturno',
    objectiveLabel: 'Raccogli 50 monete (gialle + blu)',
    createBackground: createSaturnBackground,
    createObstacles: () => ({
      ...makeObstacleSet(PALETTE.saturnIceDark, PALETTE.saturnRingDark, PALETTE.saturnIce, PALETTE.saturnIceDark),
      creature: makeCreature(PALETTE.saturnIceDark, PALETTE.saturnIce, PALETTE.gasolioGrey, PALETTE.eyeGlow),
    }),
    objective: { type: 'mixed', target: 50 },
    coinSpawn: { yellow: 0.5, blue: 0.5, diamond: 0 },
    groundY: 460,
    baseSpeed: 300,
    maxSpeed: 600,
    speedRampPerSecond: 3,
    nextMissionId: 'neptune',
    onCompleteShipStage: 4,
    completionMessage: 'La navicella monta super propulsori a tripla uscita!',
    npc: {
      name: 'Gasolio',
      sprite: GASOLIO.stand,
      lines: [
        'Oh, un visitatore! Passavo di qui a vendere pezzi di ricambio spaziali Premium.',
        'Vedo che la tua navicella ha ancora un solo scarico. Imbarazzante, se posso dirlo.',
        'Ecco a te: propulsori a tripla uscita. Non ringraziarmi, sono solo affari.',
      ],
    },
  },

  neptune: {
    id: 'neptune',
    planetName: 'Nettuno',
    objectiveLabel: 'Raccogli 50 monete (gialle + blu) e 3 diamanti',
    createBackground: createNeptuneBackground,
    createObstacles: () => ({
      ...makeObstacleSet(PALETTE.neptuneBlueDark, PALETTE.neptuneBlue, PALETTE.neptuneBlueDark, PALETTE.neptuneAurora),
      creature: makeCreature(PALETTE.neptuneBlueDark, PALETTE.neptuneWind, PALETTE.acquazzoneTeal, PALETTE.eyeGlow),
    }),
    objective: { type: 'mixedPlusDiamonds', target: 50, diamonds: 3, diamondsAfterSeconds: 18 },
    coinSpawn: { yellow: 0.42, blue: 0.42, diamond: 0.05 },
    groundY: 460,
    baseSpeed: 310,
    maxSpeed: 650,
    speedRampPerSecond: 3.4,
    nextMissionId: 'finishinis',
    onCompleteShipStage: 5,
    completionMessage: 'La navicella ha un modulo di teletrasporto!',
    npc: {
      name: 'Acquazzone',
      sprite: ACQUAZZONE.stand,
      lines: [
        'Con questo vento ti sei fatto tutta la strada fin qui? Rispetto.',
        'Io vendo pezzi siderali rari. Per te ho qualcosa di speciale: un modulo di teletrasporto.',
        'Con questo potrai saltare fino ad Andromeda. Ma prima... dovrai tornare sulla Terra.',
      ],
    },
  },

  // Non e' un runner: main.js riconosce questo id e avvia la sequenza dedicata del
  // finale (Terra/Benzo -> partenza -> boss -> fuga a tempo -> epilogo).
  finishinis: { id: 'finishinis', planetName: 'Finishinis', isFinale: true },
};
