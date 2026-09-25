import Phaser from 'phaser';
import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/700.css';
import './ui/style.css';
import { AudioEngine } from './audio/AudioEngine';
import { GAME_H, GAME_W, UI_W } from './config';
import { AquariumScene } from './scenes/AquariumScene';
import { BootScene } from './scenes/BootScene';
import { TowerScene } from './scenes/TowerScene';
import { services } from './services';
import { createNewState } from './state/GameState';
import { loadGame } from './state/SaveManager';
import { Sim } from './systems/Sim';
import { saveOnUnload, UI } from './ui/UI';

const app = document.getElementById('app')!;
const uiRoot = document.getElementById('ui')!;

function updatePixelSize(): void {
  app.style.setProperty('--px', `${app.clientWidth / UI_W}px`);
}
updatePixelSize();
window.addEventListener('resize', updatePixelSize);

const state = loadGame() ?? createNewState();
const sim = new Sim(state);
services.sim = sim;
services.audio = new AudioEngine(state.settings.muted);
const offline = sim.applyOffline();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  pixelArt: true,
  backgroundColor: '#bfe8f2',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.NO_CENTER },
  input: { activePointers: 2 },
  scene: [BootScene, TowerScene, AquariumScene],
});
services.game = game;

const params = new URLSearchParams(location.search);
const isGallery = params.has('gallery');
/** `?speed=10` accélère la simulation (pratique pour tester). */
const speed = Math.max(1, Number(params.get('speed')) || 1);
if (!isGallery) {
  services.ui = new UI(uiRoot);

  // La simulation avance à chaque image, quelle que soit la scène affichée.
  game.events.on(Phaser.Core.Events.STEP, (_time: number, delta: number) => {
    sim.update((Math.min(delta, 250) / 1000) * speed);
  });

  game.events.once(Phaser.Core.Events.READY, () => {
    if (!state.tutorialDone) {
      services.ui.openWelcome(() => {
        state.tutorialDone = true;
        sim.save();
      });
    } else if (offline.seconds >= 60) {
      const minutes = Math.round(offline.seconds / 60);
      services.ui.toast(
        `Pendant ton absence (${minutes} min) : +${offline.coins} pièces` +
          (offline.arrivals ? `, ${offline.arrivals} nouveau${offline.arrivals > 1 ? 'x' : ''} poisson${offline.arrivals > 1 ? 's' : ''}` : '') +
          '.',
        { icon: 'coin', duration: 6000 },
      );
    }
  });

  // Pause / reprise : on sauvegarde en partant, on rattrape le temps au retour.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      sim.save();
      services.audio.suspend();
    } else {
      const back = sim.applyOffline();
      services.audio.resume();
      if (back.coins > 0 || back.arrivals > 0) {
        services.ui.toast(`Bon retour ! +${back.coins} pièces`, { icon: 'coin' });
      }
    }
  });
  window.addEventListener('beforeunload', saveOnUnload);
  window.addEventListener('pagehide', saveOnUnload);
  document.addEventListener('pointerdown', () => services.audio.unlock(), { once: true });
}

// Accès de débogage en développement : window.aquachill.sim, etc.
if (import.meta.env.DEV) (window as any).aquachill = services;
