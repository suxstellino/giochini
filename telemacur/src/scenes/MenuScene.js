// Schermata iniziale: titolo, navicella nello stadio corrente, avvio/ripresa partita.
import { WIDTH, HEIGHT, Game } from '../engine/Game.js';
import { PALETTE } from '../sprites/palettes.js';
import { SHIP_STAGES, drawEngineFlames, drawTeleportRing } from '../sprites/shipSprites.js';
import { SaveManager, MISSION_ORDER } from '../engine/SaveManager.js';
import { AudioEngine } from '../audio/AudioEngine.js';
import { MISSIONS } from '../data/missions.js';

// L'ultima missione sbloccata potrebbe non essere ancora implementata (fasi future):
// in tal caso si riparte dall'ultima missione giocabile invece di andare in crash.
function resolvePlayableMissionId() {
  const idx = SaveManager.state.unlockedMissionIndex;
  for (let i = Math.min(idx, MISSION_ORDER.length - 1); i >= 0; i--) {
    const id = MISSION_ORDER[i];
    if (MISSIONS[id] && !MISSIONS[id].locked) return id;
  }
  return MISSION_ORDER[0];
}

export class MenuScene {
  onEnter() {
    this.time = 0;
    this.resetJustPressed = false;
  }

  onExit() {}

  update(dt) {
    this.time += dt;
    const input = Game.input;
    if (input.actionJustPressed()) {
      AudioEngine.select();
      if (this.onStart) this.onStart(resolvePlayableMissionId());
    }
    if (input.wasJustPressed('KeyR')) {
      SaveManager.reset();
    }
  }

  render(ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, PALETTE.spaceBlack);
    grad.addColorStop(1, '#181828');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Stelle statiche di sfondo
    ctx.fillStyle = PALETTE.starWhite;
    for (let i = 0; i < 60; i++) {
      const x = (i * 137) % WIDTH;
      const y = (i * 71) % (HEIGHT - 120);
      ctx.globalAlpha = 0.3 + 0.5 * ((i * 53) % 10) / 10;
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.eyeGlow;
    ctx.font = 'bold 42px "Courier New", monospace';
    ctx.fillText('TELEMACUR', WIDTH / 2, 90);
    ctx.fillStyle = PALETTE.white;
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.fillText('LA MISSIONE FINISHINIS', WIDTH / 2, 130);

    // Navicella allo stadio corrente, con i motori accesi
    const stageIndex = SaveManager.state.shipStage;
    const stage = SHIP_STAGES[stageIndex];
    const shipY = HEIGHT / 2 - 20;
    const shipX = WIDTH / 2 - stage.sprite.width / 2;
    const bob = Math.sin(this.time * 2) * 6;
    drawEngineFlames(ctx, shipX, shipY + bob, stage.sprite.width, stage.sprite.height, stageIndex, this.time);
    ctx.drawImage(stage.sprite, shipX, shipY + bob);
    if (stage.hasTeleport) {
      drawTeleportRing(ctx, WIDTH / 2, shipY + bob + stage.sprite.height + 6, stage.sprite.width * 0.6, this.time);
    }
    ctx.fillStyle = PALETTE.metalLight;
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText(`Navicella: ${stage.name}`, WIDTH / 2, shipY + stage.sprite.height + 40);

    const nextId = resolvePlayableMissionId();
    const nextMission = MISSIONS[nextId];
    const hasProgress = SaveManager.state.unlockedMissionIndex > 0;
    ctx.fillStyle = PALETTE.eyeGlow;
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText(
      hasProgress ? `Continua da: ${nextMission.planetName}` : `Prossima missione: ${nextMission.planetName}`,
      WIDTH / 2, shipY + stage.sprite.height + 60,
    );

    ctx.fillStyle = PALETTE.white;
    ctx.font = '16px "Courier New", monospace';
    const blink = Math.sin(this.time * 4) > 0 ? 1 : 0.4;
    ctx.globalAlpha = blink;
    ctx.fillText('Premi SPAZIO o tocca lo schermo per iniziare', WIDTH / 2, HEIGHT - 90);
    ctx.globalAlpha = 1;
    ctx.font = '13px "Courier New", monospace';
    ctx.fillStyle = PALETTE.metalMid;
    ctx.fillText('R per iniziare una nuova partita  •  M per attivare/disattivare l\'audio', WIDTH / 2, HEIGHT - 60);
    ctx.fillText('Un solo tasto: SPAZIO / freccia SU / tocco per saltare', WIDTH / 2, HEIGHT - 40);
  }
}
