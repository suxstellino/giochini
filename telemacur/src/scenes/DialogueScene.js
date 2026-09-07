// Scena di dialogo generica: un ritratto dell'NPC, qualche box di testo da avanzare con
// il tasto azione, poi una callback. Usata per Agri, Scalino, Gasolio, Acquazzone (e in
// Fase 3 per Benzo).
import { WIDTH, HEIGHT, Game } from '../engine/Game.js';
import { PALETTE } from '../sprites/palettes.js';
import { TELEMACUR } from '../sprites/characterSprites.js';
import { AudioEngine } from '../audio/AudioEngine.js';

export class DialogueScene {
  onEnter(data) {
    this.npcSprite = data.npcSprite;
    this.npcName = data.npcName;
    this.lines = data.lines;
    this.onComplete = data.onComplete;
    this.index = 0;
    this.time = 0;
    this.guard = 0.25; // piccola pausa cosi' il tasto che ha attivato il dialogo non lo salta subito
  }

  onExit() {}

  update(dt) {
    this.time += dt;
    this.guard -= dt;
    if (this.guard > 0) return;
    if (Game.input.actionJustPressed()) {
      this.index++;
      AudioEngine.select();
      if (this.index >= this.lines.length) {
        this.onComplete();
      }
    }
  }

  render(ctx) {
    ctx.fillStyle = PALETTE.spaceBlack;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let i = 0; i < 40; i++) {
      ctx.fillRect((i * 97) % WIDTH, (i * 53) % (HEIGHT - 160), 2, 2);
    }

    const bob = Math.sin(this.time * 2.4) * 5;
    const npcX = WIDTH * 0.28;
    const npcY = HEIGHT * 0.42 + bob;
    ctx.drawImage(this.npcSprite, npcX - this.npcSprite.width, npcY - this.npcSprite.height);

    const playerX = WIDTH * 0.68;
    ctx.drawImage(TELEMACUR.stand, playerX, HEIGHT * 0.42 + TELEMACUR.height * 0.3);

    const boxY = HEIGHT - 150;
    ctx.fillStyle = 'rgba(10,10,20,0.85)';
    ctx.fillRect(40, boxY, WIDTH - 80, 110);
    ctx.strokeStyle = PALETTE.metalMid;
    ctx.strokeRect(40, boxY, WIDTH - 80, 110);

    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.eyeGlow;
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillText(this.npcName, 60, boxY + 22);

    ctx.fillStyle = PALETTE.white;
    ctx.font = '16px "Courier New", monospace';
    const line = this.lines[Math.min(this.index, this.lines.length - 1)] || '';
    wrapText(ctx, line, 60, boxY + 50, WIDTH - 140, 22);

    if (this.guard <= 0) {
      ctx.textAlign = 'right';
      ctx.font = '13px "Courier New", monospace';
      ctx.fillStyle = PALETTE.metalMid;
      const blink = Math.sin(this.time * 5) > 0 ? 1 : 0.4;
      ctx.globalAlpha = blink;
      ctx.fillText('SPAZIO / tocca per continuare', WIDTH - 60, boxY + 96);
      ctx.globalAlpha = 1;
    }
  }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let dy = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + dy);
      line = word;
      dy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y + dy);
}
