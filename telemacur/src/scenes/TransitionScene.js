// Schermata fra una missione e l'altra: mostra il potenziamento della navicella e
// annuncia il pianeta successivo. Se la missione successiva non e' ancora stata
// implementata (fasi future), torna al menu con una nota invece di bloccare il gioco.
import { WIDTH, HEIGHT, Game } from '../engine/Game.js';
import { PALETTE } from '../sprites/palettes.js';
import { SHIP_STAGES, drawEngineFlames } from '../sprites/shipSprites.js';
import { SaveManager } from '../engine/SaveManager.js';
import { MISSIONS } from '../data/missions.js';

export class TransitionScene {
  onEnter(data) {
    this.mission = data.mission;
    this.onContinue = data.onContinue;
    this.time = 0;
  }

  onExit() {}

  update(dt) {
    this.time += dt;
    if (Game.input.actionJustPressed() && this.time > 0.3) {
      const next = MISSIONS[this.mission.nextMissionId];
      this.onContinue(next && !next.locked ? next.id : null);
    }
  }

  render(ctx) {
    ctx.fillStyle = PALETTE.spaceBlack;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.eyeGlow;
    ctx.font = 'bold 30px "Courier New", monospace';
    ctx.fillText(`${this.mission.planetName} superata!`, WIDTH / 2, 110);

    const stageIndex = SaveManager.state.shipStage;
    const stage = SHIP_STAGES[stageIndex];
    const shipX = WIDTH / 2 - stage.sprite.width / 2;
    const shipY = HEIGHT / 2 - stage.sprite.height / 2;
    const flash = 0.5 + 0.5 * Math.sin(this.time * 8);
    if (this.time < 1.2) {
      ctx.save();
      ctx.globalAlpha = flash * (1 - this.time / 1.2);
      ctx.fillStyle = PALETTE.eyeGlow;
      ctx.beginPath();
      ctx.arc(WIDTH / 2, shipY + stage.sprite.height / 2, 140, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    drawEngineFlames(ctx, shipX, shipY, stage.sprite.width, stage.sprite.height, stageIndex, this.time);
    ctx.drawImage(stage.sprite, shipX, shipY);

    ctx.fillStyle = PALETTE.white;
    ctx.font = '18px "Courier New", monospace';
    ctx.fillText(this.mission.completionMessage || '', WIDTH / 2, shipY + stage.sprite.height + 50);

    const next = MISSIONS[this.mission.nextMissionId];
    ctx.font = '16px "Courier New", monospace';
    if (next && !next.locked) {
      ctx.fillText(`Prossima destinazione: ${next.planetName}`, WIDTH / 2, shipY + stage.sprite.height + 80);
    } else if (next) {
      ctx.fillStyle = PALETTE.metalMid;
      ctx.fillText(`${next.planetName} arrivera' in una prossima fase dello sviluppo`, WIDTH / 2, shipY + stage.sprite.height + 80);
    }

    if (this.time > 0.3) {
      ctx.fillStyle = PALETTE.starWhite;
      const blink = Math.sin(this.time * 4) > 0 ? 1 : 0.4;
      ctx.globalAlpha = blink;
      ctx.fillText('Premi SPAZIO / tocca per continuare', WIDTH / 2, HEIGHT - 50);
      ctx.globalAlpha = 1;
    }
  }
}
