// Fondali proceduali a parallasse. Ogni pianeta ha almeno 3 livelli (lontano/medio/vicino)
// che scorrono a velocita' diverse rispetto al terreno per dare profondita'.
import { makeRng } from '../engine/Pixel.js';
import { PALETTE } from './palettes.js';

// Genera N feature deterministiche (stesso seed = stesso fondale ad ogni partita) distribuite
// su una tile larga `tileWidth`, cosi' il livello puo' scorrere all'infinito ripetendosi.
function generateFeatures(seed, count, tileWidth, factory) {
  const rng = makeRng(seed);
  const features = [];
  for (let i = 0; i < count; i++) {
    features.push(factory(rng, i));
  }
  return features;
}

// Disegna un livello ripetendo la sua tile quante volte serve per coprire la larghezza dello
// schermo, in base allo scroll orizzontale accumulato e al proprio fattore di velocita'.
function renderLayer(ctx, layer, scrollX, width, height, groundY) {
  const shift = (scrollX * layer.speed) % layer.tileWidth;
  const repeats = Math.ceil(width / layer.tileWidth) + 2;
  for (let r = -1; r < repeats; r++) {
    const baseX = r * layer.tileWidth - shift;
    for (const f of layer.features) {
      layer.drawFeature(ctx, f, baseX, height, groundY);
    }
  }
}

function makeLayer(speed, tileWidth, seed, count, factory, drawFeature) {
  return {
    speed,
    tileWidth,
    features: generateFeatures(seed, count, tileWidth, factory),
    drawFeature,
  };
}

// --- Luna --------------------------------------------------------------------
// Superficie grigia craterizzata, Terra piccola sullo sfondo, stelle, niente atmosfera.
export function createMoonBackground() {
  const starsLayer = makeLayer(0.04, 480, 1001, 40,
    (rng) => ({ x: rng() * 480, y: rng() * 260, size: rng() < 0.15 ? 3 : 1.5 }),
    (ctx, f, baseX) => {
      ctx.fillStyle = PALETTE.starWhite;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(baseX + f.x, f.y, f.size, f.size);
      ctx.globalAlpha = 1;
    });

  const midCraters = makeLayer(0.2, 400, 2002, 8,
    (rng) => ({ x: rng() * 400, r: 14 + rng() * 22, riseAbove: 24 }),
    (ctx, f, baseX, height, groundY) => {
      ctx.fillStyle = PALETTE.rockGreyDark;
      ctx.beginPath();
      ctx.ellipse(baseX + f.x, groundY - f.riseAbove, f.r, f.r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    });

  const nearCraters = makeLayer(0.5, 300, 3003, 7,
    (rng) => ({ x: rng() * 300, r: 18 + rng() * 26, riseAbove: 12 }),
    (ctx, f, baseX, height, groundY) => {
      ctx.fillStyle = PALETTE.rockGreyDarker;
      ctx.beginPath();
      ctx.ellipse(baseX + f.x, groundY - f.riseAbove, f.r, f.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    });

  return {
    skyTop: PALETTE.spaceBlack,
    skyBottom: '#12121f',
    groundColor: PALETTE.moonSurface,
    groundLineColor: PALETTE.rockGreyDarker,
    earth: { x: 800, y: 70, r: 26 },
    layers: [starsLayer, midCraters, nearCraters],
    render(ctx, scrollX, width, height, groundY = height - 60) {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, this.skyTop);
      grad.addColorStop(1, this.skyBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Terra piccola e lontana, quasi immobile per dare senso di distanza enorme.
      const ex = this.earth.x - scrollX * 0.02;
      const wrappedEx = ((ex % (width + 200)) + (width + 200)) % (width + 200) - 100;
      ctx.fillStyle = PALETTE.earthBlue;
      ctx.beginPath();
      ctx.arc(wrappedEx, this.earth.y, this.earth.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.earthGreen;
      ctx.beginPath();
      ctx.arc(wrappedEx - 6, this.earth.y + 4, this.earth.r * 0.4, 0, Math.PI * 2);
      ctx.fill();

      for (const layer of this.layers) {
        renderLayer(ctx, layer, scrollX, width, height, groundY);
      }
    },
  };
}

// Fondale generico: cielo a gradiente, eventuale "oggetto lontano" unico (una luna, gli
// anelli di Saturno...) con parallasse propria, poi N livelli di feature ripetute.
function makeBackground(cfg) {
  // Il render generico basta a quasi tutti i pianeti; Saturno ne passa uno suo (per
  // disegnare l'orizzonte dell'anello) che qui NON va sovrascritto dallo spread.
  function defaultRender(ctx, scrollX, width, height, groundY = height - 60) {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, this.skyTop);
    grad.addColorStop(1, this.skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    if (this.farObject) {
      const fx = this.farObject.x - scrollX * this.farObject.speedFactor;
      const wrapped = ((fx % (width + 300)) + (width + 300)) % (width + 300) - 150;
      this.farObject.draw(ctx, wrapped, this.farObject.y);
    }

    for (const layer of this.layers) {
      renderLayer(ctx, layer, scrollX, width, height, groundY);
    }
  }

  return {
    ...cfg,
    render: cfg.render || defaultRender,
  };
}

// --- Venere --------------------------------------------------------------------
// Giallo/arancio denso, atmosfera nebbiosa a strati, silhouette rocciose.
export function createVenusBackground() {
  const haze = makeLayer(0.06, 500, 4001, 6,
    (rng) => ({ x: rng() * 500, y: 90 + rng() * 160, w: 70 + rng() * 90, h: 26 + rng() * 18 }),
    (ctx, f, baseX) => {
      ctx.fillStyle = PALETTE.venusHaze;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.ellipse(baseX + f.x, f.y, f.w, f.h, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

  const spires = makeLayer(0.25, 420, 4002, 7,
    (rng) => ({ x: rng() * 420, w: 16 + rng() * 14, h: 40 + rng() * 60 }),
    (ctx, f, baseX, height, groundY) => {
      ctx.fillStyle = PALETTE.venusRock;
      ctx.beginPath();
      ctx.moveTo(baseX + f.x - f.w / 2, groundY);
      ctx.lineTo(baseX + f.x, groundY - f.h);
      ctx.lineTo(baseX + f.x + f.w / 2, groundY);
      ctx.closePath();
      ctx.fill();
    });

  const fog = makeLayer(0.55, 360, 4003, 6,
    (rng) => ({ x: rng() * 360, w: 90 + rng() * 70, h: 30 + rng() * 20 }),
    (ctx, f, baseX, height, groundY) => {
      ctx.fillStyle = PALETTE.venusHaze;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.ellipse(baseX + f.x, groundY - 6, f.w, f.h, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

  return makeBackground({
    skyTop: PALETTE.venusYellow,
    skyBottom: PALETTE.venusOrange,
    groundColor: PALETTE.venusRock,
    groundLineColor: PALETTE.venusOrange,
    layers: [haze, spires, fog],
  });
}

// --- Marte -----------------------------------------------------------------
// Rosso/ruggine, dune, tempesta di sabbia leggera, canyon in lontananza.
export function createMarsBackground() {
  const canyons = makeLayer(0.1, 500, 5001, 5,
    (rng) => ({ x: rng() * 500, w: 140 + rng() * 100, riseAbove: 10 + rng() * 14 }),
    (ctx, f, baseX, height, groundY) => {
      ctx.fillStyle = PALETTE.marsRust;
      ctx.beginPath();
      ctx.ellipse(baseX + f.x, groundY - f.riseAbove, f.w, 22, 0, 0, Math.PI * 2);
      ctx.fill();
    });

  const dunes = makeLayer(0.28, 400, 5002, 7,
    (rng) => ({ x: rng() * 400, r: 40 + rng() * 40, riseAbove: 16 + rng() * 10 }),
    (ctx, f, baseX, height, groundY) => {
      ctx.fillStyle = PALETTE.marsDune;
      ctx.beginPath();
      ctx.ellipse(baseX + f.x, groundY - f.riseAbove, f.r, f.r * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    });

  const sandstorm = makeLayer(0.65, 220, 5003, 12,
    (rng) => ({ x: rng() * 220, y: 60 + rng() * (460 - 60), len: 20 + rng() * 30 }),
    (ctx, f, baseX) => {
      ctx.fillStyle = PALETTE.marsSandstorm;
      ctx.globalAlpha = 0.35;
      ctx.fillRect(baseX + f.x, f.y, f.len, 2);
      ctx.globalAlpha = 1;
    });

  return makeBackground({
    skyTop: PALETTE.marsRed,
    skyBottom: PALETTE.marsRust,
    groundColor: PALETTE.marsDune,
    groundLineColor: PALETTE.marsRust,
    layers: [canyons, dunes, sandstorm],
  });
}

// --- Saturno -----------------------------------------------------------------
// Superficie ghiacciata di una luna, con gli anelli di Saturno enormi sullo sfondo.
export function createSaturnBackground() {
  const ridges = makeLayer(0.2, 450, 6002, 6,
    (rng) => ({ x: rng() * 450, r: 20 + rng() * 30, riseAbove: 20 + rng() * 14 }),
    (ctx, f, baseX, height, groundY) => {
      ctx.fillStyle = PALETTE.saturnIceDark;
      ctx.beginPath();
      ctx.ellipse(baseX + f.x, groundY - f.riseAbove, f.r, f.r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    });

  const iceChunks = makeLayer(0.5, 300, 6003, 8,
    (rng) => ({ x: rng() * 300, r: 12 + rng() * 18, riseAbove: 8 + rng() * 8 }),
    (ctx, f, baseX, height, groundY) => {
      ctx.fillStyle = PALETTE.saturnIce;
      ctx.beginPath();
      ctx.ellipse(baseX + f.x, groundY - f.riseAbove, f.r, f.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    });

  return makeBackground({
    skyTop: '#070a14',
    skyBottom: '#16222c',
    groundColor: PALETTE.saturnIce,
    groundLineColor: PALETTE.saturnIceDark,
    layers: [ridges, iceChunks],
    render(ctx, scrollX, width, height, groundY) {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, this.skyTop);
      grad.addColorStop(1, this.skyBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Siamo SU una luna di Saturno, dentro il piano degli anelli: se ne vede solo il
      // bordo enorme che sbuca all'orizzonte, non il pianeta intero a meta' cielo.
      drawRingHorizon(ctx, width, groundY, scrollX);

      for (const layer of this.layers) {
        renderLayer(ctx, layer, scrollX, width, height, groundY);
      }
    },
  });
}

// L'anello e' un'unica fascia enorme vista quasi di taglio: si disegna come una serie
// di archi molto larghi (il centro sta ben sotto il fondo dello schermo) e ruotati,
// cosi' nel riquadro visibile taglia il cielo in diagonale, alto e imponente, invece
// di essere un filo sottile appoggiato all'orizzonte.
function drawRingHorizon(ctx, width, groundY, scrollX) {
  const cx = width / 2 - scrollX * 0.02;
  const HIDDEN = 780; // quanto il centro dell'ellisse enorme sta sotto il fondo dello schermo
  const cy = groundY + HIDDEN;
  const rx = width * 1.8;
  const tilt = -0.34; // taglio diagonale, non un anello piatto sull'orizzonte
  // riseAbove = altezza sopra la linea del terreno a cui arriva il bordo di ogni fascia
  // (nel punto piu' alto della curva): valori grandi per dare senso di scala enorme.
  const bands = [
    { riseAbove: 40, color: PALETTE.saturnRingDark, w: 22, alpha: 0.5 },
    { riseAbove: 85, color: PALETTE.saturnRing, w: 36, alpha: 0.55 },
    { riseAbove: 140, color: PALETTE.saturnPlanetLight, w: 15, alpha: 0.4 },
    { riseAbove: 185, color: PALETTE.saturnRingDark, w: 32, alpha: 0.5 },
    { riseAbove: 240, color: PALETTE.saturnRing, w: 22, alpha: 0.4 },
    { riseAbove: 285, color: PALETTE.saturnRingDark, w: 12, alpha: 0.35 },
  ];
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, groundY);
  ctx.clip();
  for (const b of bands) {
    ctx.strokeStyle = b.color;
    ctx.lineWidth = b.w;
    ctx.globalAlpha = b.alpha;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, HIDDEN + b.riseAbove, tilt, Math.PI, Math.PI * 2);
    ctx.stroke();
  }
  // Un filo di luce sottile lungo il bordo piu' vicino, per leggere il profilo senza
  // che risulti troppo acceso (l'utente lo voleva "piu' tenue").
  ctx.strokeStyle = PALETTE.saturnPlanetLight;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, HIDDEN + bands[0].riseAbove, tilt, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

// --- Nettuno -----------------------------------------------------------------
// Blu intenso/ghiacciato, aurore, venti stilizzati (le tempeste piu' veloci del sistema).
export function createNeptuneBackground() {
  const aurora = makeLayer(0.05, 600, 7001, 4,
    (rng) => ({ x: rng() * 600, y: 50 + rng() * 110, w: 220 + rng() * 140 }),
    (ctx, f, baseX) => {
      ctx.strokeStyle = PALETTE.neptuneAurora;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(baseX + f.x, f.y);
      ctx.quadraticCurveTo(baseX + f.x + f.w / 2, f.y - 30, baseX + f.x + f.w, f.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

  const ridges = makeLayer(0.22, 420, 7002, 6,
    (rng) => ({ x: rng() * 420, r: 18 + rng() * 26, riseAbove: 18 + rng() * 12 }),
    (ctx, f, baseX, height, groundY) => {
      ctx.fillStyle = PALETTE.neptuneBlueDark;
      ctx.beginPath();
      ctx.ellipse(baseX + f.x, groundY - f.riseAbove, f.r, f.r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    });

  const wind = makeLayer(0.9, 260, 7003, 10,
    (rng) => ({ x: rng() * 260, y: 40 + rng() * 400, len: 40 + rng() * 50 }),
    (ctx, f, baseX) => {
      ctx.fillStyle = PALETTE.neptuneWind;
      ctx.globalAlpha = 0.4;
      ctx.fillRect(baseX + f.x, f.y, f.len, 2);
      ctx.globalAlpha = 1;
    });

  return makeBackground({
    skyTop: PALETTE.neptuneBlueDark,
    skyBottom: PALETTE.neptuneBlue,
    groundColor: PALETTE.neptuneBlueDark,
    groundLineColor: PALETTE.neptuneAurora,
    layers: [aurora, ridges, wind],
  });
}

// --- Finishinis (sistema di Andromeda, stella Braitstar) --------------------------
// Pianeta di lava: cielo rossastro/violaceo (diverso da tutti gli altri, per segnalare
// che si e' fuori dal sistema solare), laghi di lava, piattaforme scure fluttuanti.
export function createFinishinisBackground() {
  const mountains = makeLayer(0.12, 480, 8001, 6,
    (rng) => ({ x: rng() * 480, w: 90 + rng() * 90, riseAbove: 30 + rng() * 60 }),
    (ctx, f, baseX, height, groundY) => {
      ctx.fillStyle = PALETTE.finishinisRock;
      ctx.beginPath();
      ctx.moveTo(baseX + f.x - f.w / 2, groundY);
      ctx.lineTo(baseX + f.x, groundY - f.riseAbove);
      ctx.lineTo(baseX + f.x + f.w / 2, groundY);
      ctx.closePath();
      ctx.fill();
    });

  const floatingSlabs = makeLayer(0.3, 380, 8002, 6,
    (rng) => ({ x: rng() * 380, y: 120 + rng() * 220, w: 50 + rng() * 40 }),
    (ctx, f, baseX) => {
      ctx.fillStyle = PALETTE.finishinisRock;
      ctx.fillRect(baseX + f.x, f.y, f.w, 10);
    });

  const embers = makeLayer(0.5, 260, 8003, 20,
    (rng) => ({ x: rng() * 260, y: rng() * 480, size: 1.5 + rng() * 2 }),
    (ctx, f, baseX) => {
      ctx.fillStyle = PALETTE.lavaGlowBright;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(baseX + f.x, f.y, f.size, f.size);
      ctx.globalAlpha = 1;
    });

  return makeBackground({
    skyTop: PALETTE.skyPurpleDark,
    skyBottom: PALETTE.lavaDark,
    groundColor: PALETTE.finishinisRock,
    groundLineColor: PALETTE.lavaRed,
    layers: [mountains, floatingSlabs, embers],
  });
}

// --- Napoli / base Planetariur -----------------------------------------------------
// Skyline stilizzato con accenno al Vesuvio, per l'apertura e la scena finale.
export function createNaplesBackground() {
  const vesuvio = {
    x: 700, y: 300, speedFactor: 0.03,
    draw(ctx, x, y) {
      ctx.fillStyle = PALETTE.vesuvioGrey;
      ctx.beginPath();
      ctx.moveTo(x - 160, y);
      ctx.lineTo(x - 30, y - 150);
      ctx.lineTo(x + 10, y - 120);
      ctx.lineTo(x + 160, y);
      ctx.closePath();
      ctx.fill();
    },
  };

  const farBuildings = makeLayer(0.15, 420, 9001, 9,
    (rng) => ({ x: rng() * 420, w: 30 + rng() * 20, h: 40 + rng() * 60 }),
    (ctx, f, baseX, height, groundY) => {
      ctx.fillStyle = PALETTE.naplesBuildingDark;
      ctx.fillRect(baseX + f.x, groundY - f.h, f.w, f.h);
    });

  const nearBuildings = makeLayer(0.35, 320, 9002, 8,
    (rng) => ({ x: rng() * 320, w: 36 + rng() * 26, h: 70 + rng() * 90 }),
    (ctx, f, baseX, height, groundY) => {
      ctx.fillStyle = PALETTE.naplesBuildingLight;
      ctx.fillRect(baseX + f.x, groundY - f.h, f.w, f.h);
      ctx.fillStyle = PALETTE.naplesSkyDawn;
      for (let wy = groundY - f.h + 8; wy < groundY - 6; wy += 14) {
        ctx.fillRect(baseX + f.x + 6, wy, 5, 6);
      }
    });

  return makeBackground({
    skyTop: PALETTE.naplesSkyDawnDark,
    skyBottom: PALETTE.naplesSkyDawn,
    groundColor: PALETTE.naplesBuildingDark,
    groundLineColor: PALETTE.naplesBuildingLight,
    farObject: vesuvio,
    layers: [farBuildings, nearBuildings],
  });
}

export { renderLayer, makeLayer, makeBackground };
