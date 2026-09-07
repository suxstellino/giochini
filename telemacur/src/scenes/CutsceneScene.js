// Sequenza di schermate non interattive (usata per l'apertura, la partenza verso
// Andromeda e l'epilogo finale): ogni slide disegna se stessa e mostra una didascalia,
// si avanza con il tasto azione.
import { WIDTH, HEIGHT, Game } from '../engine/Game.js';
import { PALETTE } from '../sprites/palettes.js';
import { AudioEngine } from '../audio/AudioEngine.js';

export class CutsceneScene {
  onEnter(data) {
    this.slides = data.slides; // [{ draw(ctx, w, h, t), caption }]
    this.onComplete = data.onComplete;
    this.index = 0;
    this.time = 0;
    this.guard = 0.25;
  }

  onExit() {}

  update(dt) {
    this.time += dt;
    this.guard -= dt;
    if (this.guard > 0) return;
    if (Game.input.actionJustPressed()) {
      AudioEngine.select();
      this.index++;
      this.time = 0;
      this.guard = 0.2;
      if (this.index >= this.slides.length) this.onComplete();
    }
  }

  render(ctx) {
    const slide = this.slides[Math.min(this.index, this.slides.length - 1)];
    if (!slide) return;
    slide.draw(ctx, WIDTH, HEIGHT, this.time);

    if (slide.caption) {
      const boxY = HEIGHT - 110;
      ctx.fillStyle = 'rgba(10,10,20,0.78)';
      ctx.fillRect(40, boxY, WIDTH - 80, 70);
      ctx.textAlign = 'center';
      ctx.fillStyle = PALETTE.white;
      ctx.font = '17px "Courier New", monospace';
      ctx.fillText(slide.caption, WIDTH / 2, boxY + 40);
    }

    if (this.guard <= 0) {
      ctx.textAlign = 'right';
      ctx.font = '13px "Courier New", monospace';
      ctx.fillStyle = PALETTE.metalMid;
      const blink = Math.sin(this.time * 5) > 0 ? 1 : 0.4;
      ctx.globalAlpha = blink;
      ctx.fillText('SPAZIO / tocca per continuare', WIDTH - 50, HEIGHT - 20);
      ctx.globalAlpha = 1;
    }
  }
}
