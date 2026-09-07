// Contenuti del finale: cutscene di apertura, incontro con Benzo, partenza verso
// Andromeda, ed epilogo. Tenuti separati da missions.js perche' non sono un runner:
// la missione 'finishinis' viene gestita da main.js con una sequenza di scene dedicate.
import { PALETTE } from '../sprites/palettes.js';
import { createNaplesBackground, createFinishinisBackground } from '../sprites/backgrounds.js';
import { TELEMACUR, BENZO, LUCIASTRO } from '../sprites/characterSprites.js';
import { SHIP_STAGES, drawEngineFlames } from '../sprites/shipSprites.js';
import { drawPizza, WEAPON_SPRITE, ROCKET_SPRITE } from '../sprites/propSprites.js';
import { SaveManager } from '../engine/SaveManager.js';

const naples = createNaplesBackground();
const finishinis = createFinishinisBackground();

export const BENZO_LINES = [
  'Bentornato sulla Terra, Telemacur! Ho sentito che ti serve un carburante un po\'... insolito.',
  'Andromeda e\' lontanissima. Questo e\' un concentrato di energia stellare: non respirarne i vapori, mi raccomando.',
  'Buona fortuna la\' fuori. Sei uno scienziato, non un soldato... quindi stai molto attento!',
];

export function createIntroSlides() {
  return [
    {
      caption: 'Napoli, base segreta Planetariur.',
      draw(ctx, w, h) {
        naples.render(ctx, 0, w, h, 460);
        ctx.drawImage(TELEMACUR.stand, w / 2 - 20, 460 - TELEMACUR.height);
      },
    },
    {
      caption: 'Un segnale disperato arriva dal profondo spazio: la Terra ha bisogno di aiuto.',
      draw(ctx, w, h) {
        naples.render(ctx, 40, w, h, 460);
        const stage = SHIP_STAGES[0].sprite;
        ctx.drawImage(stage, w / 2 - stage.width / 2, 300);
        ctx.drawImage(TELEMACUR.stand, w / 2 - stage.width / 2 - 50, 460 - TELEMACUR.height);
      },
    },
    {
      caption: 'Telemacur parte per la sua missione attraverso il sistema solare.',
      draw(ctx, w, h, t) {
        naples.render(ctx, 80, w, h, 460);
        const stage = SHIP_STAGES[0].sprite;
        const y = 260 - Math.min(t, 2) * 70;
        drawEngineFlames(ctx, w / 2 - stage.width / 2, y, stage.width, stage.height, 0, t);
        ctx.drawImage(stage, w / 2 - stage.width / 2, y);
      },
    },
  ];
}

export function createDepartureSlides() {
  return [
    {
      caption: 'Rotta impostata sul sistema di Andromeda, stella Braitstar.',
      draw(ctx, w, h, t) {
        naples.render(ctx, 100 + t * 20, w, h, 460);
        const stageIndex = SaveManager.state.shipStage;
        const stage = SHIP_STAGES[stageIndex].sprite;
        const y = 260 - Math.min(t, 2) * 90;
        drawEngineFlames(ctx, w / 2 - stage.width / 2, y, stage.width, stage.height, stageIndex, t);
        ctx.drawImage(stage, w / 2 - stage.width / 2, y);
      },
    },
    {
      caption: 'Luciastro ha sentito arrivare la navicella, e non e\' contento.',
      draw(ctx, w, h, t) {
        ctx.fillStyle = PALETTE.spaceBlack;
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 50; i++) {
          const speed = 200 + (i % 5) * 60;
          const x = (w - ((t * speed + i * 97) % w));
          ctx.fillStyle = PALETTE.starWhite;
          ctx.fillRect(x, (i * 53) % h, 3, 1);
        }
        // Missili sparati da lontano da Luciastro: qui sono solo scenografia (la
        // navicella li schiva da sola), il vero pericolo arriva dopo, sul pianeta.
        const rockets = [
          { y: h * 0.28, speed: 300, offset: 0 },
          { y: h * 0.5, speed: 380, offset: 260 },
          { y: h * 0.72, speed: 260, offset: 520 },
        ];
        for (const rk of rockets) {
          const x = (w + 120) - ((t * rk.speed + rk.offset) % (w + 300));
          ctx.drawImage(ROCKET_SPRITE, x - ROCKET_SPRITE.width / 2, rk.y - ROCKET_SPRITE.height / 2);
        }
        const stageIndex = SaveManager.state.shipStage;
        const stage = SHIP_STAGES[stageIndex].sprite;
        drawEngineFlames(ctx, w / 2 - stage.width / 2, h / 2 - stage.height / 2, stage.width, stage.height, stageIndex, t);
        ctx.drawImage(stage, w / 2 - stage.width / 2, h / 2 - stage.height / 2);
      },
    },
  ];
}

export function createEpilogueSlides() {
  return [
    {
      caption: 'Telemacur ritorna a Napoli, alla base Planetariur.',
      draw(ctx, w, h) {
        naples.render(ctx, 0, w, h, 460);
        ctx.drawImage(TELEMACUR.stand, w / 2 - 20, 460 - TELEMACUR.height);
      },
    },
    {
      caption: 'Prima regola dell\'eroe spaziale: si festeggia sempre con una pizza.',
      draw(ctx, w, h) {
        naples.render(ctx, 20, w, h, 460);
        drawPizza(ctx, w / 2, h / 2 + 10, 70);
        ctx.drawImage(TELEMACUR.stand, w / 2 - 140, h / 2 - 30);
        ctx.save();
        ctx.translate(w / 2 - 100, h / 2 - 10);
        ctx.rotate(-0.5);
        ctx.drawImage(WEAPON_SPRITE, 0, 0);
        ctx.restore();
      },
    },
    {
      caption: null,
      draw(ctx, w, h) {
        ctx.fillStyle = PALETTE.spaceBlack;
        ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';
        ctx.fillStyle = PALETTE.eyeGlow;
        ctx.font = 'bold 46px "Courier New", monospace';
        ctx.fillText('LA TERRA E\' SALVA.', w / 2, h / 2);
      },
    },
    {
      caption: null,
      draw(ctx, w, h) {
        ctx.fillStyle = PALETTE.spaceBlack;
        ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';
        ctx.fillStyle = PALETTE.white;
        ctx.font = 'bold 30px "Courier New", monospace';
        ctx.fillText('FINE', w / 2, h / 2 - 60);
        ctx.font = '15px "Courier New", monospace';
        ctx.fillStyle = PALETTE.metalMid;
        const cast = [
          'Telemacur, Agri, Scalino, Gasolio,',
          'Acquazzone, Benzo e Luciastro',
          'vi ringraziano per aver giocato.',
        ];
        cast.forEach((line, i) => ctx.fillText(line, w / 2, h / 2 - 10 + i * 24));
      },
    },
  ];
}

export const FINISHINIS_BACKGROUND = finishinis;
export { LUCIASTRO, BENZO };
