// Scena 3 del finale: fuga a tempo da Finishinis che sta crollando. Si tiene premuto il
// tasto azione per correre (stesso tasto usato ovunque nel gioco, qui vale "vai avanti"
// invece di "salta"): prima si raccoglie l'arma di Luciastro, poi si raggiunge la
// navicella, entro 30 secondi.
import { WIDTH, HEIGHT, Game } from '../engine/Game.js';
import { PALETTE } from '../sprites/palettes.js';
import { TELEMACUR } from '../sprites/characterSprites.js';
import { FINISHINIS_BACKGROUND } from '../data/finale.js';
import { WEAPON_SPRITE } from '../sprites/propSprites.js';
import { SHIP_STAGES, drawEngineFlames } from '../sprites/shipSprites.js';
import { SaveManager } from '../engine/SaveManager.js';
import { AudioEngine } from '../audio/AudioEngine.js';
import { makeRng } from '../engine/Pixel.js';

const TIME_LIMIT = 30;
const WEAPON_X = 320;
const SHIP_X = 700;
const GROUND_Y = 460;
const PLAYER_SCREEN_X = 160;

export class EscapeScene {
  onEnter(data) {
    this.onComplete = data.onComplete;
    this.debris = [];
    const rng = makeRng(99001);
    for (let i = 0; i < 16; i++) {
      this.debris.push({ x: rng() * 900, speed: 60 + rng() * 80, phase: rng() * 10 });
    }
    this._resetAttempt();
  }

  onExit() {}

  _resetAttempt() {
    this.worldX = 0;
    this.timeLeft = TIME_LIMIT;
    this.hasWeapon = false;
    this.state = 'running'; // running | success | timeout
    this.pauseTimer = 0;
  }

  update(dt) {
    const input = Game.input;
    if (this.state === 'running') {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.state = 'timeout';
        AudioEngine.hit();
        return;
      }
      if (input.actionDown()) {
        this.worldX += 230 * dt;
      }
      if (!this.hasWeapon && this.worldX >= WEAPON_X) {
        this.hasWeapon = true;
        AudioEngine.diamond();
      }
      if (this.hasWeapon && this.worldX >= SHIP_X) {
        this.state = 'success';
        this.pauseTimer = 0;
        AudioEngine.missionComplete();
      }
    } else if (this.state === 'success') {
      this.pauseTimer += dt;
      if (this.pauseTimer > 1.2) this.onComplete();
    } else if (this.state === 'timeout') {
      if (input.actionJustPressed()) this._resetAttempt();
    }
  }

  render(ctx) {
    const cameraX = Math.max(0, this.worldX - PLAYER_SCREEN_X);
    const shakeX = this.state === 'running' ? (Math.sin(performance.now() / 45) * 2) : 0;
    const shakeY = this.state === 'running' ? (Math.cos(performance.now() / 63) * 2) : 0;

    ctx.save();
    ctx.translate(shakeX, shakeY);
    FINISHINIS_BACKGROUND.render(ctx, cameraX, WIDTH, HEIGHT, GROUND_Y);

    ctx.fillStyle = PALETTE.finishinisRock;
    ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);
    ctx.fillStyle = PALETTE.lavaRed;
    ctx.fillRect(0, GROUND_Y, WIDTH, 4);

    for (const d of this.debris) {
      const t = (performance.now() / 1000 + d.phase) % 3;
      const dx = d.x - cameraX * 0.6;
      if (dx < -20 || dx > WIDTH + 20) continue;
      ctx.fillStyle = PALETTE.finishinisRock;
      ctx.fillRect(dx, t * 160, 6, 10);
    }

    if (!this.hasWeapon) {
      const wx = WEAPON_X - cameraX;
      const bob = Math.sin(performance.now() / 250) * 5;
      ctx.drawImage(WEAPON_SPRITE, wx, GROUND_Y - WEAPON_SPRITE.height - 10 + bob);
    }

    const stageIndex = SaveManager.state.shipStage;
    const stage = SHIP_STAGES[stageIndex].sprite;
    const shipScreenX = SHIP_X - cameraX;
    drawEngineFlames(ctx, shipScreenX, GROUND_Y - stage.height, stage.width, stage.height, stageIndex, performance.now() / 1000);
    ctx.drawImage(stage, shipScreenX, GROUND_Y - stage.height);

    const runFrame = Math.floor(performance.now() / 110) % 2 === 0;
    const playerSprite = this.state === 'running' && Game.input.actionDown()
      ? (runFrame ? TELEMACUR.runA : TELEMACUR.runB)
      : TELEMACUR.stand;
    ctx.drawImage(playerSprite, this.worldX - cameraX, GROUND_Y - TELEMACUR.height);

    ctx.restore();

    this._renderHud(ctx);
    if (this.state === 'timeout') this._renderTimeout(ctx);
    if (this.state === 'success') this._renderSuccess(ctx);
  }

  _renderHud(ctx) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = this.timeLeft < 10 ? PALETTE.lavaRed : PALETTE.white;
    ctx.font = 'bold 34px "Courier New", monospace';
    ctx.fillText(Math.ceil(this.timeLeft).toString(), WIDTH / 2, 50);

    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = PALETTE.eyeGlow;
    ctx.fillText(this.hasWeapon ? 'Torna alla navicella!' : 'Recupera l\'arma di Luciastro!', WIDTH / 2, 80);

    ctx.font = '13px "Courier New", monospace';
    ctx.fillStyle = PALETTE.metalMid;
    ctx.fillText('Tieni premuto SPAZIO / tocca per correre', WIDTH / 2, HEIGHT - 20);
    ctx.restore();
  }

  _renderTimeout(ctx) {
    ctx.fillStyle = 'rgba(5,5,10,0.75)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.white;
    ctx.font = 'bold 32px "Courier New", monospace';
    ctx.fillText('IL PIANETA E\' CROLLATO', WIDTH / 2, HEIGHT / 2 - 20);
    ctx.font = '16px "Courier New", monospace';
    ctx.fillText('Premi SPAZIO / tocca per riprovare la fuga', WIDTH / 2, HEIGHT / 2 + 20);
  }

  _renderSuccess(ctx) {
    ctx.fillStyle = 'rgba(10,20,15,0.5)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.eyeGlow;
    ctx.font = 'bold 30px "Courier New", monospace';
    ctx.fillText('Decollo riuscito!', WIDTH / 2, HEIGHT / 2);
  }
}
