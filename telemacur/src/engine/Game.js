import { Input } from './Input.js';
import { SceneManager } from './SceneManager.js';
import { AudioEngine } from '../audio/AudioEngine.js';
import { PALETTE } from '../sprites/palettes.js';

export const WIDTH = 960;
export const HEIGHT = 540;

const MUTE_RECT = { x: WIDTH - 36, y: 8, w: 28, h: 28 };

class GameClass {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.input = null;
    this.scenes = null;
    this._lastTime = 0;
    this._running = false;
  }

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.input = new Input(canvas);
    this.input.muteRect = MUTE_RECT;
    this.scenes = new SceneManager(this);
  }

  start() {
    this._running = true;
    requestAnimationFrame(this._loop.bind(this));
  }

  _loop(time) {
    if (!this._running) return;
    const dt = Math.min((time - this._lastTime) / 1000, 1 / 20) || 0;
    this._lastTime = time;

    if (this.input.wasJustPressed('KeyM') || this.input.muteJustClicked) {
      AudioEngine.toggle();
    }

    this.scenes.update(dt);

    this.ctx.clearRect(0, 0, WIDTH, HEIGHT);
    this.scenes.render(this.ctx);
    this._renderMuteIcon();

    this.input.endFrame();
    requestAnimationFrame(this._loop.bind(this));
  }

  // Icona sempre visibile, sopra ogni scena: altoparlante pieno o barrato. Tocco/click
  // sull'icona e tasto M fanno entrambi la stessa cosa (vedi Input.js e sopra).
  _renderMuteIcon() {
    const ctx = this.ctx;
    const r = MUTE_RECT;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = AudioEngine.enabled ? PALETTE.white : PALETTE.metalMid;
    ctx.beginPath();
    ctx.moveTo(r.x + 6, r.y + 10);
    ctx.lineTo(r.x + 11, r.y + 10);
    ctx.lineTo(r.x + 17, r.y + 5);
    ctx.lineTo(r.x + 17, r.y + 23);
    ctx.lineTo(r.x + 11, r.y + 18);
    ctx.lineTo(r.x + 6, r.y + 18);
    ctx.closePath();
    ctx.fill();
    if (!AudioEngine.enabled) {
      ctx.strokeStyle = PALETTE.lavaRed;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(r.x + 4, r.y + 4);
      ctx.lineTo(r.x + 24, r.y + 24);
      ctx.stroke();
    } else {
      ctx.strokeStyle = PALETTE.white;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(r.x + 18, r.y + 14, 6, -0.6, 0.6);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export const Game = new GameClass();
