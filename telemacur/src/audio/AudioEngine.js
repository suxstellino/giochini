// Motore audio minimale: beep sintetizzati via Web Audio API, nessun file audio da caricare.
import { SaveManager } from '../engine/SaveManager.js';

class AudioEngineClass {
  constructor() {
    this.ctx = null;
    this.enabled = SaveManager.state.soundOn;
  }

  toggle() {
    this.enabled = !this.enabled;
    SaveManager.setSoundOn(this.enabled);
    if (this.enabled) this.select();
    return this.enabled;
  }

  _ensureContext() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { this.enabled = false; return null; }
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  // Un singolo beep: frequenza in Hz, durata in secondi, forma d'onda, volume 0..1.
  beep(freq, duration = 0.1, type = 'square', volume = 0.15, delay = 0) {
    if (!this.enabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration);
  }

  jump() { this.beep(520, 0.09, 'square', 0.12); }
  coinYellow() { this.beep(880, 0.08, 'square', 0.12); }
  coinBlue() { this.beep(660, 0.07, 'triangle', 0.12); this.beep(990, 0.07, 'triangle', 0.1, 0.05); }
  diamond() {
    this.beep(700, 0.06, 'sine', 0.14);
    this.beep(1000, 0.06, 'sine', 0.14, 0.06);
    this.beep(1300, 0.09, 'sine', 0.14, 0.12);
  }
  hit() { this.beep(120, 0.25, 'sawtooth', 0.18); }
  select() { this.beep(440, 0.05, 'square', 0.1); }
  missionComplete() {
    [523, 659, 784, 1047].forEach((f, i) => this.beep(f, 0.12, 'square', 0.13, i * 0.1));
  }
}

export const AudioEngine = new AudioEngineClass();
