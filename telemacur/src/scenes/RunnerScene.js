// Motore comune a tutte le missioni "endless runner" (Luna, Venere, Marte, Saturno,
// Nettuno). Un solo tasto per saltare, scorrimento automatico che accelera pian piano,
// monete generate proceduralmente, game over al primo urto con ripartenza dalla stessa
// missione (i progressi delle missioni precedenti restano salvati).
import { WIDTH, HEIGHT, Game } from '../engine/Game.js';
import { TELEMACUR, SCALINO } from '../sprites/characterSprites.js';
import { COIN_YELLOW, COIN_BLUE, COIN_DIAMOND, COIN_SIZE } from '../sprites/coinSprites.js';
import { AudioEngine } from '../audio/AudioEngine.js';
import { SaveManager } from '../engine/SaveManager.js';
import { MISSIONS } from '../data/missions.js';
import { makeRng } from '../engine/Pixel.js';
import { PALETTE } from '../sprites/palettes.js';

const GRAVITY = 2200;
const JUMP_VELOCITY = -720;

function aabbOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class RunnerScene {
  onEnter(data) {
    this.missionId = data.missionId;
    this.onFinished = data.onFinished; // callback(mission) chiamata all'obiettivo raggiunto
    this.mission = MISSIONS[this.missionId];
    this.background = this.mission.createBackground();
    this.obstacleSprites = this.mission.createObstacles();
    this._resetAttempt();
  }

  _resetAttempt() {
    const m = this.mission;
    this.groundY = m.groundY;
    this.player = {
      x: 120,
      y: this.groundY - TELEMACUR.height,
      vy: 0,
      onGround: true,
      width: TELEMACUR.width - 12,
      height: TELEMACUR.height,
    };
    this.elapsed = 0;
    this.scrollX = 0;
    this.obstacles = [];
    this.coins = [];
    this.nextObstacleIn = 1.3;
    this.nextCoinIn = 0.7;
    this.runAnimTimer = 0;
    this.runFrame = 0;
    this.collected = { yellow: 0, blue: 0, diamond: 0 };
    this.diamondsUnlocked = !m.objective.diamonds; // se non richiesti, "sbloccati" da subito
    this.rng = makeRng((Date.now() & 0xfffffff) + 17);
    this.state = 'playing'; // playing | gameover | won
    this.postWinTimer = 0;
    this.flashTimer = 0;
  }

  onExit() {}

  update(dt) {
    const input = Game.input;
    if (this.state === 'playing') this._updatePlaying(dt, input);
    else if (this.state === 'gameover') {
      if (input.actionJustPressed()) this._resetAttempt();
    } else if (this.state === 'won') {
      this.postWinTimer += dt;
      if (this.postWinTimer > 0.5 && input.actionJustPressed() && this.onFinished) {
        this.onFinished(this.mission);
      }
    }
  }

  _updatePlaying(dt, input) {
    const m = this.mission;
    this.elapsed += dt;
    const speed = Math.min(m.maxSpeed, m.baseSpeed + this.elapsed * m.speedRampPerSecond);
    this.scrollX += speed * dt;

    const p = this.player;
    if (input.actionJustPressed() && p.onGround) {
      p.vy = JUMP_VELOCITY;
      p.onGround = false;
      AudioEngine.jump();
    }
    p.vy += GRAVITY * dt;
    p.y += p.vy * dt;
    const floorY = this.groundY - p.height;
    if (p.y >= floorY) {
      p.y = floorY;
      p.vy = 0;
      p.onGround = true;
    }

    if (p.onGround) {
      this.runAnimTimer += dt;
      if (this.runAnimTimer > 0.11) {
        this.runAnimTimer = 0;
        this.runFrame = 1 - this.runFrame;
      }
    }

    // Diamanti (se richiesti dalla missione) sbloccati solo dopo un po' di tempo, per dare
    // tensione: appaiono rari e solo nella seconda meta' del livello.
    if (!this.diamondsUnlocked && this.elapsed > (m.objective.diamondsAfterSeconds || 20)) {
      this.diamondsUnlocked = true;
    }

    this._updateSpawns(dt, speed);
    this._updateEntities(dt, speed);
    this._checkCollisions();
    this._checkObjective();
  }

  _updateSpawns(dt, speed) {
    const m = this.mission;
    this.nextObstacleIn -= dt;
    if (this.nextObstacleIn <= 0) {
      this._spawnObstacle();
      this.nextObstacleIn = 0.95 + this.rng() * 0.55;
    }
    this.nextCoinIn -= dt;
    if (this.nextCoinIn <= 0) {
      this._spawnCoin(m);
      this.nextCoinIn = 0.45 + this.rng() * 0.5;
    }
  }

  _spawnObstacle() {
    // I tipi disponibili dipendono dal set dell'ostacolo del pianeta (alcuni aggiungono
    // una creatura aliena oltre a rocce e crateri, vedi data/missions.js).
    const kinds = Object.keys(this.obstacleSprites);
    const kind = kinds[Math.floor(this.rng() * kinds.length)];
    const sprite = this.obstacleSprites[kind];
    const w = sprite.width, h = sprite.height;
    this.obstacles.push({ x: WIDTH + 20, y: this.groundY - h, w, h, sprite });
  }

  _spawnCoin(m) {
    const roll = this.rng();
    let type = 'yellow';
    const spawn = m.coinSpawn;
    if (this.diamondsUnlocked && spawn.diamond && roll < spawn.diamond) {
      type = 'diamond';
    } else if (spawn.blue && roll < (spawn.diamond || 0) + spawn.blue) {
      type = 'blue';
    } else {
      type = 'yellow';
    }
    const height = this.groundY - COIN_SIZE - 10 - this.rng() * 90;
    this.coins.push({ x: WIDTH + 10, y: height, type, taken: false });
  }

  _updateEntities(dt, speed) {
    for (const o of this.obstacles) o.x -= speed * dt;
    for (const c of this.coins) c.x -= speed * dt;
    this.obstacles = this.obstacles.filter((o) => o.x + o.w > -10);
    this.coins = this.coins.filter((c) => c.x + COIN_SIZE > -10 && !c.taken);
  }

  _checkCollisions() {
    const p = this.player;
    const pBox = { x: p.x, y: p.y, w: p.width, h: p.height };
    for (const o of this.obstacles) {
      if (aabbOverlap(pBox, o)) {
        this.state = 'gameover';
        AudioEngine.hit();
        return;
      }
    }
    for (const c of this.coins) {
      const cBox = { x: c.x, y: c.y, w: COIN_SIZE, h: COIN_SIZE };
      if (aabbOverlap(pBox, cBox)) {
        c.taken = true;
        this.collected[c.type]++;
        if (c.type === 'yellow') AudioEngine.coinYellow();
        else if (c.type === 'blue') AudioEngine.coinBlue();
        else AudioEngine.diamond();
      }
    }
  }

  _checkObjective() {
    const obj = this.mission.objective;
    const col = this.collected;
    let done = false;
    if (obj.type === 'yellow') done = col.yellow >= obj.target;
    else if (obj.type === 'blue') done = col.blue >= obj.target;
    else if (obj.type === 'mixed') done = col.yellow + col.blue >= obj.target;
    else if (obj.type === 'mixedPlusDiamonds') {
      done = col.yellow + col.blue >= obj.target && col.diamond >= obj.diamonds;
    }
    if (done && this.state === 'playing') {
      this.state = 'won';
      this.postWinTimer = 0;
      SaveManager.addCoins('yellow', col.yellow);
      SaveManager.addCoins('blue', col.blue);
      SaveManager.addCoins('diamond', col.diamond);
      if (this.mission.onCompleteShipStage != null) {
        SaveManager.setShipStage(this.mission.onCompleteShipStage);
      }
      if (this.mission.companionKey) {
        SaveManager.setCompanion(this.mission.companionKey);
      }
      SaveManager.unlockNextMission(this.mission.id);
      AudioEngine.missionComplete();
    }
  }

  render(ctx) {
    this.background.render(ctx, this.scrollX, WIDTH, HEIGHT, this.groundY);

    // Terreno
    ctx.fillStyle = this.background.groundColor;
    ctx.fillRect(0, this.groundY, WIDTH, HEIGHT - this.groundY);
    ctx.fillStyle = this.background.groundLineColor;
    ctx.fillRect(0, this.groundY, WIDTH, 4);

    for (const o of this.obstacles) ctx.drawImage(o.sprite, o.x, o.y);

    const t = performance.now() / 1000;
    const shine = Math.floor(t * 6) % 2 === 0;
    for (const c of this.coins) {
      const set = c.type === 'yellow' ? COIN_YELLOW : c.type === 'blue' ? COIN_BLUE : COIN_DIAMOND;
      ctx.drawImage(shine ? set.a : set.b, c.x, c.y);
    }

    this._renderPlayer(ctx);
    this._renderHud(ctx);

    if (this.state === 'gameover') this._renderGameOver(ctx);
    if (this.state === 'won') this._renderWin(ctx);
  }

  _renderPlayer(ctx) {
    const p = this.player;
    let sprite;
    if (!p.onGround) sprite = TELEMACUR.jump;
    else sprite = this.runFrame === 0 ? TELEMACUR.runA : TELEMACUR.runB;

    // Scalino, una volta unitosi al gruppo (dopo Marte), trotterella dietro a Telemacur.
    if (SaveManager.state.companions.scalino) {
      const bob = p.onGround && this.runFrame === 1 ? -3 : 0;
      ctx.drawImage(SCALINO.stand, p.x - 34, this.groundY - SCALINO.height + bob);
    }

    ctx.drawImage(sprite, p.x - 6, p.y);
  }

  _renderHud(ctx) {
    ctx.save();
    ctx.font = '16px "Courier New", monospace';
    ctx.textBaseline = 'top';

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(10, 10, 260, 66);

    ctx.drawImage(COIN_YELLOW.a, 18, 12, 18, 18);
    ctx.fillStyle = PALETTE.white;
    ctx.fillText(`${this.collected.yellow}`, 40, 16);

    ctx.drawImage(COIN_BLUE.a, 92, 12, 18, 18);
    ctx.fillStyle = PALETTE.white;
    ctx.fillText(`${this.collected.blue}`, 114, 16);

    ctx.drawImage(COIN_DIAMOND.a, 166, 12, 18, 18);
    ctx.fillStyle = PALETTE.white;
    ctx.fillText(`${this.collected.diamond}`, 188, 16);

    ctx.fillStyle = PALETTE.starWhite;
    ctx.fillText(this.mission.planetName, 20, 40);
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText(this.mission.objectiveLabel, 20, 58);

    ctx.restore();
  }

  _renderGameOver(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(5,5,10,0.72)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.white;
    ctx.font = 'bold 40px "Courier New", monospace';
    ctx.fillText('MISSIONE FALLITA', WIDTH / 2, HEIGHT / 2 - 40);
    ctx.font = '18px "Courier New", monospace';
    ctx.fillText(`Monete raccolte: ${this.collected.yellow + this.collected.blue}`, WIDTH / 2, HEIGHT / 2 + 6);
    ctx.fillText('Premi SPAZIO / tocca per riprovare', WIDTH / 2, HEIGHT / 2 + 40);
    ctx.restore();
  }

  _renderWin(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(10,20,15,0.6)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.eyeGlow;
    ctx.font = 'bold 36px "Courier New", monospace';
    ctx.fillText('MISSIONE COMPLETATA!', WIDTH / 2, HEIGHT / 2 - 40);
    ctx.fillStyle = PALETTE.white;
    ctx.font = '18px "Courier New", monospace';
    ctx.fillText(this.mission.completionMessage || '', WIDTH / 2, HEIGHT / 2);
    if (this.postWinTimer > 0.5) {
      ctx.fillText('Premi SPAZIO / tocca per continuare', WIDTH / 2, HEIGHT / 2 + 40);
    }
    ctx.restore();
  }
}
