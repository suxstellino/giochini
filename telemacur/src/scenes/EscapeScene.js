// Scena 3 del finale: fuga a tempo da Finishinis che sta crollando, subito dopo aver
// abbattuto Luciastro a colpi d'arma nell'arena. Si tiene premuto il tasto azione per
// correre (stesso tasto usato ovunque nel gioco, qui vale "vai avanti" invece di
// "salta") e si raggiunge la navicella, lontanissima, entro 10 secondi, schivando i
// meteoriti che cadono lungo il percorso.
import { WIDTH, HEIGHT, Game } from '../engine/Game.js';
import { PALETTE } from '../sprites/palettes.js';
import { TELEMACUR } from '../sprites/characterSprites.js';
import { FINISHINIS_BACKGROUND } from '../data/finale.js';
import { SHIP_STAGES, drawEngineFlames } from '../sprites/shipSprites.js';
import { SaveManager } from '../engine/SaveManager.js';
import { AudioEngine } from '../audio/AudioEngine.js';
import { makeRng } from '../engine/Pixel.js';

const TIME_LIMIT = 10;
const RUN_SPEED = 250;
const SHIP_X = 1500;
const GROUND_Y = 460;
const PLAYER_SCREEN_X = 160;

const METEOR_WARN_TIME = 0.75;
const METEOR_FADE_TIME = 0.35;
const METEOR_BLAST_RADIUS = 40;
const METEOR_MIN_INTERVAL = 1.0;
const METEOR_MAX_INTERVAL = 1.6;
const METEOR_MIN_AHEAD = 160;
const METEOR_MAX_AHEAD = 360;

export class EscapeScene {
  onEnter(data) {
    this.onComplete = data.onComplete;
    this.debris = [];
    const rng = makeRng(99001);
    for (let i = 0; i < 16; i++) {
      this.debris.push({ x: rng() * 1600, speed: 60 + rng() * 80, phase: rng() * 10 });
    }
    this._resetAttempt();
  }

  onExit() {}

  _resetAttempt() {
    this.worldX = 0;
    this.timeLeft = TIME_LIMIT;
    this.state = 'running'; // running | success | failed
    this.failReason = null;
    this.pauseTimer = 0;
    this.meteors = [];
    this.meteorTimer = 0.9;
  }

  update(dt) {
    const input = Game.input;
    if (this.state === 'running') {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this._fail('time');
        return;
      }
      if (input.actionDown()) {
        this.worldX += RUN_SPEED * dt;
      }
      if (this.worldX >= SHIP_X) {
        this.state = 'success';
        this.pauseTimer = 0;
        AudioEngine.missionComplete();
        return;
      }
      this._updateMeteors(dt);
    } else if (this.state === 'success') {
      this.pauseTimer += dt;
      if (this.pauseTimer > 1.2) this.onComplete();
    } else if (this.state === 'failed') {
      if (input.actionJustPressed()) this._resetAttempt();
    }
  }

  _updateMeteors(dt) {
    this.meteorTimer -= dt;
    if (this.meteorTimer <= 0) {
      const ahead = METEOR_MIN_AHEAD + Math.random() * (METEOR_MAX_AHEAD - METEOR_MIN_AHEAD);
      this.meteors.push({ x: this.worldX + ahead, t: 0, exploded: false });
      this.meteorTimer = METEOR_MIN_INTERVAL + Math.random() * (METEOR_MAX_INTERVAL - METEOR_MIN_INTERVAL);
    }
    for (const m of this.meteors) {
      m.t += dt;
      if (!m.exploded && m.t >= METEOR_WARN_TIME) {
        m.exploded = true;
        AudioEngine.hit();
        if (Math.abs(this.worldX - m.x) < METEOR_BLAST_RADIUS) {
          this._fail('meteor');
        }
      }
    }
    this.meteors = this.meteors.filter((m) => m.t < METEOR_WARN_TIME + METEOR_FADE_TIME);
  }

  _fail(reason) {
    this.state = 'failed';
    this.failReason = reason;
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

    this._renderMeteors(ctx, cameraX);

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
    if (this.state === 'failed') this._renderFailed(ctx);
    if (this.state === 'success') this._renderSuccess(ctx);
  }

  _renderMeteors(ctx, cameraX) {
    for (const m of this.meteors) {
      const x = m.x - cameraX;
      if (x < -60 || x > WIDTH + 60) continue;
      if (!m.exploded) {
        const p = m.t / METEOR_WARN_TIME;
        const r = 10 + p * (METEOR_BLAST_RADIUS - 10);
        ctx.save();
        ctx.globalAlpha = 0.35 + 0.35 * Math.sin(p * 18);
        ctx.fillStyle = PALETTE.lavaRed;
        ctx.beginPath();
        ctx.ellipse(x, GROUND_Y - 3, r, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // Sasso in caduta, per leggere subito da dove arriva il pericolo.
        const fallY = -40 + p * (GROUND_Y + 40);
        ctx.fillStyle = PALETTE.finishinisRock;
        ctx.beginPath();
        ctx.arc(x, fallY, 8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const fade = 1 - (m.t - METEOR_WARN_TIME) / METEOR_FADE_TIME;
        ctx.save();
        ctx.globalAlpha = Math.max(0, fade);
        ctx.fillStyle = PALETTE.lavaGlowBright;
        ctx.beginPath();
        ctx.arc(x, GROUND_Y - 8, METEOR_BLAST_RADIUS * (1.2 - fade * 0.5), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  _renderHud(ctx) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = this.timeLeft < 4 ? PALETTE.lavaRed : PALETTE.white;
    ctx.font = 'bold 34px "Courier New", monospace';
    ctx.fillText(Math.ceil(this.timeLeft).toString(), WIDTH / 2, 50);

    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = PALETTE.eyeGlow;
    ctx.fillText('Torna alla navicella!', WIDTH / 2, 80);

    ctx.font = '13px "Courier New", monospace';
    ctx.fillStyle = PALETTE.metalMid;
    ctx.fillText('Tieni premuto SPAZIO / tocca per correre', WIDTH / 2, HEIGHT - 20);
    ctx.restore();
  }

  _renderFailed(ctx) {
    ctx.fillStyle = 'rgba(5,5,10,0.75)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.white;
    ctx.font = 'bold 30px "Courier New", monospace';
    const message = this.failReason === 'meteor' ? 'COLPITO DA UN METEORITE' : 'IL PIANETA E\' CROLLATO';
    ctx.fillText(message, WIDTH / 2, HEIGHT / 2 - 20);
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
