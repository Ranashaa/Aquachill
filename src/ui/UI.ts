import { TANK_CAPACITY } from '../config';
import { BIOMES, tempLabel, TEMP_NAMES, type Temp } from '../data/biomes';
import { DECOR, decorForBiome, TAG_NAMES, type DecorId } from '../data/decor';
import { FLOOR_PLAN } from '../data/progression';
import {
  RARITY_NAMES, SPECIES, SPECIES_BY_ID, speciesForBiome, wikiUrl, type Rarity, type Species, type SpeciesId,
} from '../data/species';
import { STARS, STARS_BY_ID, type StarId } from '../data/stars';
import type { AquariumScene } from '../scenes/AquariumScene';
import { services } from '../services';
import { decorKey, fishKey, fishTexture, starKey } from '../sprites';
import { spriteCanvasSize, spriteUrl } from '../sprites/SpriteFactory';
import { discoveredCount, findFish } from '../state/GameState';
import { clearSave } from '../state/SaveManager';
import { cleanliness } from '../systems/algae';
import { eligibleSpecies } from '../systems/attraction';
import { happiness, mood, MOOD_TEXT } from '../systems/happiness';
import { levelProgress, requirementStatus } from '../systems/progression';
import { shuffle } from '../systems/rng';
import { h, pxImg } from './dom';
import { AMBIENCE_NAMES, type Ambience } from '../audio/AudioEngine';
import { randomThought, thoughtOfTheDay } from '../data/thoughts';
import { DESTINATIONS, DESTINATIONS_BY_ID } from '../data/expeditions';
import { hearts, PERSONALITIES } from '../data/personality';
import { VARIANTS } from '../data/variants';
import { minutesToNextStage, missionText, STAGE_NAMES } from '../systems/life';
import * as farm from '../systems/farm';
import { CROPS, CROP_LIST, type CropId } from '../data/garden';
import { VILLAGERS, type VillagerId } from '../data/villagers';
import { BUNDLES } from '../data/bundles';
import { cropKey, villagerKey } from '../sprites';

type Mode = 'tower' | 'aquarium' | 'zen';

const stars = (r: Rarity) => ({ common: '★☆☆', uncommon: '★★☆', rare: '★★★' })[r];

function sprite(key: string, scale = 1, frame = 0): HTMLImageElement {
  const { w, h: hh } = spriteCanvasSize(key);
  return pxImg(spriteUrl(key, frame), w, hh, scale);
}

/** Sprite agrandi au plus grand facteur entier qui tient dans la boîte (en px logiques). */
function fit(key: string, maxW: number, maxH: number, maxScale = 5): HTMLImageElement {
  const { w, h: hh } = spriteCanvasSize(key);
  let scale = Math.min(maxScale, Math.floor(Math.min(maxW / w, maxH / hh)));
  if (scale < 1) scale = Math.min(maxW / w, maxH / hh);
  return pxImg(spriteUrl(key), w, hh, scale);
}

function timeAgo(at: number): string {
  const min = Math.round((services.sim.now() - at) / 60_000);
  if (min < 1) return 'à l’instant';
  if (min < 60) return `il y a ${min} min`;
  const hours = Math.round(min / 60);
  return hours < 24 ? `il y a ${hours} h` : `il y a ${Math.round(hours / 24)} j`;
}

function waterBg(biome: Species['biome']): string {
  const p = BIOMES[biome].palette;
  return `background: linear-gradient(${p.waterTop}, ${p.waterBottom} 80%, ${p.sand} 80%);`;
}

export class UI {
  private hudTop = h('div', { class: 'hud-top' });
  private hudBottom = h('div', { class: 'hud-bottom' });
  private toasts = h('div', { class: 'toasts' });
  private modal: HTMLElement | null = null;
  private mode: Mode = 'tower';
  private floor = 0;
  private coinText = h('span');
  private levelText = h('span');
  private xpFill = h('div');
  private clockText = h('span');
  private clockIcon = h('span');

  constructor(private root: HTMLElement) {
    root.append(this.hudTop, this.hudBottom, this.toasts);
    const sim = services.sim;
    sim.events.on('coins', () => {
      this.updateStats();
      this.refreshBuildHint();
    });
    sim.events.on('xp', () => {
      this.updateStats();
      this.refreshBuildHint();
    });
    sim.events.on('levelUp', (level) => {
      services.audio.play('levelUp');
      const newStars = STARS.filter((s) => s.level === level);
      this.toast(`La tour passe au niveau ${level} ! +${level * 15} pièces`, { icon: 'star' });
      if (newStars.length) this.toast('De nouvelles stars pourraient passer te rendre visite…', { icon: 'sparkle' });
    });
    sim.events.on('identifyChanged', () => this.renderHud());
    sim.events.on('fishArrived', ({ floor, fish, isNew }) => {
      const s = SPECIES_BY_ID[fish.species];
      const where = BIOMES[sim.state.floors[floor].biome].name;
      if (isNew) {
        services.audio.play('newFish');
        this.toast(`Un poisson inconnu est arrivé (${where}) ! Touche pour l’identifier.`, {
          icon: 'question',
          onClick: () => this.openIdentify(fish.uid),
          duration: 6000,
        });
      } else {
        sim.addNews(`${fish.name} (${s.name}) a rejoint l’aquarium ${where}.`, fishKey(s.id));
      }
      if (this.mode === 'aquarium') this.refreshAquariumHud();
    });
    sim.events.on('starArrived', (v) => {
      const star = STARS_BY_ID[v.star!];
      if (services.sim.state.stars[star.id] === 1) {
        this.newStars.add(star.id);
        services.audio.play('levelUp');
        this.toast(`Nouvelle star pour l’album : ${star.name} !`, {
          img: starKey(star.id), duration: 7000, onClick: () => this.openStarAlbum(),
        });
        this.renderHud();
      } else {
        sim.addNews(`${star.name} est de retour dans la tour.`, starKey(star.id));
      }
    });
    sim.events.on('starTapped', ({ visitor, bonus }) => {
      services.audio.play('coin');
      const star = STARS_BY_ID[visitor.star!];
      this.toast(`${star.name} : « ${star.quote} » +${bonus}`, { img: starKey(star.id), duration: 6000 });
    });
    sim.events.on('cleaned', ({ reward }) => this.toast(`Vitre étincelante ! +${reward} pièces`, { icon: 'sparkle' }));
    sim.events.on('floorBuilt', (i) => {
      this.refreshBuildHint();
      services.audio.play('build');
      const b = BIOMES[sim.state.floors[i].biome];
      this.toast(`Nouvel étage : ${b.name} ! De nouvelles espèces t’attendent.`, { icon: 'sparkle', duration: 5000 });
    });
    sim.events.on('eggLaid', ({ fish }) => {
      this.toast(`Un œuf est apparu ! (${fish.parents?.join(' + ')})`, { icon: 'eggs', duration: 5000 });
    });
    sim.events.on('fishGrew', ({ fish }) => {
      if (fish.stage === 'fry') {
        services.audio.play('newFish');
        this.toast(`${fish.name} vient d’éclore !${fish.variant ? ' Une couleur rare !' : ''}`, {
          img: fishTexture(fish), duration: 5000, onClick: () => this.openFishCard(fish.uid),
        });
      }
    });
    sim.events.on('expeditionDone', ({ entry }) => {
      services.audio.play('levelUp');
      this.toast('Le sous-marin est rentré avec un œuf ! Touche pour le voir.', {
        icon: 'ico-sub', duration: 8000, onClick: () => this.openExpedition(),
      });
      void entry;
      this.renderHud();
    });
    sim.events.on('expeditionStarted', () => this.renderHud());
    sim.events.on('missionDone', (m) => {
      services.audio.play('coin');
      this.toast(`Objectif atteint : ${missionText(m)} ! +${m.reward}`, { icon: 'ico-list', duration: 5000 });
    });
    sim.events.on('news', () => {
      this.unread++;
      this.updateBell();
    });
    sim.events.on('late', () => {
      this.toast('Minuit passé… Ton soigneur bâille. Va dormir au comptoir de l’accueil.', { icon: 'ico-moon', duration: 6000 });
    });
    setInterval(() => this.updateClock(), 1000);
  }

  private updateClock(): void {
    const s = services.sim.state;
    const cal = farm.calendar(s.day.n);
    this.clockText.textContent = `${cal.season.slice(0, 5)}. ${cal.dayOfSeason} · ${farm.clockText(s.day.minute)}`;
    const night = farm.gameHour(s) >= 20 || farm.gameHour(s) < 6;
    const key = night ? 'ico-moon' : 'star';
    if (this.clockIcon.dataset.k !== key) {
      this.clockIcon.dataset.k = key;
      this.clockIcon.replaceChildren(sprite(key));
    }
    this.clockText.parentElement?.classList.toggle('late', farm.isLate(s));
  }

  private unread = 0;
  private bell = h('span', { class: 'badge' });

  private updateBell(): void {
    this.bell.textContent = String(this.unread);
    this.bell.style.display = this.unread ? '' : 'none';
  }

  // ======================================================================= HUD

  setMode(mode: Mode, floor = 0): void {
    if (mode !== this.mode || floor !== this.floor) this.closeModal();
    this.mode = mode;
    this.floor = floor;
    this.renderHud();
  }

  private aquarium(): AquariumScene | null {
    const scene = services.game.scene.getScene('Aquarium') as AquariumScene | null;
    return scene && scene.scene.isActive() ? scene : null;
  }

  private coinPill(): HTMLElement {
    return h('div', { class: 'pill' }, sprite('coin'), this.coinText);
  }

  private updateStats(): void {
    const s = services.sim.state;
    this.coinText.textContent = s.coins.toLocaleString('fr-FR');
    const lp = levelProgress(s.xp);
    this.levelText.textContent = `Tour niv. ${lp.level}`;
    this.xpFill.style.width = `${Math.round(lp.ratio * 100)}%`;
  }

  private soundBtn(): HTMLElement {
    const btn = h('button', { class: 'btn icon', title: 'Son', 'aria-label': 'Son' });
    const render = () => btn.replaceChildren(sprite(services.audio.isMuted ? 'mute' : 'speaker'));
    render();
    btn.addEventListener('click', () => {
      services.audio.unlock();
      const muted = !services.audio.isMuted;
      services.audio.setMuted(muted);
      services.sim.state.settings.muted = muted;
      render();
    });
    return btn;
  }

  /** Bouton-outil : icône et légende, façon barre d'outils. */
  private tool(icon: string, label: string, onclick: () => void, badge?: string | number | null, active = false): HTMLElement {
    return h('button', { class: `tool${active ? ' active' : ''}`, onclick: () => { services.audio.play('click'); onclick(); } },
      sprite(icon), h('span', null, label), badge ? h('span', { class: 'badge' }, badge) : null);
  }

  renderHud(): void {
    const sim = services.sim;
    this.root.classList.toggle('zen', this.mode === 'zen');
    if (this.mode === 'zen') {
      if (this.pause) {
        this.hudBottom.replaceChildren(
          this.tool('bubble', 'Respirer', () => this.openBreathing()),
          h('div', { class: 'pause-clock' }, this.pauseClock),
          this.tool('ico-camera', 'Photo', () => this.aquarium()?.photo()),
          this.tool('ico-leaf', 'Terminer', () => this.endPause(true)),
        );
      } else {
        this.hudBottom.replaceChildren(
          this.tool('fishicon', 'Quitter', () => this.aquarium()?.setZen(false) ?? this.setMode('aquarium', this.floor)),
          this.tool('bubble', 'Respirer', () => this.openBreathing()),
          this.tool('ico-camera', 'Photo', () => this.aquarium()?.photo()),
        );
      }
      return;
    }
    if (this.mode === 'tower') {
      const bellBtn = h('button', { class: 'btn icon', title: 'Nouvelles', 'aria-label': 'Nouvelles', onclick: () => this.openNews() }, sprite('ico-bell'), this.bell);
      bellBtn.style.position = 'relative';
      this.updateBell();
      this.hudTop.replaceChildren(
        this.coinPill(),
        h('div', { class: 'pill clock', onclick: () => this.openCalendar() }, this.clockIcon, this.clockText),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn pause-btn', onclick: () => this.openPause() }, sprite('ico-leaf'), 'Pause'),
        bellBtn,
        this.soundBtn(),
        h('button', { class: 'btn icon', title: 'Réglages', 'aria-label': 'Réglages', onclick: () => this.openSettings() }, sprite('gear')),
      );
      const pending = sim.state.toIdentify.length;
      const exp = sim.state.expedition;
      const missionsLeft = sim.state.missions.filter((m) => m.progress < m.target).length;
      const buttons = [
        this.tool('ico-bag', 'Sac', () => this.openBag()),
        this.tool('book', 'Carnet', () => this.openJournal()),
        this.tool('star', 'Stars', () => this.openStarAlbum(), this.newStars.size || null),
        this.tool('ico-sub', exp ? 'En mer' : 'Sous-marin', () => this.openExpedition(), sim.state.eggs.length || null),
        this.tool('ico-list', 'Objectifs', () => this.openMissions(), missionsLeft || null),
        pending ? this.tool('question', 'Identifier', () => this.openIdentify(), pending, true) : null,
        this.buildHint(),
      ];
      this.hudBottom.replaceChildren(...buttons.filter((b): b is HTMLElement => !!b));
    } else {
      this.hudTop.replaceChildren(
        h('button', { class: 'btn small', onclick: () => this.aquarium()?.back() }, '‹ Tour'),
        this.aquariumTitle(),
        h('div', { class: 'spacer' }),
        this.coinPill(),
      );
      this.renderAquariumBottom();
    }
    this.updateStats();
    this.updateClock();
  }

  private canBuild = false;

  private buildHint(): HTMLElement | null {
    this.canBuild = !!requirementStatus(services.sim.state)?.canBuild;
    return this.canBuild ? this.tool('sparkle', 'Construire', () => this.openBuildPanel(), '!', true) : null;
  }

  /** Affiche ou retire le bouton « Construire » quand les conditions changent. */
  private refreshBuildHint(): void {
    const can = !!requirementStatus(services.sim.state)?.canBuild;
    if (can !== this.canBuild && this.mode === 'tower') this.renderHud();
  }

  private aquariumTitle(): HTMLElement {
    const floor = services.sim.state.floors[this.floor];
    return h('div', { class: 'aqua-title' },
      BIOMES[floor.biome].name,
      h('small', null, MOOD_TEXT[mood(floor)]));
  }

  private renderAquariumBottom(): void {
    const floor = services.sim.state.floors[this.floor];
    const scene = this.aquarium();
    const decorOn = scene?.mode === 'decor';
    this.hudBottom.replaceChildren(
      this.tool('plant', decorOn ? 'Terminé' : 'Décorer', () => {
        const sc = this.aquarium();
        if (!sc) return;
        sc.setMode(sc.mode === 'decor' ? 'view' : 'decor');
        if (sc.mode === 'decor') this.toast('Touche un emplacement pour y poser un objet.');
        this.renderAquariumBottom();
      }, null, decorOn),
      this.tool('thermo', tempLabel(floor.biome, floor.temp), () => {
        const t = ((floor.temp + 1) % 3) as Temp;
        services.sim.setTemp(this.floor, t);
        this.toast(`Eau ${TEMP_NAMES[t].toLowerCase()} : ${tempLabel(floor.biome, t)}`, { icon: 'thermo' });
        this.renderAquariumBottom();
      }),
      this.tool('ico-fish', 'Nourrir', () => {
        const sc = this.aquarium();
        if (sc && !sc.feed()) this.toast('Ils viennent de manger ! Patiente un peu.');
      }),
      this.tool('fishicon', `${floor.fish.length}/${TANK_CAPACITY}`, () => this.openFishPanel(this.floor)),
      this.tool('bubble', 'Zen', () => {
        this.aquarium()?.setZen(true);
        this.setMode('zen', this.floor);
      }),
    );
  }

  refreshAquariumHud(): void {
    if (this.mode !== 'aquarium') return;
    this.hudTop.children[1]?.replaceWith(this.aquariumTitle());
    this.renderAquariumBottom();
  }

  // ==================================================================== toasts

  toast(
    msg: string,
    opts: { icon?: string; img?: string; onClick?: () => void; duration?: number } = {},
  ): void {
    if (this.pause) return; // pendant une pause, rien ne vient déranger
    const key = opts.img ?? opts.icon;
    const el = h('div', { class: 'toast' }, key ? fit(key, 12, 12, 1) : null, msg);
    if (opts.onClick) {
      el.style.pointerEvents = 'auto';
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => {
        el.remove();
        opts.onClick!();
      });
    }
    this.toasts.append(el);
    while (this.toasts.children.length > 2) this.toasts.firstElementChild?.remove();
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 400);
    }, opts.duration ?? 3200);
  }

  showStarQuote(id: StarId): void {
    const star = STARS_BY_ID[id];
    this.toast(`${star.name} : « ${star.quote} »`, { img: starKey(id), duration: 5000 });
  }

  // =================================================================== modales

  get isModalOpen(): boolean {
    return !!this.modal;
  }

  closeModal(): void {
    this.modal?.remove();
    this.modal = null;
  }

  private open(panel: HTMLElement, center = false): void {
    this.closeModal();
    const backdrop = h('div', { class: `backdrop${center ? ' center' : ''}` }, panel);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.closeModal();
    });
    this.modal = backdrop;
    this.root.append(backdrop);
  }

  private head(title: string | Node, onBack?: () => void): HTMLElement {
    return h('div', { class: 'panel-head' },
      onBack ? h('button', { class: 'btn small', onclick: onBack }, '‹') : null,
      title,
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn small', 'aria-label': 'Fermer', onclick: () => this.closeModal() }, '✕'));
  }

  // ------------------------------------------------------------------ bienvenue

  openWelcome(onDone: () => void): void {
    const tips: [string, string][] = [
      ['coin', 'Des visiteurs admirent tes aquariums et laissent des pièces : touche-les pour les ramasser.'],
      ['plant', 'Touche un aquarium pour le décorer. Le bon décor et la bonne température attirent de nouvelles espèces.'],
      ['sparkle', 'Quand les algues poussent, frotte la vitre du doigt. Des poissons heureux rendent les visiteurs généreux.'],
      ['heart', 'Chaque poisson a un prénom et un caractère : caresse-le, nourris-le, et il deviendra ton ami.'],
      ['book', 'Identifie chaque nouveau venu pour remplir ton carnet et débloquer de nouveaux étages.'],
    ];
    const name = h('input', { class: 'name-input', value: services.sim.state.towerName, maxlength: '14', 'aria-label': 'Nom de ta tour' });
    const panel = h('div', { class: 'panel' },
      h('div', { class: 'panel-head' }, 'Bienvenue dans ta tour !'),
      h('div', { class: 'panel-body' },
        h('p', { class: 'muted' }, 'Ici, rien ne presse : aucun poisson ne meurt, jamais. C’est ton petit jardin d’eau.'),
        h('div', { class: 'req' }, h('b', null, 'Nom de ta tour :'), name),
        ...tips.map(([icon, text]) => h('div', { class: 'req' }, sprite(icon), text))),
      h('div', { class: 'panel-foot' },
        h('button', {
          class: 'btn primary',
          onclick: () => {
            services.sim.renameTower(name.value);
            this.closeModal();
            onDone();
          },
        }, 'C’est parti !')),
    );
    this.open(panel, true);
  }

  // ------------------------------------------------------------------- carnet

  openJournal(): void {
    const sim = services.sim;
    const total = SPECIES.length;
    const body = h('div', { class: 'panel-body' });
    const builtBiomes = new Set(sim.state.floors.map((f) => f.biome));
    const pendingBySpecies = new Map<SpeciesId, number>();
    for (const uid of sim.state.toIdentify) {
      const f = findFish(sim.state, uid);
      if (f && !pendingBySpecies.has(f.fish.species)) pendingBySpecies.set(f.fish.species, uid);
    }

    {
      for (const entry of FLOOR_PLAN.filter((e) => !e.comingSoon)) {
        const list = speciesForBiome(entry.biome);
        const found = list.filter((s) => sim.state.journal[s.id]).length;
        body.append(h('div', { class: 'section-title' },
          BIOMES[entry.biome].name, h('span', { class: 'muted' }, `${found}/${list.length}`)));
        if (!builtBiomes.has(entry.biome)) {
          body.append(h('p', { class: 'muted' }, `Construis l’étage ${BIOMES[entry.biome].name} pour découvrir ces espèces.`));
        }
        const grid = h('div', { class: 'grid' });
        for (const s of list) {
          const known = !!sim.state.journal[s.id];
          const pending = pendingBySpecies.get(s.id);
          grid.append(h('div', {
            class: `card${known ? '' : ' locked'}`,
            onclick: () => {
              services.audio.play('click');
              if (known) this.openSpeciesSheet(s.id, () => this.openJournal());
              else if (pending) this.openIdentify(pending);
              else this.openHint(s);
            },
          },
          pending ? h('span', { class: 'tag' }, '?') : null,
          h('div', { class: 'thumb' }, fit(known ? fishKey(s.id) : `${fishKey(s.id)}-sil`, 46, 24, 2)),
          h('div', null, known ? s.name : pending ? 'À identifier' : '???'),
          h('div', { class: 'stars' }, stars(s.rarity))));
        }
        body.append(grid);
      }
    }

    const found = discoveredCount(sim.state);
    const panel = h('div', { class: 'panel' },
      this.head(`Carnet du soigneur · ${found}/${total}`),
      body,
    );
    this.open(panel);
  }

  // ------------------------------------------------------------ fiche d'un poisson

  openFishCard(uid: number): void {
    const sim = services.sim;
    const found = findFish(sim.state, uid);
    if (!found) return;
    const fish = found.fish;
    const sp = SPECIES_BY_ID[fish.species];
    const known = !!sim.state.journal[fish.species];
    const now = sim.now();
    const hs = hearts(fish.friendship);
    const input = h('input', { class: 'name-input', value: fish.name, maxlength: '16', 'aria-label': 'Prénom' });
    const rename = h('button', {
      class: 'btn small',
      onclick: () => {
        sim.renameFish(uid, input.value);
        this.toast(`Il s’appelle désormais ${fish.name} !`, { img: fishTexture(fish) });
        this.openFishCard(uid);
      },
    }, 'Renommer');
    const next = minutesToNextStage(fish, now);
    const variant = fish.variant ? VARIANTS[fish.species] : null;
    let confirm = false;
    const release = h('button', { class: 'btn small' }, 'Relâcher');
    release.addEventListener('click', () => {
      if (!confirm) {
        confirm = true;
        release.textContent = 'Vraiment ?';
        return;
      }
      sim.releaseFish(uid);
      this.toast(`${fish.name} retourne à la nature. Bon voyage !`);
      this.openFishPanel(found.floor);
    });
    const panel = h('div', { class: 'panel' },
      this.head(fish.name, () => this.openFishPanel(found.floor)),
      h('div', { class: 'panel-body' },
        h('div', { class: 'sheet-hero', style: waterBg(sp.biome) },
          fish.stage === 'egg' ? fit('eggs', 140, 46) : fit(fishTexture(fish), 140, 46)),
        h('div', { class: 'req' }, input, rename),
        h('div', { class: 'hearts' }, ...Array.from({ length: 5 }, (_, k) => h('span', { class: k < hs ? 'on' : '' }, '♥')),
          h('span', { class: 'muted' }, hs >= 5 ? ' Meilleurs amis !' : ' Caresse-le et nourris-le pour gagner sa confiance.')),
        h('dl', { class: 'facts' },
          h('dt', null, 'Espèce'), h('dd', null, known ? sp.name : '???'),
          h('dt', null, 'Caractère'), h('dd', null, h('b', null, PERSONALITIES[fish.personality].label), ' — ', PERSONALITIES[fish.personality].text),
          h('dt', null, 'Âge'), h('dd', null, STAGE_NAMES[fish.stage], next ? ` (prochaine étape dans ${next} min)` : ''),
          fish.parents ? h('dt', null, 'Parents') : null, fish.parents ? h('dd', null, fish.parents.join(' et ')) : null,
          variant ? h('dt', null, 'Couleur') : null, variant ? h('dd', null, h('b', null, `Variante rare « ${variant.name} »`), ` — ${variant.note}`) : null),
        h('p', { class: 'center' },
          known ? h('button', { class: 'btn small', onclick: () => this.openSpeciesSheet(fish.species, () => this.openFishCard(uid)) }, 'Fiche de l’espèce') : null,
          ' ', release)),
    );
    this.open(panel);
  }

  // ------------------------------------------------------------------- objectifs

  openMissions(): void {
    const sim = services.sim;
    const body = h('div', { class: 'panel-body' },
      h('p', { class: 'muted' }, 'Pas de chrono, pas de pression : de petites idées pour prendre soin de ta tour.'));
    for (const m of sim.state.missions) {
      body.append(h('div', { class: 'mission' },
        h('div', null, h('b', null, missionText(m))),
        h('div', { class: 'xpbar' }, h('div', { style: `width:${Math.round((m.progress / m.target) * 100)}%` })),
        h('div', { class: 'muted' }, `${m.progress}/${m.target} · récompense ${m.reward} pièces`)));
    }
    this.open(h('div', { class: 'panel' }, this.head('Objectifs du jour'), body));
  }

  // -------------------------------------------------------------------- nouvelles

  openNews(): void {
    this.unread = 0;
    this.updateBell();
    const news = services.sim.state.news;
    const body = h('div', { class: 'panel-body' });
    if (!news.length) body.append(h('p', { class: 'muted' }, 'Rien de neuf pour l’instant. Tout est calme.'));
    for (const n of news) {
      body.append(h('div', { class: 'req news' }, fit(n.icon, 14, 12, 1), h('div', { style: 'flex:1' }, n.text,
        h('div', { class: 'muted' }, timeAgo(n.at)))));
    }
    this.open(h('div', { class: 'panel' }, this.head('Nouvelles de la tour'), body));
  }

  /** Résumé au retour : ce qui s'est passé pendant l'absence. */
  openReturnSummary(since: number, coins: number, arrivals: number): void {
    const news = services.sim.state.news.filter((n) => n.at > since).slice(0, 6);
    const body = h('div', { class: 'panel-body' },
      h('div', { class: 'req' }, sprite('coin'), `+${coins} pièces laissées par les visiteurs`),
      arrivals ? h('div', { class: 'req' }, sprite('fishicon'), `${arrivals} nouveau${arrivals > 1 ? 'x' : ''} pensionnaire${arrivals > 1 ? 's' : ''}`) : null,
      ...news.map((n) => h('div', { class: 'req news' }, fit(n.icon, 14, 12, 1), n.text)));
    this.open(h('div', { class: 'panel' },
      h('div', { class: 'panel-head' }, 'Pendant ton absence…'),
      body,
      h('div', { class: 'panel-foot' },
        h('button', { class: 'btn', onclick: () => this.openPause() }, 'Faire une pause'),
        h('button', { class: 'btn primary', onclick: () => this.closeModal() }, 'Bon retour !'))), true);
  }

  // ------------------------------------------------------------------ sous-marin

  openExpedition(): void {
    const sim = services.sim;
    const s = sim.state;
    const body = h('div', { class: 'panel-body' });
    const exp = s.expedition;
    if (exp) {
      const d = DESTINATIONS_BY_ID[exp.dest];
      const left = Math.max(0, Math.ceil((exp.end - sim.now()) / 60_000));
      body.append(
        h('div', { class: 'sheet-hero', style: waterBg(d.biome) }, fit('sub', 140, 40, 3)),
        h('p', { class: 'center' }, `En route vers : `, h('b', null, d.name)),
        h('p', { class: 'center muted' }, `Retour dans environ ${left} min. Tu peux fermer le jeu, il t’attendra.`));
    } else {
      body.append(h('p', { class: 'muted' }, 'Le petit sous-marin part explorer un milieu naturel et rapporte un œuf… et une carte postale.'));
      for (const d of DESTINATIONS) {
        const open = s.floors.some((f) => f.biome === d.biome);
        body.append(h('div', { class: `dest${open ? '' : ' locked'}` },
          h('div', { style: 'flex:1' }, h('b', null, d.name), h('div', { class: 'muted' }, d.blurb),
            h('div', { class: 'muted' }, open ? `Durée : ${d.minutes} min` : `Nécessite l’étage ${BIOMES[d.biome].name}`)),
          h('button', {
            class: 'btn small primary', disabled: !open,
            onclick: () => {
              if (sim.startExpedition(d.id)) {
                services.audio.play('bubble');
                this.toast(`Le sous-marin plonge vers : ${d.name} !`, { icon: 'ico-sub' });
                this.openExpedition();
              }
            },
          }, 'Partir')));
      }
    }
    if (s.eggs.length) {
      body.append(h('div', { class: 'section-title' }, 'Œufs rapportés'));
      s.eggs.forEach((egg, i) => {
        const sp = SPECIES_BY_ID[egg.species];
        const targets = s.floors.map((f, fi) => ({ f, fi })).filter(({ f }) => f.biome === sp.biome);
        const room = targets.find(({ f }) => f.fish.length < TANK_CAPACITY);
        body.append(h('div', { class: 'req' }, sprite('eggs'),
          h('div', { style: 'flex:1' }, `Œuf de ${BIOMES[sp.biome].name}`, h('div', { class: 'muted' }, 'Quelle espèce ? Surprise à l’éclosion !')),
          h('button', {
            class: 'btn small primary', disabled: !room,
            onclick: () => {
              if (room && sim.placeEgg(i, room.fi)) {
                services.audio.play('place');
                this.toast(`L’œuf est bien au chaud dans l’aquarium ${BIOMES[sp.biome].name}.`, { icon: 'eggs' });
                this.openExpedition();
              }
            },
          }, room ? 'Déposer' : 'Plein')));
      });
    }
    if (s.logbook.length) {
      body.append(h('div', { class: 'section-title' }, 'Carnet de bord'));
      for (const e of s.logbook.slice(0, 8)) {
        body.append(h('div', { class: 'postcard' },
          h('b', null, DESTINATIONS_BY_ID[e.dest].name), h('span', { class: 'muted' }, ` · ${timeAgo(e.at)}`),
          h('p', null, `« ${e.postcard} »`)));
      }
    }
    this.open(h('div', { class: 'panel' }, this.head('Le petit sous-marin'), body));
  }

  // ---------------------------------------------------------------- respiration

  /** Respiration guidée : inspirer 4 s, retenir 4 s, expirer 6 s, cinq fois. */
  openBreathing(): void {
    const circle = h('div', { class: 'breath-circle' });
    const label = h('div', { class: 'breath-label' }, 'Installe-toi confortablement…');
    const overlay = h('div', { class: 'breath' }, circle, label,
      h('button', { class: 'btn small', onclick: () => stop() }, 'Arrêter'));
    this.root.append(overlay);
    const phases: [string, number, number][] = [['Inspire…', 4000, 1], ['Retiens…', 4000, 1], ['Expire…', 6000, 0]];
    let cycle = 0;
    let i = -1;
    let timer = 0;
    const stop = () => {
      clearTimeout(timer);
      overlay.remove();
    };
    const step = () => {
      i++;
      if (i >= phases.length) {
        i = 0;
        cycle++;
      }
      if (cycle >= 5) {
        label.textContent = 'Merci d’avoir pris ce moment. 🌿';
        services.sim.progress('breathe');
        timer = window.setTimeout(stop, 2500);
        return;
      }
      const [text, ms, size] = phases[i];
      label.textContent = text;
      circle.style.transitionDuration = `${ms}ms`;
      circle.style.transform = `scale(${size ? 1 : 0.45})`;
      timer = window.setTimeout(step, ms);
    };
    timer = window.setTimeout(step, 1500);
  }

  // ------------------------------------------------------------------- pause

  private pause: { end: number; minutes: number; floor: number; prevAmbience: Ambience } | null = null;
  private pauseClock = h('span', null, '');
  private pauseTimer = 0;

  /** Choisir sa pause : durée, ambiance sonore, aquarium. */
  openPause(): void {
    const s = services.sim.state;
    let minutes = 5;
    let ambience: Ambience = s.settings.ambience === 'music' ? 'waves' : s.settings.ambience;
    let floor = Math.min(s.settings.favoriteFloor, s.floors.length - 1);
    const choice = <T,>(values: T[], label: (v: T) => string, get: () => T, set: (v: T) => void) => {
      const row = h('div', { class: 'choice-row' });
      const render = () => row.replaceChildren(...values.map((v) =>
        h('button', { class: `tab${get() === v ? ' on' : ''}`, onclick: () => { set(v); render(); } }, label(v))));
      render();
      return row;
    };
    const panel = h('div', { class: 'panel' },
      this.head('Une petite pause'),
      h('div', { class: 'panel-body' },
        h('p', { class: 'muted' }, 'Pose ton téléphone, respire. Aucune notification ne viendra te déranger, un carillon doux t’indiquera la fin.'),
        h('div', { class: 'section-title' }, 'Combien de temps ?'),
        choice([2, 5, 10], (m) => `${m} min`, () => minutes, (v) => (minutes = v)),
        h('div', { class: 'section-title' }, 'Ambiance'),
        choice<Ambience>(['waves', 'rain', 'music', 'silence'], (a) => AMBIENCE_NAMES[a], () => ambience, (v) => {
          ambience = v;
          services.audio.unlock();
          services.audio.setAmbience(v);
        }),
        h('div', { class: 'section-title' }, 'Quel aquarium ?'),
        choice(s.floors.map((_, i) => i), (i) => BIOMES[s.floors[i].biome].name, () => floor, (v) => (floor = v))),
      h('div', { class: 'panel-foot' },
        h('button', { class: 'btn primary', onclick: () => this.startPause(minutes, floor, ambience) }, 'Commencer ma pause')),
    );
    this.open(panel);
  }

  startPause(minutes: number, floor: number, ambience: Ambience): void {
    const s = services.sim.state;
    s.settings.favoriteFloor = floor;
    services.audio.unlock();
    this.pause = { end: Date.now() + minutes * 60_000, minutes, floor, prevAmbience: s.settings.ambience };
    services.audio.setAmbience(ambience);
    this.closeModal();
    const game = services.game;
    if (game.scene.isActive('Aquarium')) {
      game.scene.stop('Aquarium');
      game.scene.wake('Tower');
    }
    (game.scene.getScene('Tower') as unknown as { openAquarium(i: number, zen: boolean): void }).openAquarium(floor, true);
    this.showThought(thoughtOfTheDay());
    clearInterval(this.pauseTimer);
    this.pauseTimer = window.setInterval(() => this.tickPause(), 500);
    this.tickPause();
  }

  private tickPause(): void {
    if (!this.pause) return;
    const left = Math.max(0, this.pause.end - Date.now());
    const sec = Math.ceil(left / 1000);
    this.pauseClock.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
    if (left <= 0) this.endPause(false);
  }

  /** Fin de la pause : carillon, pensée, et retour en douceur. */
  private endPause(early: boolean): void {
    const p = this.pause;
    if (!p) return;
    clearInterval(this.pauseTimer);
    const s = services.sim.state;
    const spent = Math.max(1, Math.round((p.minutes * 60_000 - Math.max(0, p.end - Date.now())) / 60_000));
    s.stats.pauses++;
    s.stats.pauseMinutes += spent;
    services.sim.progress('breathe');
    services.sim.save();
    this.pause = null;
    services.audio.play('chime');
    const close = () => {
      card.remove();
      services.audio.setAmbience(p.prevAmbience);
      this.aquarium()?.setZen(false);
    };
    const card = h('div', { class: 'pause-end' },
      h('div', { class: 'pause-card' },
        h('b', null, early ? 'Pause terminée' : 'Ta pause est terminée'),
        h('p', null, randomThought(thoughtOfTheDay())),
        h('p', { class: 'muted' }, `Tu as pris ${spent} minute${spent > 1 ? 's' : ''} pour toi. ${s.stats.pauses} pause${s.stats.pauses > 1 ? 's' : ''} depuis le début.`),
        h('div', { class: 'choice-row' },
          h('button', { class: 'btn', onclick: () => { card.remove(); this.startPause(2, p.floor, services.audio.currentAmbience); } }, 'Encore 2 min'),
          h('button', { class: 'btn primary', onclick: close }, 'Merci, j’y retourne'))));
    this.root.append(card);
    this.renderHud();
  }

  /** Une pensée qui apparaît quelques secondes, en douceur. */
  private showThought(text: string): void {
    const el = h('div', { class: 'thought-card' }, text);
    this.root.append(el);
    setTimeout(() => el.classList.add('out'), 7000);
    setTimeout(() => el.remove(), 8500);
  }

  // --------------------------------------------------------------- album des stars

  /** Stars venues pour la première fois depuis la dernière ouverture de l'album. */
  private newStars = new Set<StarId>();

  openStarAlbum(): void {
    const sim = services.sim;
    const level = levelProgress(sim.state.xp).level;
    const seen = STARS.filter((s) => sim.state.stars[s.id]).length;
    const grid = h('div', { class: 'grid two' });
    for (const star of STARS) {
      const visits = sim.state.stars[star.id] ?? 0;
      const isNew = this.newStars.has(star.id);
      grid.append(h('div', {
        class: `card star-card${visits ? '' : ' locked'}`,
        style: visits ? `background: linear-gradient(${star.color}, #fff 85%);` : '',
        onclick: () => {
          services.audio.play('click');
          if (visits) this.openStarSheet(star.id);
        },
      },
      isNew ? h('span', { class: 'tag new' }, 'NOUVEAU') : null,
      h('div', { class: 'portrait' }, fit(visits ? starKey(star.id) : `${starKey(star.id)}-sil`, 60, 46, 2)),
      h('b', null, visits ? star.name : '???'),
      visits
        ? h('div', { class: 'muted' }, `${visits} visite${visits > 1 ? 's' : ''} · ${star.nod}`)
        : h('div', { class: 'muted' }, star.hint),
      visits ? null : h('div', { class: 'lock' }, level >= star.level ? 'Peut passer à tout moment…' : `À partir du niveau ${star.level}`)));
    }
    this.newStars.clear();
    this.renderHud();
    const panel = h('div', { class: 'panel' },
      this.head(`Album des stars · ${seen}/${STARS.length}`),
      h('div', { class: 'panel-body' },
        h('p', { class: 'muted' }, 'Des célébrités (presque) connues passent parfois admirer tes aquariums. Repère l’étoile au-dessus de leur tête et touche-les pour un autographe !'),
        grid),
    );
    this.open(panel);
  }

  private openHint(s: Species): void {
    const panel = h('div', { class: 'panel' },
      this.head('Espèce inconnue', () => this.openJournal()),
      h('div', { class: 'panel-body center' },
        h('div', { class: 'sheet-hero', style: waterBg(s.biome) }, fit(`${fishKey(s.id)}-sil`, 140, 46)),
        h('p', null, h('b', null, BIOMES[s.biome].name), ' · ', RARITY_NAMES[s.rarity], ' ', h('span', { class: 'stars' }, stars(s.rarity))),
        h('div', { class: 'fact-box' }, h('b', null, 'Indice : '), s.hint)),
    );
    this.open(panel);
  }

  openSpeciesSheet(id: SpeciesId, onBack?: () => void): void {
    const s = SPECIES_BY_ID[id];
    const entry = services.sim.state.journal[id];
    if (!entry) return;
    const temps = s.temps.length === 3 ? 'toutes' : s.temps.map((t) => `${TEMP_NAMES[t].toLowerCase()} (${tempLabel(s.biome, t)})`).join(', ');
    const likes = s.needs.length ? s.needs.map((t) => TAG_NAMES[t]).join(', ') : 'rien de particulier';
    const panel = h('div', { class: 'panel' },
      this.head(s.name, onBack),
      h('div', { class: 'panel-body' },
        h('div', { class: 'sheet-hero', style: waterBg(s.biome) }, fit(fishKey(s.id), 140, 46)),
        h('p', { class: 'center' }, h('em', { class: 'sci' }, s.scientific)),
        h('dl', { class: 'facts' },
          h('dt', null, 'Biome'), h('dd', null, BIOMES[s.biome].name),
          h('dt', null, 'Rareté'), h('dd', null, RARITY_NAMES[s.rarity], ' ', h('span', { class: 'stars' }, stars(s.rarity))),
          h('dt', null, 'Taille'), h('dd', null, s.size),
          h('dt', null, 'Origine'), h('dd', null, s.origin),
          h('dt', null, 'Signe'), h('dd', null, s.trait),
          h('dt', null, 'Aime'), h('dd', null, likes),
          h('dt', null, 'Eau'), h('dd', null, temps),
          h('dt', null, 'Accueillis'), h('dd', null, String(entry.count))),
        h('div', { class: 'fact-box' }, h('b', null, 'Le savais-tu ? '), s.fact),
        h('p', { class: 'center' },
          h('a', { href: wikiUrl(s), target: '_blank', rel: 'noopener' }, 'En savoir plus sur Wikipédia ↗'))),
    );
    this.open(panel);
  }

  private openStarSheet(id: StarId): void {
    const star = STARS_BY_ID[id];
    const panel = h('div', { class: 'panel' },
      this.head(star.name, () => this.openStarAlbum()),
      h('div', { class: 'panel-body center' },
        h('div', { class: 'sheet-hero', style: `background: linear-gradient(${star.color}, #fff);` }, fit(starKey(id), 140, 46)),
        h('div', { class: 'fact-box' }, `« ${star.quote} »`),
        h('p', { class: 'muted' }, `Clin d’œil à : ${star.nod}`),
        h('p', null, `Visites : ${services.sim.state.stars[id] ?? 0}`)),
    );
    this.open(panel);
  }

  // ------------------------------------------------------------- identification

  openIdentify(uid?: number): void {
    const sim = services.sim;
    const target = uid ?? sim.state.toIdentify[0];
    const found = target !== undefined ? findFish(sim.state, target) : null;
    if (!found) {
      if (target !== undefined) sim.identify(target, 'demoiselle'); // nettoie une entrée orpheline
      return;
    }
    if (!sim.state.toIdentify.includes(found.fish.uid)) {
      this.openSpeciesSheet(found.fish.species);
      return;
    }
    const s = SPECIES_BY_ID[found.fish.species];
    const others = shuffle(speciesForBiome(s.biome).filter((o) => o.id !== s.id), Math.random).slice(0, 2);
    const options = shuffle([s, ...others], Math.random);
    const result = h('div');
    const foot = h('div', { class: 'panel-foot' });
    const buttons = options.map((o) =>
      h('button', {
        class: 'choice',
        onclick: () => {
          buttons.forEach((b) => (b.disabled = true));
          const res = sim.identify(found.fish.uid, o.id);
          if (!res) return;
          buttons.forEach((b, i) => {
            if (options[i].id === s.id) b.classList.add('right');
            else if (options[i].id === o.id) b.classList.add('wrong');
          });
          if (res.correct) {
            services.audio.play('coin');
            result.replaceChildren(h('p', { class: 'center' }, h('b', null, 'Bravo, bien observé !'),
              res.reward ? ` +${res.reward} pièces` : ''));
          } else {
            services.audio.play('bubble');
            result.replaceChildren(h('p', { class: 'center' }, 'Presque ! C’est un·e ', h('b', null, s.name),
              ` : ${s.trait.toLowerCase()}.`));
          }
          const more = sim.state.toIdentify.length;
          foot.replaceChildren(
            h('button', { class: 'btn', onclick: () => this.openSpeciesSheet(s.id) }, 'Voir la fiche'),
            more
              ? h('button', { class: 'btn primary', onclick: () => this.openIdentify() }, `Suivant (${more})`)
              : h('button', { class: 'btn primary', onclick: () => this.closeModal() }, 'Continuer'),
          );
        },
      }, h('b', null, o.name), h('span', null, o.trait)),
    );
    const panel = h('div', { class: 'panel' },
      this.head('Nouveau pensionnaire !'),
      h('div', { class: 'panel-body' },
        h('div', { class: 'sheet-hero', style: waterBg(s.biome) }, fit(fishKey(s.id), 140, 46)),
        h('p', { class: 'center' }, 'Observe-le bien : de quelle espèce s’agit-il ?'),
        h('div', { class: 'choices' }, ...buttons),
        result),
      foot,
    );
    this.open(panel, true);
  }

  // ------------------------------------------------------------------- décor

  openDecorPanel(floorIndex: number, slot: number, selected?: DecorId): void {
    const sim = services.sim;
    const floor = sim.state.floors[floorIndex];
    const current = floor.slots[slot];
    const items = decorForBiome(floor.biome);
    const body = h('div', { class: 'panel-body' });
    if (current) {
      body.append(h('div', { class: 'req' },
        sprite(decorKey(current), 1.5),
        h('div', { style: 'flex:1' }, h('b', null, DECOR[current].name), h('div', { class: 'muted' }, 'Posé ici')),
        h('button', {
          class: 'btn small',
          onclick: () => {
            sim.removeDecor(floorIndex, slot);
            services.audio.play('click');
            this.openDecorPanel(floorIndex, slot);
          },
        }, 'Ranger')));
    }
    const grid = h('div', { class: 'grid' });
    for (const it of items) {
      const owned = sim.state.inventory[it.id] ?? 0;
      grid.append(h('div', {
        class: `card${selected === it.id ? ' selected' : ''}`,
        onclick: () => {
          services.audio.play('click');
          this.openDecorPanel(floorIndex, slot, it.id);
        },
      },
      owned ? h('span', { class: 'tag' }, `×${owned}`) : null,
      h('div', { class: 'thumb' }, fit(decorKey(it.id), 46, 24, 2)),
      h('div', null, it.name),
      owned ? h('div', { class: 'muted' }, 'En stock') : h('div', { class: 'price' }, sprite('coin'), it.price)));
    }
    body.append(grid);

    const foot = h('div', { class: 'panel-foot', style: 'flex-direction: column; align-items: stretch;' });
    if (selected) {
      const it = DECOR[selected];
      const owned = sim.state.inventory[selected] ?? 0;
      const affordable = owned > 0 || sim.state.coins >= it.price;
      foot.append(
        h('div', null, h('b', null, it.name), ' — ', it.blurb),
        h('button', {
          class: 'btn primary',
          disabled: !affordable,
          onclick: () => {
            if (sim.placeDecor(floorIndex, slot, selected)) {
              services.audio.play('place');
              this.closeModal();
            }
          },
        }, owned ? 'Poser' : affordable ? `Acheter et poser · ${it.price} pièces` : `Il manque ${it.price - sim.state.coins} pièces`),
      );
    } else {
      foot.append(h('div', { class: 'muted center' }, 'Choisis un objet. Certaines espèces ne viennent qu’avec le bon décor !'));
    }
    const panel = h('div', { class: 'panel' },
      this.head(`Décorer · emplacement ${slot + 1}`),
      body,
      foot,
    );
    this.open(panel);
  }

  // ---------------------------------------------------------------- pensionnaires

  openFishPanel(floorIndex: number): void {
    const sim = services.sim;
    const floor = sim.state.floors[floorIndex];
    const body = h('div', { class: 'panel-body' });
    body.append(
      h('p', null, MOOD_TEXT[mood(floor)]),
      h('p', { class: 'muted' },
        `Propreté de la vitre : ${Math.round(cleanliness(floor) * 100)} % · Bonheur : ${Math.round(happiness(floor) * 100)} %`),
    );
    if (floor.fish.length === 0) body.append(h('p', { class: 'muted' }, 'Aucun pensionnaire pour l’instant… Patience, ils arrivent !'));
    for (const fish of floor.fish) {
      const sp = SPECIES_BY_ID[fish.species];
      const pending = sim.state.toIdentify.includes(fish.uid);
      const known = !!sim.state.journal[fish.species];
      const hs = hearts(fish.friendship);
      body.append(h('div', { class: 'req fish-row', onclick: () => (pending ? this.openIdentify(fish.uid) : this.openFishCard(fish.uid)) },
        h('div', { class: 'fish-thumb' }, fish.stage === 'egg' ? sprite('eggs') : fit(fishTexture(fish), 24, 14, 2)),
        h('div', { style: 'flex:1' },
          h('b', null, fish.name), fish.variant ? h('span', { class: 'tag-inline' }, 'rare') : null,
          h('div', { class: 'muted' }, `${known ? sp.name : 'Espèce inconnue'} · ${STAGE_NAMES[fish.stage]}`)),
        h('div', { class: 'hearts small' }, ...Array.from({ length: 5 }, (_, k) => h('span', { class: k < hs ? 'on' : '' }, '♥'))),
        pending ? h('span', { class: 'tag-inline' }, '?') : null));
    }
    body.append(h('p', { class: 'muted' }, 'Touche un poisson dans l’aquarium pour lui faire un câlin, deux fois pour ouvrir sa fiche.'));
    // Qui pourrait venir ?
    const eligible = eligibleSpecies(floor);
    const known = eligible.filter((s) => sim.state.journal[s.id]);
    const mystery = eligible.length - known.length;
    body.append(h('div', { class: 'section-title' }, 'Qui pourrait venir ?'));
    if (floor.fish.length >= TANK_CAPACITY) {
      body.append(h('p', { class: 'muted' }, 'L’aquarium est plein. Relâche un poisson pour faire de la place.'));
    } else if (eligible.length === 0) {
      body.append(h('p', { class: 'muted' }, 'Personne ne se sent attiré… Essaie un autre décor ou une autre température.'));
    } else {
      body.append(h('p', null,
        known.map((s) => s.name).join(', ') || '',
        mystery ? `${known.length ? ' et ' : ''}${mystery} espèce${mystery > 1 ? 's' : ''} mystère !` : ''));
    }
    const undiscovered = speciesForBiome(floor.biome).filter((s) => !sim.state.journal[s.id]).length;
    if (undiscovered) {
      body.append(h('p', { class: 'muted' },
        `Il reste ${undiscovered} espèce${undiscovered > 1 ? 's' : ''} à découvrir ici. Consulte leurs indices dans le carnet !`));
    }
    const panel = h('div', { class: 'panel' },
      this.head(`Pensionnaires ${floor.fish.length}/${TANK_CAPACITY}`),
      body,
    );
    this.open(panel);
  }

  // --------------------------------------------------------------- construction

  openBuildPanel(): void {
    const sim = services.sim;
    const status = requirementStatus(sim.state);
    if (!status) return;
    const biome = BIOMES[status.entry.biome];
    const lp = levelProgress(sim.state.xp);
    const body = h('div', { class: 'panel-body' });
    const foot = h('div', { class: 'panel-foot' });
    if (status.entry.comingSoon) {
      body.append(
        h('p', null, biome.description),
        h('p', { class: 'muted' }, 'Ce biome arrivera dans une prochaine mise à jour, avec les expéditions en sous-marin et la reproduction. En attendant, complète ton carnet !'),
      );
      foot.append(h('button', { class: 'btn', onclick: () => this.closeModal() }, 'D’accord'));
    } else {
      const req = status.entry.req;
      const line = (ok: boolean, text: string) =>
        h('div', { class: 'req' }, h('span', { class: ok ? 'ok' : 'ko' }, ok ? '✔' : '✘'), text);
      body.append(
        h('p', null, biome.description),
        line(status.levelOk, `Tour niveau ${req.level} (actuel : ${lp.level})`),
        line(status.speciesOk, `${req.species} espèces identifiées (actuel : ${discoveredCount(sim.state)})`),
        line(status.coinsOk, `${req.coins} pièces (tu en as ${sim.state.coins})`),
      );
      if (!status.levelOk) {
        body.append(h('p', { class: 'muted' }, 'Chaque visiteur fait grimper le niveau de la tour.'));
      }
      foot.append(h('button', {
        class: 'btn primary',
        disabled: !status.canBuild,
        onclick: () => {
          if (sim.buildFloor()) this.closeModal();
        },
      }, 'Construire'));
    }
    const panel = h('div', { class: 'panel' },
      this.head(status.entry.comingSoon ? `Bientôt : ${biome.name}` : `Nouvel étage : ${biome.name}`),
      body,
      foot,
    );
    this.open(panel, true);
  }

  // =============================================================== la journée

  private heartsRow(n: number): HTMLElement {
    return h('span', { class: 'hearts' }, '♥'.repeat(n), h('span', { class: 'off' }, '♥'.repeat(5 - n)));
  }

  /** Calendrier : saison, jour, heure et niveau de la tour. */
  openCalendar(): void {
    const s = services.sim.state;
    const cal = farm.calendar(s.day.n);
    const lp = levelProgress(s.xp);
    const body = h('div', { class: 'panel-body' },
      h('p', null, h('b', null, `${cal.season}, jour ${cal.dayOfSeason}`), ` · année ${cal.year} · ${farm.clockText(s.day.minute)}`),
      h('p', { class: 'muted' }, 'Une journée dure environ 13 minutes de jeu. Rien ne presse : le temps ne passe que quand tu joues, et la journée se termine quand tu vas dormir au comptoir de l’accueil.'),
      h('div', { class: 'section-title' }, `Tour niveau ${lp.level}`),
      h('div', { class: 'xpbar' }, h('div', { style: `width:${Math.round(lp.ratio * 100)}%` })),
      h('p', { class: 'muted' }, 'Chaque visiteur fait grimper le niveau de la tour.'));
    this.open(h('div', { class: 'panel' }, this.head('Calendrier'), body), true);
  }

  /** Présentation de la vie de soigneur (une seule fois). */
  openFarmIntro(): void {
    const line = (icon: string, text: string) => h('div', { class: 'req' }, fit(icon, 14, 14, 2), h('div', null, text));
    const body = h('div', { class: 'panel-body' },
      h('p', null, 'Tu es le soigneur de la tour. Touche un endroit : tu y vas à pied, et tu prends l’ascenseur-bulle tout seul.'),
      line('ico-sprout', 'Au pied des aquariums, des bacs de culture : plante une bouture, soigne-la une fois par jour, récolte-la.'),
      line('shipbin', 'Dans le hall, le coffre d’expédition : ce que tu y déposes est vendu pendant la nuit.'),
      line('villager-lila', 'Des habitués passent chaque jour. Bavarde avec eux, offre-leur ce qu’ils aiment : ils t’écriront.'),
      line('ico-letter', 'Le vieux Grand Bassin du hall attend d’être restauré, lot par lot.'),
      line('ico-moon', 'Quand tu veux finir la journée, va dormir au comptoir de l’accueil.'));
    this.open(h('div', { class: 'panel' },
      h('div', { class: 'panel-head' }, 'Une nouvelle vie à la tour'),
      body,
      h('div', { class: 'panel-foot' }, h('button', { class: 'btn primary', onclick: () => {
        services.sim.state.settings.farmIntro = true;
        this.closeModal();
      } }, 'C’est parti !'))), true);
  }

  /** Boîte de dialogue façon Stardew avec un habitué. */
  openDialogue(id: VillagerId): void {
    const sim = services.sim;
    const v = VILLAGERS[id];
    const before = farm.villagerHearts(sim.state, id);
    const { line, gained } = sim.farm((st) => farm.talk(st, id));
    if (gained) services.audio.play('bubble');
    const after = farm.villagerHearts(sim.state, id);
    if (after > before) this.toast(`${v.name} t’apprécie de plus en plus (${after} ♥)`, { icon: 'ico-heart' });
    this.showDialogue(id, line);
  }

  private showDialogue(id: VillagerId, text: string): void {
    const sim = services.sim;
    const v = VILLAGERS[id];
    const vs = sim.state.villagers[id];
    const textEl = h('div', { class: 'dlg-text' });
    // texte qui s'écrit lettre après lettre
    let i = 0;
    const timer = setInterval(() => {
      i += 2;
      textEl.textContent = text.slice(0, i);
      if (i >= text.length) clearInterval(timer);
    }, 30);
    const hasItems = Object.values(sim.state.items).some((n) => (n ?? 0) > 0);
    const foot = h('div', { class: 'dlg-actions' },
      !vs.giftedToday && hasItems ? h('button', { class: 'btn', onclick: () => { clearInterval(timer); this.openGift(id); } }, sprite('ico-heart'), 'Offrir') : null,
      h('button', { class: 'btn primary', onclick: () => { clearInterval(timer); this.closeModal(); } }, 'À plus tard'));
    const panel = h('div', { class: 'panel dialogue' },
      h('div', { class: 'dlg-row' },
        h('div', { class: 'dlg-portrait' }, sprite(villagerKey(id), 3)),
        h('div', { class: 'dlg-main' },
          h('div', { class: 'dlg-name' }, h('b', null, v.name), ' ', this.heartsRow(farm.villagerHearts(sim.state, id))),
          h('div', { class: 'muted' }, v.role),
          textEl)),
      foot);
    textEl.addEventListener('click', () => { i = text.length; textEl.textContent = text; });
    this.open(panel);
    this.modal?.classList.add('bottom');
  }

  private openGift(id: VillagerId): void {
    const sim = services.sim;
    const v = VILLAGERS[id];
    const body = h('div', { class: 'panel-body' }, h('p', { class: 'muted' }, `Que veux-tu offrir à ${v.name} ? Un cadeau par jour.`));
    const grid = h('div', { class: 'grid' });
    for (const [c, n] of Object.entries(sim.state.items)) {
      if (!n) continue;
      const crop = CROPS[c as CropId];
      grid.append(h('button', { class: 'card', onclick: () => {
        const before = farm.villagerHearts(sim.state, id);
        const r = sim.farm((st) => farm.giveGift(st, id, crop.id));
        if (!r) return;
        services.audio.play(r.taste === 'love' ? 'levelUp' : 'coin');
        const after = farm.villagerHearts(sim.state, id);
        if (after > before) this.toast(`${v.name} t’apprécie de plus en plus (${after} ♥)`, { icon: 'ico-heart' });
        this.showDialogue(id, r.reply);
      } }, fit(cropKey(crop.id), 24, 24, 2), h('div', null, crop.name), h('div', { class: 'muted' }, `×${n}`)));
    }
    body.append(grid);
    this.open(h('div', { class: 'panel' }, this.head(`Cadeau pour ${v.name}`, () => this.showDialogue(id, farm.dailyLine(sim.state, id))), body));
  }

  /** Bac vide : choisir une bouture à planter. */
  openPlant(floor: number, index: number): void {
    const sim = services.sim;
    const biome = sim.state.floors[floor].biome;
    const body = h('div', { class: 'panel-body' },
      h('p', { class: 'muted' }, 'Plante une bouture, puis soigne-la une fois par jour : elle grandit chaque nuit. Rien ne fane jamais.'));
    for (const crop of farm.cropsForBiome(biome)) {
      const owned = sim.state.seeds[crop.id] ?? 0;
      const canBuy = sim.state.coins >= crop.seedPrice;
      body.append(h('div', { class: 'dest' },
        fit(cropKey(crop.id), 24, 24, 2),
        h('div', { style: 'flex:1' },
          h('b', null, crop.name), crop.regrow ? h('span', { class: 'tag-inline' }, 'repousse') : null,
          h('div', { class: 'muted' }, `${crop.days} nuits · se vend ${crop.sellPrice} p.`),
          owned ? h('div', { class: 'muted' }, `Boutures dans le sac : ${owned}`) : null),
        h('button', {
          class: 'btn primary', disabled: !owned && !canBuy,
          onclick: () => {
            const r = sim.farm((st) => farm.plant(st, floor, index, crop.id));
            if (r !== 'ok') return;
            services.audio.play('place');
            this.closeModal();
            this.toast(`${crop.name} planté${crop.id === 'riccia' || crop.id === 'cabomba' || crop.id === 'mousse' ? 'e' : ''} ! Déjà soigné pour aujourd’hui.`, { img: cropKey(crop.id, 0) });
          },
        }, owned ? 'Planter' : `${crop.seedPrice} p.`)));
    }
    this.open(h('div', { class: 'panel' }, this.head('Bac de culture'), body));
  }

  /** Le sac : boutures et récoltes. */
  openBag(): void {
    const s = services.sim.state;
    const body = h('div', { class: 'panel-body' });
    const section = (title: string, list: Partial<Record<CropId, number>>, stage: 0 | 2) => {
      const entries = Object.entries(list).filter(([, n]) => n);
      body.append(h('div', { class: 'section-title' }, title));
      if (!entries.length) {
        body.append(h('p', { class: 'muted' }, stage ? 'Rien pour l’instant. Récolte tes bacs !' : 'Aucune. La pépinière du comptoir en vend.'));
        return;
      }
      const grid = h('div', { class: 'grid' });
      for (const [c, n] of entries) {
        const crop = CROPS[c as CropId];
        grid.append(h('button', { class: 'card', onclick: () => this.toast(crop.fact, { img: cropKey(crop.id), duration: 7000 }) },
          fit(cropKey(crop.id, stage), 24, 24, 2), h('div', null, crop.name), h('div', { class: 'muted' }, `×${n}`)));
      }
      body.append(grid);
    };
    section('Récoltes', s.items, 2);
    section('Boutures', s.seeds, 0);
    body.append(h('p', { class: 'muted' }, 'Touche un objet pour lire son anecdote. Dépose tes récoltes dans le coffre du hall pour les vendre, ou offre-les aux habitués.'));
    this.open(h('div', { class: 'panel' }, this.head('Mon sac'), body));
  }

  /** Coffre d'expédition : vendu pendant la nuit. */
  openShipBin(): void {
    const sim = services.sim;
    const s = sim.state;
    const body = h('div', { class: 'panel-body' },
      h('p', { class: 'muted' }, 'Ce que tu déposes ici est vendu pendant la nuit. Tu peux le reprendre jusque-là.'));
    const items = Object.entries(s.items).filter(([, n]) => n);
    body.append(h('div', { class: 'section-title' }, 'Dans le sac'));
    if (!items.length) body.append(h('p', { class: 'muted' }, 'Rien à expédier. Récolte tes bacs !'));
    for (const [c, n] of items) {
      const crop = CROPS[c as CropId];
      body.append(h('div', { class: 'req' }, fit(cropKey(crop.id), 16, 16, 1), h('div', { style: 'flex:1' }, `${crop.name} ×${n}`, h('div', { class: 'muted' }, `${crop.sellPrice} p. pièce`)),
        h('button', { class: 'btn small', onclick: () => { sim.farm((st) => farm.ship(st, crop.id, 1)); services.audio.play('place'); this.openShipBin(); } }, '+1'),
        h('button', { class: 'btn small', onclick: () => { sim.farm((st) => farm.ship(st, crop.id, n!)); services.audio.play('place'); this.openShipBin(); } }, 'Tout')));
    }
    const bin = Object.entries(s.shipBin).filter(([, n]) => n);
    if (bin.length) {
      body.append(h('div', { class: 'section-title' }, 'Dans le coffre'));
      for (const [c, n] of bin) {
        const crop = CROPS[c as CropId];
        body.append(h('div', { class: 'req' }, fit(cropKey(crop.id), 16, 16, 1), h('div', { style: 'flex:1' }, `${crop.name} ×${n}`),
          h('button', { class: 'btn small', onclick: () => { sim.farm((st) => farm.unship(st, crop.id)); this.openShipBin(); } }, 'Reprendre')));
      }
    }
    body.append(h('div', { class: 'req' }, sprite('coin'), h('b', null, `Cette nuit : ${farm.binValue(s)} pièces`)));
    this.open(h('div', { class: 'panel' }, this.head('Coffre d’expédition'), body));
  }

  /** Comptoir de l'accueil : pépinière, sac et dodo. */
  openDesk(): void {
    const s = services.sim.state;
    const hour = farm.gameHour(s);
    const greet = hour < 11 ? 'Bonjour ! Belle journée pour les poissons.' : hour < 18 ? 'Bon après-midi ! Tout roule à la tour.' : hour < 24 && hour >= 18 ? 'Bonsoir ! Les lumières des aquariums sont jolies, à cette heure-ci.' : 'Il est tard… Tu devrais aller te coucher, non ?';
    const body = h('div', { class: 'panel-body' },
      h('div', { class: 'req' }, fit('visitor-5', 20, 26, 2), h('div', null, h('b', null, 'Josette, à l’accueil'), h('div', null, `« ${greet} »`))),
      h('div', { class: 'choices' },
        h('button', { class: 'choice', onclick: () => this.openNursery() }, fit('ico-sprout', 12, 12, 2), ' Pépinière (boutures)'),
        h('button', { class: 'choice', onclick: () => this.openBag() }, fit('ico-bag', 12, 12, 2), ' Mon sac'),
        h('button', { class: 'choice', onclick: () => this.openMail() }, fit('ico-letter', 12, 12, 2), ' Courrier'),
        h('button', { class: 'choice', onclick: () => this.goToSleep() }, fit('ico-moon', 12, 12, 2), ` Aller dormir (il est ${farm.clockText(s.day.minute)})`)));
    this.open(h('div', { class: 'panel' }, this.head('Comptoir d’accueil'), body));
  }

  openNursery(): void {
    const sim = services.sim;
    const biomes = new Set(sim.state.floors.map((f) => f.biome));
    const body = h('div', { class: 'panel-body' },
      h('p', { class: 'muted' }, 'De vraies boutures de coraux et de plantes, pour les bacs de tes étages.'));
    for (const crop of CROP_LIST.filter((c) => biomes.has(c.biome))) {
      const owned = sim.state.seeds[crop.id] ?? 0;
      body.append(h('div', { class: 'dest' },
        fit(cropKey(crop.id), 24, 24, 2),
        h('div', { style: 'flex:1' },
          h('b', null, crop.name), crop.regrow ? h('span', { class: 'tag-inline' }, 'repousse') : null,
          h('div', { class: 'muted' }, `${BIOMES[crop.biome].name} · ${crop.days} nuits · se vend ${crop.sellPrice} p.`),
          owned ? h('div', { class: 'muted' }, `Dans le sac : ${owned}`) : null),
        h('button', {
          class: 'btn primary', disabled: sim.state.coins < crop.seedPrice,
          onclick: () => {
            if (sim.farm((st) => farm.buySeeds(st, crop.id))) {
              services.audio.play('coin');
              this.openNursery();
            }
          },
        }, `${crop.seedPrice} p.`)));
    }
    const locked = CROP_LIST.filter((c) => !biomes.has(c.biome)).length;
    if (locked) body.append(h('p', { class: 'muted' }, `${locked} autres boutures arriveront avec de nouveaux étages.`));
    this.open(h('div', { class: 'panel' }, this.head('Pépinière', () => this.openDesk()), body));
  }

  openMail(): void {
    const sim = services.sim;
    const mail = sim.state.mail;
    const body = h('div', { class: 'panel-body' });
    if (!mail.length) body.append(h('p', { class: 'muted' }, 'La boîte est vide. Les habitués écrivent quand ils t’apprécient.'));
    mail.forEach((m, i) => {
      const v = VILLAGERS[m.from];
      body.append(h('button', { class: 'choice', onclick: () => this.openLetter(i) },
        fit(villagerKey(m.from), 14, 18, 1), ` ${m.read ? '' : '✉ '}Lettre de ${v.name}`, h('span', { class: 'muted' }, ` · jour ${m.day}`)));
    });
    this.open(h('div', { class: 'panel' }, this.head('Courrier'), body));
  }

  private openLetter(index: number): void {
    const sim = services.sim;
    const m = sim.state.mail[index];
    const letter = VILLAGERS[m.from].letters[m.hearts];
    const gift = sim.farm((st) => farm.readLetter(st, index));
    if (gift) services.audio.play('levelUp');
    const body = h('div', { class: 'panel-body' },
      h('div', { class: 'postcard letter' }, letter.text),
      gift?.seeds ? h('div', { class: 'req' }, fit(cropKey(gift.seeds, 0), 16, 16, 1), `Joint à la lettre : 1 bouture de ${CROPS[gift.seeds].name}`) : null,
      gift?.coins ? h('div', { class: 'req' }, sprite('coin'), `Joint à la lettre : ${gift.coins} pièces`) : null);
    this.open(h('div', { class: 'panel' }, this.head(`Lettre de ${VILLAGERS[m.from].name}`, () => this.openMail()), body));
  }

  /** Le Grand Bassin et ses lots. */
  openBundles(): void {
    const sim = services.sim;
    const s = sim.state;
    const done = farm.bundlesDone(s);
    const body = h('div', { class: 'panel-body' },
      h('p', null, done >= 3
        ? 'Le Grand Bassin brille à nouveau. Les habitués disent que c’est le plus bel aquarium de la ville.'
        : 'Ce vieil aquarium public dort derrière ses planches. Chaque lot rendu le fait revivre un peu.'));
    for (const b of BUNDLES) {
      const prog = farm.bundleProgress(s, b.id);
      const finished = !!s.bundles[b.id]?.done;
      const card = h('div', { class: 'mission' },
        h('div', null, h('b', null, b.name), finished ? h('span', { class: 'tag-inline' }, 'restauré') : null),
        h('div', { class: 'muted' }, b.blurb));
      for (const p of prog) {
        const r = p.req;
        const label = r.kind === 'item' ? `${CROPS[r.crop].name}` : r.kind === 'counter' ? r.label : `Habitués à ${r.hearts} ♥`;
        const give = r.kind === 'item' && !p.done && (s.items[r.crop] ?? 0) > 0
          ? h('button', { class: 'btn small', onclick: () => {
            if (sim.farm((st) => farm.giveToBundle(st, b.id, r.crop))) services.audio.play('place');
            this.openBundles();
          } }, 'Déposer')
          : null;
        card.append(h('div', { class: 'req' },
          r.kind === 'item' ? fit(cropKey(r.crop), 14, 14, 1) : null,
          h('span', { class: p.done ? 'ok' : 'ko' }, p.done ? '✔' : '·'),
          h('div', { style: 'flex:1' }, `${label} ${p.have}/${p.need}`), give));
      }
      card.append(h('div', { class: 'muted' }, `Récompense : ${b.rewardText}`));
      if (farm.bundleReady(s, b.id)) {
        card.append(h('button', { class: 'btn primary', onclick: () => {
          if (!sim.farm((st) => farm.completeBundle(st, b.id))) return;
          services.audio.play('levelUp');
          sim.addNews(`Le Grand Bassin revit un peu plus : ${b.name} terminé !`, 'sparkle');
          this.toast(`${b.name} terminé ! ${b.rewardText}.`, { icon: 'sparkle', duration: 6000 });
          this.openBundles();
        } }, 'Terminer le lot'));
      }
      body.append(card);
    }
    this.open(h('div', { class: 'panel' }, this.head(`Grand Bassin ${done}/3`), body));
  }

  /** Fin de journée : fondu, bilan, puis nouveau matin. */
  goToSleep(): void {
    this.closeModal();
    const fade = h('div', { class: 'night-fade' });
    this.root.append(fade);
    services.audio.play('chime');
    setTimeout(() => {
      const recap = services.sim.sleep();
      this.openRecap(recap, () => {
        fade.classList.add('out');
        setTimeout(() => fade.remove(), 900);
      });
    }, 900);
  }

  private openRecap(r: farm.DayRecap, onClose: () => void): void {
    const s = services.sim.state;
    const cal = farm.calendar(s.day.n);
    const line = (icon: string, text: string) => h('div', { class: 'req' }, fit(icon, 14, 14, 1), h('div', null, text));
    const body = h('div', { class: 'panel-body' });
    if (r.shipped.length) {
      for (const it of r.shipped) body.append(line(cropKey(it.crop), `${CROPS[it.crop].name} ×${it.qty} … ${it.coins} p.`));
      body.append(line('coin', `Expédition : ${r.shipTotal} pièces`));
    } else {
      body.append(h('p', { class: 'muted' }, 'Rien dans le coffre ce soir. Ce n’est pas grave !'));
    }
    body.append(...[
      line('coin', `Pièces gagnées dans la journée : ${r.dayCoins}`),
      line('fishicon', `Visiteurs accueillis : ${r.visitors}`),
      r.tended ? line('ico-drop', `Boutures soignées : ${r.tended}`) : null,
      r.grown ? line('ico-sprout', `${r.grown} bouture${r.grown > 1 ? 's ont' : ' a'} grandi cette nuit${r.ready ? `, ${r.ready} prête${r.ready > 1 ? 's' : ''} à récolter` : ''}`) : null,
      ...r.letters.map((id) => line('ico-letter', `${VILLAGERS[id].name} t’a écrit une lettre !`)),
    ].filter((x): x is HTMLDivElement => !!x));
    const panel = h('div', { class: 'panel recap' },
      h('div', { class: 'panel-head' }, `Fin du jour ${r.day}`),
      body,
      h('div', { class: 'panel-foot' }, h('button', { class: 'btn primary', onclick: () => {
        this.closeModal();
        onClose();
        services.audio.play('bubble');
        this.toast(`${cal.season}, jour ${cal.dayOfSeason}. Bonjour !`, { icon: 'star', duration: 4000 });
        if (r.letters.length) this.toast('Du courrier t’attend dans la boîte aux lettres du hall.', { icon: 'ico-letter', duration: 6000, onClick: () => this.openMail() });
      } }, 'Bonne nuit')));
    this.open(panel, true);
  }

  // -------------------------------------------------------------------- réglages

  openSettings(): void {
    const sim = services.sim;
    let confirmReset = 0;
    const reset = h('button', { class: 'btn small' }, 'Recommencer à zéro');
    reset.addEventListener('click', () => {
      confirmReset++;
      if (confirmReset === 1) reset.textContent = 'Vraiment ? Tout sera effacé';
      else {
        clearSave();
        window.removeEventListener('beforeunload', saveOnUnload);
        location.reload();
      }
    });
    const st = sim.state.stats;
    const panel = h('div', { class: 'panel' },
      this.head('Réglages'),
      h('div', { class: 'panel-body' },
        h('div', { class: 'section-title' }, 'Statistiques'),
        h('p', null, `Visiteurs accueillis : ${st.visitors}`),
        h('p', null, `Pièces gagnées : ${st.coinsEarned}`),
        h('p', null, `Espèces identifiées : ${discoveredCount(sim.state)}/${SPECIES.length}`),
        h('div', { class: 'section-title' }, 'Ambiance sonore'),
        (() => {
          const row = h('div', { class: 'choice-row' });
          const render = () => row.replaceChildren(...(['music', 'waves', 'rain', 'silence'] as Ambience[]).map((a) =>
            h('button', {
              class: `tab${sim.state.settings.ambience === a ? ' on' : ''}`,
              onclick: () => {
                sim.state.settings.ambience = a;
                services.audio.unlock();
                services.audio.setAmbience(a);
                render();
              },
            }, AMBIENCE_NAMES[a])));
          render();
          return row;
        })(),
        h('div', { class: 'section-title' }, 'Ta tour'),
        (() => {
          const input = h('input', { class: 'name-input', value: sim.state.towerName, maxlength: '14' });
          return h('div', { class: 'req' }, input, h('button', {
            class: 'btn small',
            onclick: () => {
              sim.renameTower(input.value);
              this.toast(`Ta tour s’appelle désormais « ${sim.state.towerName} ».`);
            },
          }, 'Renommer'));
        })(),
        h('div', { class: 'section-title' }, 'Sauvegarde'),
        h('p', { class: 'muted' }, 'La partie est sauvegardée automatiquement dans ce navigateur.'),
        reset,
        h('div', { class: 'section-title' }, 'À propos'),
        h('p', { class: 'muted' }, 'Aquachill — un jeu tout doux inspiré de Tiny Tower. Pixel art et musique générés par le code.')),
    );
    this.open(panel);
  }
}

/** Sauvegarde à la fermeture de l'onglet (retirée lors d'une remise à zéro). */
export function saveOnUnload(): void {
  services.sim.save();
}
