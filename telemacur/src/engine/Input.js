// Gestione input da tastiera, mouse/touch. Espone stato "premuto ora" e "premuto questo frame".
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.justPressedKeys = new Set();
    this.pointerDown = false;
    this.justPointerDown = false;
    this.canvas = canvas;
    this.muteRect = null; // impostato da Game: {x,y,w,h} in coordinate canvas
    this.muteJustClicked = false;

    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      if (!this.keys.has(e.code)) this.justPressedKeys.add(e.code);
      this.keys.add(e.code);
    }, { passive: false });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    const canvasPoint = (e) => {
      const rect = canvas.getBoundingClientRect();
      const client = e.touches && e.touches[0] ? e.touches[0] : e;
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return { x: (client.clientX - rect.left) * scaleX, y: (client.clientY - rect.top) * scaleY };
    };

    const hitsMuteIcon = (p) => {
      const r = this.muteRect;
      return r && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
    };

    const onDown = (e) => {
      e.preventDefault();
      const p = canvasPoint(e);
      if (hitsMuteIcon(p)) {
        this.muteJustClicked = true;
        return;
      }
      this.pointerDown = true;
      this.justPointerDown = true;
    };
    const onUp = (e) => {
      this.pointerDown = false;
    };
    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('touchstart', onDown, { passive: false });
    canvas.addEventListener('touchend', onUp);
  }

  isDown(code) {
    return this.keys.has(code);
  }

  wasJustPressed(code) {
    return this.justPressedKeys.has(code);
  }

  // Il tasto "azione" copre spazio, freccia su e tap/click - un solo comando per tutto il gioco.
  actionJustPressed() {
    return this.justPressedKeys.has('Space') ||
      this.justPressedKeys.has('ArrowUp') ||
      this.justPointerDown;
  }

  actionDown() {
    return this.keys.has('Space') || this.keys.has('ArrowUp') || this.pointerDown;
  }

  endFrame() {
    this.justPressedKeys.clear();
    this.justPointerDown = false;
    this.muteJustClicked = false;
  }
}
