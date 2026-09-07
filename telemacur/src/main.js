import { Game } from './engine/Game.js';
import { MenuScene } from './scenes/MenuScene.js';
import { RunnerScene } from './scenes/RunnerScene.js';
import { TransitionScene } from './scenes/TransitionScene.js';
import { DialogueScene } from './scenes/DialogueScene.js';
import { CutsceneScene } from './scenes/CutsceneScene.js';
import { BossScene } from './scenes/BossScene.js';
import { EscapeScene } from './scenes/EscapeScene.js';
import { SaveManager } from './engine/SaveManager.js';
import { MISSIONS } from './data/missions.js';
import {
  createIntroSlides, createDepartureSlides, createEpilogueSlides, BENZO_LINES, BENZO,
} from './data/finale.js';

const canvas = document.getElementById('game-canvas');
Game.init(canvas);

const menuScene = new MenuScene();
const runnerScene = new RunnerScene();
const transitionScene = new TransitionScene();
const dialogueScene = new DialogueScene();
const cutsceneScene = new CutsceneScene();
const bossScene = new BossScene();
const escapeScene = new EscapeScene();

menuScene.onStart = (missionId) => {
  if (missionId === 'moon' && !SaveManager.state.introSeen) {
    Game.scenes.goto(cutsceneScene, {
      slides: createIntroSlides(),
      onComplete: () => {
        SaveManager.markIntroSeen();
        goToMission('moon');
      },
    });
  } else {
    goToMission(missionId);
  }
};

function goToMission(missionId) {
  const mission = MISSIONS[missionId];
  if (mission.isFinale) {
    startFinale();
    return;
  }
  Game.scenes.goto(runnerScene, {
    missionId,
    onFinished: (finishedMission) => {
      if (finishedMission.npc) {
        Game.scenes.goto(dialogueScene, {
          npcSprite: finishedMission.npc.sprite,
          npcName: finishedMission.npc.name,
          lines: finishedMission.npc.lines,
          onComplete: () => goToTransition(finishedMission),
        });
      } else {
        goToTransition(finishedMission);
      }
    },
  });
}

function goToTransition(mission) {
  Game.scenes.goto(transitionScene, {
    mission,
    onContinue: (nextMissionId) => {
      if (nextMissionId) goToMission(nextMissionId);
      else Game.scenes.goto(menuScene);
    },
  });
}

// Scena 1: Terra, incontro con Benzo -> partenza verso Andromeda.
// Scena 2: boss a piattaforme su Finishinis.
// Scena 3: fuga a tempo.
// Scena 4: epilogo non interattivo.
function startFinale() {
  Game.scenes.goto(dialogueScene, {
    npcSprite: BENZO.stand,
    npcName: 'Benzo',
    lines: BENZO_LINES,
    onComplete: () => {
      Game.scenes.goto(cutsceneScene, {
        slides: createDepartureSlides(),
        onComplete: () => {
          Game.scenes.goto(bossScene, {
            onComplete: () => {
              Game.scenes.goto(escapeScene, {
                onComplete: () => {
                  Game.scenes.goto(cutsceneScene, {
                    slides: createEpilogueSlides(),
                    onComplete: () => Game.scenes.goto(menuScene),
                  });
                },
              });
            },
          });
        },
      });
    },
  });
}

Game.scenes.goto(menuScene);
Game.start();
