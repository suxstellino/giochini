// Boss finale su Finishinis, in due parti:
// 1) Piattaforme sospese su un lago di lava: il tasto azione lancia un salto sempre
//    riuscito verso la piattaforma successiva (appare solo all'atterraggio sulla
//    precedente); da quel momento si hanno 2 secondi prima che si rompa per sempre.
//    A rendere il salto rischioso ci pensa una palla di lava che sale e scende nel
//    varco (i razzi di Luciastro si vedono invece nella cutscene di partenza, non qui).
// 2) Arena finale: Luciastro si muove su e giu' a velocita' casuale, il tasto azione
//    spara verso la sua altezza di partenza (un solo tasto: bisogna aspettare che sia
//    allineato, non mirare).
import { WIDTH, HEIGHT, Game } from '../engine/Game.js';
import { PALETTE } from '../sprites/palettes.js';
import { TELEMACUR, LUCIASTRO } from '../sprites/characterSprites.js';
import { FINISHINIS_BACKGROUND } from '../data/finale.js';
import { AudioEngine } from '../audio/AudioEngine.js';
import { makeRng } from '../engine/Pixel.js';

const CHALLENGE_COUNT = 15;
const CRUMBLE_TIME = 2.0;
const GROUND_REF_Y = 520;

const LAVA_SURFACE_Y = HEIGHT - 70;
const LAVA_BALL_RADIUS = 16;
const LAVA_BALL_RISE = 195;
const LAVA_BALL_PERIOD = 1.7;
const LAVA_BALL_HIT_PAD = 22;

const ARENA_OFFSET_X = 240;
const LUCIASTRO_MID_Y = 340;
const LUCIASTRO_AMPLITUDE = 90;
const LUCIASTRO_MIN_SPEED = 60;
const LUCIASTRO_MAX_SPEED = 150;
const LUCIASTRO_RETARGET_MIN = 0.8;
const LUCIASTRO_RETARGET_MAX = 1.8;
const LUCIASTRO_MAX_HP = 5;
const BULLET_SPEED = 520;
const FIRE_COOLDOWN = 0.32;

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
  platforms.push({ x, y: 400, w: 130, safe: true, isArena: true });
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
    this.state = 'onPlatform'; // onPlatform | jumping | falling | arena | defeating | done | gameover
    this.player = { x: this.platforms[0].x, y: this.platforms[0].y };
    this.jumpFrom = null;
    this.jumpTo = null;
    this.jumpT = 0;
    this.jumpDuration = 0.5;
    this.fallVy = 0;
    this.defeatTimer = 0;
    this.guard = 0.3;
    this.failReason = 'crumble';
    this._setupGapHazard();

    this.luciastroY = LUCIASTRO_MID_Y;
    this.luciastroVy = LUCIASTRO_MIN_SPEED;
    this.retargetTimer = LUCIASTRO_RETARGET_MIN;
    this.luciastroHP = LUCIASTRO_MAX_HP;
    this.bullets = [];
    this.fireCooldown = 0;
    this.hitFlash = 0;
  }

  _setupGapHazard() {
    const current = this.platforms[this.currentIndex];
    const next = this.platforms[this.currentIndex + 1];
    if (next && !current.isArena) {
      this.lavaBall = { x: (current.x + next.x) / 2, t: Math.random() * LAVA_BALL_PERIOD };
    } else {
      this.lavaBall = null;
    }
  }

  update(dt) {
    const input = Game.input;
    this.guard -= dt;
    this._updateHazards(dt);

    if (this.state === 'onPlatform') {
      const platform = this.platforms[this.currentIndex];
      this.timer += dt;
      if (this.guard <= 0 && input.actionJustPressed()) {
        this._startJump();
      } else if (!platform.safe && this.timer >= CRUMBLE_TIME) {
        this.failReason = 'crumble';
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
      this._checkLavaBallHit();
    } else if (this.state === 'falling') {
      this.fallVy += 1800 * dt;
      this.player.y += this.fallVy * dt;
      if (this.player.y > HEIGHT + 60) {
        this.state = 'gameover';
      }
    } else if (this.state === 'arena') {
      this._updateArena(dt, input);
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

  _updateHazards(dt) {
    if (this.lavaBall) this.lavaBall.t += dt;
  }

  _lavaBallY() {
    const b = this.lavaBall;
    const phase = (b.t % LAVA_BALL_PERIOD) / LAVA_BALL_PERIOD;
    const rise = Math.sin(phase * Math.PI);
    return LAVA_SURFACE_Y - rise * LAVA_BALL_RISE;
  }

  _checkLavaBallHit() {
    if (!this.lavaBall) return;
    const by = this._lavaBallY();
    const dx = this.player.x - this.lavaBall.x;
    const dy = (this.player.y - TELEMACUR.height / 2) - by;
    if (Math.hypot(dx, dy) < LAVA_BALL_RADIUS + LAVA_BALL_HIT_PAD) {
      this.failReason = 'lavaball';
      this._startFalling();
    }
  }

  _updateArena(dt, input) {
    this.retargetTimer -= dt;
    if (this.retargetTimer <= 0) {
      const speed = LUCIASTRO_MIN_SPEED + Math.random() * (LUCIASTRO_MAX_SPEED - LUCIASTRO_MIN_SPEED);
      this.luciastroVy = Math.random() < 0.5 ? -speed : speed;
      this.retargetTimer = LUCIASTRO_RETARGET_MIN + Math.random() * (LUCIASTRO_RETARGET_MAX - LUCIASTRO_RETARGET_MIN);
    }
    this.luciastroY += this.luciastroVy * dt;
    const minY = LUCIASTRO_MID_Y - LUCIASTRO_AMPLITUDE;
    const maxY = LUCIASTRO_MID_Y + LUCIASTRO_AMPLITUDE;
    if (this.luciastroY < minY) { this.luciastroY = minY; this.luciastroVy = Math.abs(this.luciastroVy); }
    if (this.luciastroY > maxY) { this.luciastroY = maxY; this.luciastroVy = -Math.abs(this.luciastroVy); }

    this.fireCooldown -= dt;
    if (this.guard <= 0 && this.fireCooldown <= 0 && input.actionJustPressed()) {
      this.fireCooldown = FIRE_COOLDOWN;
      AudioEngine.jump();
      this.bullets.push({ x: this.player.x + 20 });
    }

    for (const b of this.bullets) { b.prevX = b.x; b.x += BULLET_SPEED * dt; }
    const targetX = this._arenaLuciastroX();
    const windowMin = targetX - 22, windowMax = targetX + 22;
    this.bullets = this.bullets.filter((b) => {
      // Controlla il tratto percorso in questo frame, non solo la posizione istantanea:
      // a velocita' alta un singolo salto di frame potrebbe "bucare" la fascia di tiro.
      const crossedZone = b.prevX <= windowMax && b.x >= windowMin;
      if (crossedZone && Math.abs(LUCIASTRO_MID_Y - this.luciastroY) < 26) {
        this.luciastroHP--;
        this.hitFlash = 0.15;
        AudioEngine.coinBlue();
        if (this.luciastroHP <= 0) {
          this.state = 'defeating';
          this.defeatTimer = 0;
          AudioEngine.missionComplete();
        }
        return false;
      }
      return b.x < targetX + 40;
    });
    if (this.hitFlash > 0) this.hitFlash -= dt;
  }

  _arenaLuciastroX() {
    return this.platforms[this.platforms.length - 1].x + ARENA_OFFSET_X;
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
    this._setupGapHazard();
    const platform = this.platforms[this.currentIndex];
    if (platform.isArena) {
      this.state = 'arena';
    } else {
      this.state = 'onPlatform';
      this.timer = 0;
    }
    this.guard = 0.15;
  }

  _startFalling() {
    this.state = 'falling';
    this.fallVy = -200;
    AudioEngine.hit();
  }

  render(ctx) {
    const player = this.player;
    const cameraX = Math.max(0, player.x - 220);
    FINISHINIS_BACKGROUND.render(ctx, cameraX, WIDTH, HEIGHT, GROUND_REF_Y);

    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 400);
    const lavaGrad = ctx.createLinearGradient(0, LAVA_SURFACE_Y, 0, HEIGHT);
    lavaGrad.addColorStop(0, PALETTE.lavaRed);
    lavaGrad.addColorStop(1, PALETTE.lavaDark);
    ctx.fillStyle = lavaGrad;
    ctx.fillRect(0, LAVA_SURFACE_Y, WIDTH, HEIGHT - LAVA_SURFACE_Y);
    ctx.fillStyle = PALETTE.lavaGlowBright;
    ctx.globalAlpha = 0.15 + pulse * 0.15;
    ctx.fillRect(0, LAVA_SURFACE_Y, WIDTH, 6);
    ctx.globalAlpha = 1;

    this._renderLavaBall(ctx, cameraX);
    this._renderLuciastro(ctx, cameraX);

    for (let i = 0; i <= Math.min(this.currentIndex + 1, this.platforms.length - 1); i++) {
      this._renderPlatform(ctx, i, cameraX);
    }

    if (this.state === 'arena') {
      ctx.fillStyle = PALETTE.eyeGlow;
      for (const b of this.bullets) {
        ctx.fillRect(b.x - cameraX - 6, LUCIASTRO_MID_Y - 2, 12, 4);
      }
    }

    this._renderPlayer(ctx, cameraX);
    this._renderHud(ctx);

    if (this.state === 'gameover') this._renderGameOver(ctx);
    if (this.state === 'arena') this._renderArenaPrompt(ctx);
    if (this.state === 'defeating' && this.defeatTimer > 1.6) this._renderVictoryText(ctx);
  }

  _renderLavaBall(ctx, cameraX) {
    if (!this.lavaBall) return;
    const x = this.lavaBall.x - cameraX;
    if (x < -40 || x > WIDTH + 40) return;
    const y = this._lavaBallY();
    const grad = ctx.createRadialGradient(x, y, 2, x, y, LAVA_BALL_RADIUS + 8);
    grad.addColorStop(0, PALETTE.lavaGlowBright);
    grad.addColorStop(1, PALETTE.lavaRed);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, LAVA_BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawLuciastroGlow(ctx, x, y) {
    const grad = ctx.createRadialGradient(x, y, 4, x, y, 70);
    grad.addColorStop(0, 'rgba(255,120,60,0.35)');
    grad.addColorStop(1, 'rgba(255,120,60,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x - 70, y - 70, 140, 140);
  }

  _renderLuciastro(ctx, cameraX) {
    if (this.state === 'arena' || this.state === 'defeating' || this.state === 'done') {
      const x = this._arenaLuciastroX() - cameraX;
      const y = this.luciastroY;
      this._drawLuciastroGlow(ctx, x, y);
      const shrink = this.state === 'defeating' ? Math.max(0, 1 - this.defeatTimer / 1.6) : 1;
      const flash = (this.state === 'defeating' && Math.floor(this.defeatTimer * 16) % 2 === 0) || this.hitFlash > 0;
      ctx.save();
      ctx.globalAlpha = shrink;
      if (flash) ctx.filter = 'brightness(2.5)';
      ctx.drawImage(LUCIASTRO.stand, x - LUCIASTRO.width / 2, y - LUCIASTRO.height / 2,
        LUCIASTRO.width * shrink, LUCIASTRO.height * shrink);
      ctx.restore();
      if (this.state === 'arena') this._renderHealthBar(ctx, x, y);
    } else {
      const lastPlatform = this.platforms[this.platforms.length - 1];
      const x = lastPlatform.x - cameraX + lastPlatform.w / 2 + 20;
      if (x > -80 && x < WIDTH + 80) {
        const y = lastPlatform.y - LUCIASTRO.height / 2 - 6;
        this._drawLuciastroGlow(ctx, x, y);
        ctx.drawImage(LUCIASTRO.stand, x - LUCIASTRO.width / 2, lastPlatform.y - LUCIASTRO.height - 6);
      }
    }
  }

  _renderHealthBar(ctx, x, y) {
    const barW = 70, barH = 8;
    const bx = x - barW / 2, by = y - LUCIASTRO.height / 2 - 26;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(bx - 2, by - 2, barW + 4, barH + 4);
    const pct = Math.max(0, this.luciastroHP) / LUCIASTRO_MAX_HP;
    ctx.fillStyle = PALETTE.lavaRed;
    ctx.fillRect(bx, by, barW * pct, barH);
  }

  _renderPlatform(ctx, i, cameraX) {
    const p = this.platforms[i];
    const sx = p.x - cameraX - p.w / 2;
    let color = p.safe ? PALETTE.metalMid : PALETTE.finishinisRock;
    if (i === this.currentIndex && this.state === 'onPlatform' && !p.safe) {
      const remaining = CRUMBLE_TIME - this.timer;
      if (remaining < 0.7) {
        color = Math.floor(this.timer * 12) % 2 === 0 ? PALETTE.lavaRed : PALETTE.finishinisRock;
      }
    }
    ctx.fillStyle = color;
    ctx.fillRect(sx, p.y, p.w, 16);
    ctx.fillStyle = p.isArena ? PALETTE.metalLight : PALETTE.lavaOrange;
    ctx.fillRect(sx, p.y, p.w, 3);

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

  _renderArenaPrompt(ctx) {
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.eyeGlow;
    ctx.font = 'bold 18px "Courier New", monospace';
    const blink = Math.sin(performance.now() / 200) > 0 ? 1 : 0.5;
    ctx.globalAlpha = blink;
    ctx.fillText('Premi SPAZIO per sparare!', WIDTH / 2, 90);
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
    ctx.font = 'bold 32px "Courier New", monospace';
    const messages = {
      crumble: 'SEI CADUTO NELLA LAVA',
      lavaball: 'TRAVOLTO DALLA LAVA IN VOLO!',
    };
    ctx.fillText(messages[this.failReason] || messages.crumble, WIDTH / 2, HEIGHT / 2 - 20);
    ctx.font = '17px "Courier New", monospace';
    ctx.fillText('Premi SPAZIO / tocca per ricominciare il duello', WIDTH / 2, HEIGHT / 2 + 20);
  }
}
