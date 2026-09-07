// Gestore scene molto semplice: una sola scena attiva alla volta, con callback di ciclo
// vita e una piccola dissolvenza in ingresso per ammorbidire i cambi di schermata.
const FADE_DURATION = 0.28;

export class SceneManager {
  constructor(game) {
    this.game = game;
    this.current = null;
    this.fadeAlpha = 0;
  }

  goto(scene, data) {
    if (this.current && this.current.onExit) this.current.onExit();
    this.current = scene;
    if (this.current.onEnter) this.current.onEnter(data);
    this.fadeAlpha = 1;
  }

  update(dt) {
    if (this.current && this.current.update) this.current.update(dt);
    if (this.fadeAlpha > 0) this.fadeAlpha = Math.max(0, this.fadeAlpha - dt / FADE_DURATION);
  }

  render(ctx) {
    if (this.current && this.current.render) this.current.render(ctx);
    if (this.fadeAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = this.fadeAlpha;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }
  }
}
