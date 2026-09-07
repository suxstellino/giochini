// Boss finale su Finishinis: piattaforme sospese sopra un lago di lava. Il giocatore
// preme il tasto azione per saltare alla piattaforma successiva; da quando ci atterra
// ha 3 secondi netti prima che si rompa per sempre. Un solo tasto, come nel resto del
// gioco: qui serve per decidere QUANDO saltare, non per mirare (il salto e' sempre
// verso il centro della piattaforma successiva, che appare solo all'atterraggio sulla
// precedente, come richiesto).
import { WIDTH, HEIGHT, Game } from '../engine/Game.js';
import { PALETTE } from '../sprites/palettes.js';
import { TELEMACUR, LUCIASTRO } from '../sprites/characterSprites.js';
import { FINISHINIS_BACKGROUND } from '../data/finale.js';
import { AudioEngine } from '../audio/AudioEngine.js';
import { makeRng } from '../engine/Pixel.js';

const CHALLENGE_COUNT = 15;
const CRUMBLE_TIME = 3.0;
const GROUND_REF_Y = 520;

function buildPlatforms() {
  const rng = makeRng(424242);
  const platforms = [{ x: 140, y: 420, w: 110, safe: true }];
  let x = 140;
  let y = 420;
  for (let i = 1; i <= CHALLENGE_COUNT; i++) {
    const progress = i / CHALLENGE_COUNT;
    const gap = 140 + progress * 90 + rng() * 30;
    const dy = (rng() - 0.5) * (60 + progress * 60);
    x += gap;
    y = Math.max(260, Math.min(460, y + dy));
    const w = Math.max(46, 90 - progress * 40);
    platforms.push({ x, y, w, safe: false });
  }
  x += 200;
  platforms.push({ x, y: 400, w: 130, safe: true, isLever: true });
  return platforms;
}

export class BossScene {
  onEnter(data) {
    this.onComplete = data.onComplete;
    this.platforms = buildPlatforms();
    this._resetAttempt();
  }

  onExit() {}

  _resetAttempt() {
    this.currentIndex = 0;
    this.timer = 0;
    this.state = 'onPlatform'; // onPlatform | jumping | falling | atLever | defeating | done | gameover
    this.player = { x: this.platforms[0].x, y: this.platforms[0].y };
    this.jumpFrom = null;
    this.jumpTo = null;
    this.jumpT = 0;
    this.jumpDuration = 0.5;
    this.fallVy = 0;
    this.defeatTimer = 0;
    this.guard = 0.3;
  }

  update(dt) {
    const input = Game.input;
    this.guard -= dt;

    if (this.state === 'onPlatform') {
      const platform = this.platforms[this.currentIndex];
      this.timer += dt;
      if (this.guard <= 0 && input.actionJustPressed()) {
        this._startJump();
      } else if (!platform.safe && this.timer >= CRUMBLE_TIME) {
        this._startFalling();
      }
    } else if (this.state === 'jumping') {
      this.jumpT += dt / this.jumpDuration;
      if (this.jumpT >= 1) {
        this.jumpT = 1;
        this._land();
      }
      const u = this.jumpT;
      this.player.x = this.jumpFrom.x + (this.jumpTo.x - this.jumpFrom.x) * u;
      const arc = Math.max(40, Math.abs(this.jumpTo.y - this.jumpFrom.y)) + 50;
      this.player.y = this.jumpFrom.y + (this.jumpTo.y - this.jumpFrom.y) * u - arc * 4 * u * (1 - u);
    } else if (this.state === 'falling') {
      this.fallVy += 1800 * dt;
      this.player.y += this.fallVy * dt;
      if (this.player.y > HEIGHT + 60) {
        this.state = 'gameover';
      }
    } else if (this.state === 'atLever') {
      if (this.guard <= 0 && input.actionJustPressed()) {
        this.state = 'defeating';
        this.defeatTimer = 0;
        AudioEngine.missionComplete();
      }
    } else if (this.state === 'defeating') {
      this.defeatTimer += dt;
      if (this.defeatTimer > 2.2 && this.state !== 'done') {
        this.state = 'done';
        this.onComplete();
      }
    } else if (this.state === 'gameover') {
      if (input.actionJustPressed()) this._resetAttempt();
    }
  }

  _startJump() {
    this.state = 'jumping';
    this.jumpFrom = { x: this.player.x, y: this.player.y };
    const next = this.platforms[this.currentIndex + 1];
    this.jumpTo = { x: next.x, y: next.y };
    this.jumpT = 0;
    this.jumpDuration = 0.45 + Math.min(this.currentIndex, 14) * 0.03;
    AudioEngine.jump();
  }

  _land() {
    this.currentIndex++;
    this.player.x = this.jumpTo.x;
    this.player.y = this.jumpTo.y;
    const platform = this.platforms[this.currentIndex];
    if (platform.isLever) {
      this.state = 'atLever';
    } else {
      this.state = 'onPlatform';
      this.timer = 0;
    }
    this.guard = 0.15;
  }

  _startFalling() {
    this.state = 'falling';
    this.fallVy = 0;
    AudioEngine.hit();
  }

  render(ctx) {
    const player = this.player;
    const cameraX = Math.max(0, player.x - 220);
    FINISHINIS_BACKGROUND.render(ctx, cameraX, WIDTH, HEIGHT, GROUND_REF_Y);

    // Lago di lava che pulsa piano sotto tutte le piattaforme.
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 400);
    const lavaGrad = ctx.createLinearGradient(0, HEIGHT - 70, 0, HEIGHT);
    lavaGrad.addColorStop(0, PALETTE.lavaRed);
    lavaGrad.addColorStop(1, PALETTE.lavaDark);
    ctx.fillStyle = lavaGrad;
    ctx.fillRect(0, HEIGHT - 70, WIDTH, 70);
    ctx.fillStyle = PALETTE.lavaGlowBright;
    ctx.globalAlpha = 0.15 + pulse * 0.15;
    ctx.fillRect(0, HEIGHT - 70, WIDTH, 6);
    ctx.globalAlpha = 1;

    // Luciastro, immobile in fondo alla piattaforma finale (spostato dal centro cosi'
    // non si sovrappone a Telemacur quando atterra li').
    const lastPlatform = this.platforms[this.platforms.length - 1];
    const lsx = lastPlatform.x - cameraX + lastPlatform.w / 2 + 20;
    if (lsx > -80 && lsx < WIDTH + 80) {
      const shrink = this.state === 'defeating' ? Math.max(0, 1 - this.defeatTimer / 1.6) : 1;
      const flash = this.state === 'defeating' && Math.floor(this.defeatTimer * 16) % 2 === 0;
      ctx.save();
      // Un bagliore dietro Luciastro, altrimenti il suo viola si perde nel cielo dello
      // stesso colore.
      const glowGrad = ctx.createRadialGradient(lsx, lastPlatform.y - LUCIASTRO.height / 2, 4, lsx, lastPlatform.y - LUCIASTRO.height / 2, 70);
      glowGrad.addColorStop(0, 'rgba(255,120,60,0.35)');
      glowGrad.addColorStop(1, 'rgba(255,120,60,0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(lsx - 70, lastPlatform.y - LUCIASTRO.height - 70, 140, 140);
      ctx.globalAlpha = shrink;
      if (flash) ctx.filter = 'brightness(2.5)';
      ctx.drawImage(LUCIASTRO.stand, lsx - LUCIASTRO.width / 2, lastPlatform.y - LUCIASTRO.height - 6,
        LUCIASTRO.width * shrink, LUCIASTRO.height * shrink);
      ctx.restore();
    }

    for (let i = 0; i <= Math.min(this.currentIndex + 1, this.platforms.length - 1); i++) {
      this._renderPlatform(ctx, i, cameraX);
    }

    this._renderPlayer(ctx, cameraX);
    this._renderHud(ctx);

    if (this.state === 'gameover') this._renderGameOver(ctx);
    if (this.state === 'atLever') this._renderLeverPrompt(ctx, cameraX);
    if (this.state === 'defeating' && this.defeatTimer > 1.6) this._renderVictoryText(ctx);
  }

  _renderPlatform(ctx, i, cameraX) {
    const p = this.platforms[i];
    const sx = p.x - cameraX - p.w / 2;
    let color = p.safe ? PALETTE.metalMid : PALETTE.finishinisRock;
    if (i === this.currentIndex && this.state === 'onPlatform' && !p.safe) {
      const remaining = CRUMBLE_TIME - this.timer;
      if (remaining < 1) {
        color = Math.floor(this.timer * 10) % 2 === 0 ? PALETTE.lavaRed : PALETTE.finishinisRock;
      }
    }
    ctx.fillStyle = color;
    ctx.fillRect(sx, p.y, p.w, 16);
    ctx.fillStyle = p.isLever ? PALETTE.metalLight : PALETTE.lavaOrange;
    ctx.fillRect(sx, p.y, p.w, 3);

    if (p.isLever) {
      ctx.fillStyle = PALETTE.metalDark;
      ctx.fillRect(p.x - cameraX - 3, p.y - 22, 6, 22);
      ctx.fillStyle = this.state === 'atLever' ? PALETTE.eyeGlow : PALETTE.metalLight;
      ctx.fillRect(p.x - cameraX - 8, p.y - 26, 16, 8);
    }

    if (i === this.currentIndex && this.state === 'onPlatform' && !p.safe) {
      const remaining = Math.max(0, CRUMBLE_TIME - this.timer);
      ctx.fillStyle = PALETTE.white;
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(remaining.toFixed(1), p.x - cameraX, p.y - 14);
    }
  }

  _renderPlayer(ctx, cameraX) {
    const sprite = this.state === 'jumping' || this.state === 'falling' ? TELEMACUR.jump : TELEMACUR.stand;
    ctx.drawImage(sprite, this.player.x - cameraX - TELEMACUR.width / 2, this.player.y - TELEMACUR.height);
  }

  _renderHud(ctx) {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(10, 10, 220, 34);
    ctx.fillStyle = PALETTE.white;
    const shown = Math.min(this.currentIndex, CHALLENGE_COUNT);
    ctx.fillText(`Piattaforma ${shown}/${CHALLENGE_COUNT}`, 20, 30);
    ctx.restore();
  }

  _renderLeverPrompt(ctx) {
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.eyeGlow;
    ctx.font = 'bold 18px "Courier New", monospace';
    const blink = Math.sin(performance.now() / 200) > 0 ? 1 : 0.5;
    ctx.globalAlpha = blink;
    ctx.fillText('Premi SPAZIO per azionare la leva!', WIDTH / 2, 90);
    ctx.globalAlpha = 1;
  }

  _renderVictoryText(ctx) {
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.white;
    ctx.font = 'bold 26px "Courier New", monospace';
    ctx.fillText('Luciastro e\' sconfitto!', WIDTH / 2, HEIGHT / 2 - 100);
  }

  _renderGameOver(ctx) {
    ctx.fillStyle = 'rgba(5,5,10,0.75)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.white;
    ctx.font = 'bold 34px "Courier New", monospace';
    ctx.fillText('SEI CADUTO NELLA LAVA', WIDTH / 2, HEIGHT / 2 - 20);
    ctx.font = '17px "Courier New", monospace';
    ctx.fillText('Premi SPAZIO / tocca per ricominciare il duello', WIDTH / 2, HEIGHT / 2 + 20);
  }
}
