// Salvataggio progressi su localStorage: missione corrente, potenziamenti navicella, monete totali.
const SAVE_KEY = 'telemacur_save_v1';

export const MISSION_ORDER = ['moon', 'venus', 'mars', 'saturn', 'neptune', 'finishinis'];

function defaultState() {
  return {
    unlockedMissionIndex: 0, // indice in MISSION_ORDER fino a cui si può giocare
    shipStage: 0, // 0..5, vedi shipSprites.js
    totalCoins: { yellow: 0, blue: 0, diamond: 0 },
    companions: { agri: false, scalino: false, gasolio: false, acquazzone: false },
    introSeen: false,
    soundOn: true,
  };
}

class SaveManagerClass {
  constructor() {
    this.state = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return { ...defaultState(), ...parsed };
    } catch (e) {
      return defaultState();
    }
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
    } catch (e) {
      // storage non disponibile: si continua comunque solo in-memory
    }
  }

  reset() {
    this.state = defaultState();
    this.save();
  }

  unlockNextMission(currentMissionId) {
    const idx = MISSION_ORDER.indexOf(currentMissionId);
    if (idx >= 0 && idx + 1 > this.state.unlockedMissionIndex) {
      this.state.unlockedMissionIndex = idx + 1;
    }
    this.save();
  }

  addCoins(type, amount) {
    this.state.totalCoins[type] = (this.state.totalCoins[type] || 0) + amount;
    this.save();
  }

  setShipStage(stage) {
    this.state.shipStage = Math.max(this.state.shipStage, stage);
    this.save();
  }

  setCompanion(name) {
    this.state.companions[name] = true;
    this.save();
  }

  markIntroSeen() {
    this.state.introSeen = true;
    this.save();
  }

  setSoundOn(value) {
    this.state.soundOn = value;
    this.save();
  }
}

export const SaveManager = new SaveManagerClass();
