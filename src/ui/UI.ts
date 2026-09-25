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
import { decorKey, fishKey, starKey } from '../sprites';
import { spriteCanvasSize, spriteUrl } from '../sprites/SpriteFactory';
import { discoveredCount, findFish } from '../state/GameState';
import { clearSave } from '../state/SaveManager';
import { cleanliness } from '../systems/algae';
import { eligibleSpecies } from '../systems/attraction';
import { happiness, mood, MOOD_TEXT } from '../systems/happiness';
import { levelProgress, requirementStatus } from '../systems/progression';
import { shuffle } from '../systems/rng';
import { h, pxImg } from './dom';

type Mode = 'tower' | 'aquarium';

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
        services.audio.play('bubble');
        this.toast(`${s.name} a rejoint l’aquarium ${where} !`, { img: fishKey(s.id) });
      }
      if (this.mode === 'aquarium') this.refreshAquariumHud();
    });
    sim.events.on('starArrived', (v) => {
      if (this.mode !== 'tower') return;
      services.audio.play('star');
      const star = STARS_BY_ID[v.star!];
      this.toast(`${star.name} visite la tour ! Touche-le pour un autographe.`, { img: starKey(star.id), duration: 5000 });
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

  renderHud(): void {
    const sim = services.sim;
    if (this.mode === 'tower') {
      this.hudTop.replaceChildren(
        this.coinPill(),
        h('div', { class: 'level' }, this.levelText, h('div', { class: 'xpbar' }, this.xpFill)),
        h('div', { class: 'spacer' }),
        this.soundBtn(),
        h('button', { class: 'btn icon', title: 'Réglages', 'aria-label': 'Réglages', onclick: () => this.openSettings() }, sprite('gear')),
      );
      const pending = sim.state.toIdentify.length;
      const buttons = [
        h('button', { class: 'btn', onclick: () => this.openJournal() }, sprite('book'), 'Carnet'),
        pending
          ? h('button', { class: 'btn primary', onclick: () => this.openIdentify() },
              sprite('question'), 'Identifier', h('span', { class: 'badge' }, pending))
          : null,
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
  }

  private canBuild = false;

  private buildHint(): HTMLElement | null {
    this.canBuild = !!requirementStatus(services.sim.state)?.canBuild;
    return this.canBuild
      ? h('button', { class: 'btn teal', onclick: () => this.openBuildPanel() }, sprite('sparkle'), 'Construire')
      : null;
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
      h('button', {
        class: `btn${decorOn ? ' active' : ''}`,
        onclick: () => {
          services.audio.play('click');
          const sc = this.aquarium();
          if (!sc) return;
          sc.setMode(sc.mode === 'decor' ? 'view' : 'decor');
          if (sc.mode === 'decor') this.toast('Touche un emplacement pour y poser un objet.');
          this.renderAquariumBottom();
        },
      }, sprite('plant'), decorOn ? 'Terminé' : 'Décorer'),
      h('button', {
        class: 'btn',
        title: 'Température',
        onclick: () => {
          const t = ((floor.temp + 1) % 3) as Temp;
          services.sim.setTemp(this.floor, t);
          services.audio.play('bubble');
          this.toast(`Eau ${TEMP_NAMES[t].toLowerCase()} : ${tempLabel(floor.biome, t)}`, { icon: 'thermo' });
          this.renderAquariumBottom();
        },
      }, sprite('thermo'), tempLabel(floor.biome, floor.temp)),
      h('button', { class: 'btn', onclick: () => this.openFishPanel(this.floor) },
        sprite('fishicon'), `${floor.fish.length}/${TANK_CAPACITY}`),
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
    const key = opts.img ?? opts.icon;
    const el = h('div', { class: 'toast' }, key ? sprite(key) : null, msg);
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
      ['book', 'Identifie chaque nouveau venu pour remplir ton carnet et débloquer de nouveaux étages.'],
    ];
    const panel = h('div', { class: 'panel' },
      h('div', { class: 'panel-head' }, 'Bienvenue à Aquachill !'),
      h('div', { class: 'panel-body' },
        h('p', { class: 'muted' }, 'Ici, rien ne presse : aucun poisson ne meurt, jamais.'),
        ...tips.map(([icon, text]) => h('div', { class: 'req' }, sprite(icon), text))),
      h('div', { class: 'panel-foot' },
        h('button', { class: 'btn primary', onclick: () => { this.closeModal(); onDone(); } }, 'C’est parti !')),
    );
    this.open(panel, true);
  }

  // ------------------------------------------------------------------- carnet

  openJournal(tab: 'fish' | 'stars' = 'fish'): void {
    const sim = services.sim;
    const total = SPECIES.length;
    const body = h('div', { class: 'panel-body' });
    const builtBiomes = new Set(sim.state.floors.map((f) => f.biome));
    const pendingBySpecies = new Map<SpeciesId, number>();
    for (const uid of sim.state.toIdentify) {
      const f = findFish(sim.state, uid);
      if (f && !pendingBySpecies.has(f.fish.species)) pendingBySpecies.set(f.fish.species, uid);
    }

    if (tab === 'fish') {
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
              if (known) this.openSpeciesSheet(s.id, () => this.openJournal('fish'));
              else if (pending) this.openIdentify(pending);
              else this.openHint(s);
            },
          },
          pending ? h('span', { class: 'tag' }, '?') : null,
          h('div', { class: 'thumb' }, fit(known ? fishKey(s.id) : `${fishKey(s.id)}-sil`, 46, 18, 2)),
          h('div', null, known ? s.name : pending ? 'À identifier' : '???'),
          h('div', { class: 'stars' }, stars(s.rarity))));
        }
        body.append(grid);
      }
    } else {
      const grid = h('div', { class: 'grid' });
      for (const star of STARS) {
        const visits = sim.state.stars[star.id] ?? 0;
        grid.append(h('div', {
          class: `card${visits ? '' : ' locked'}`,
          onclick: () => {
            if (!visits) return this.toast(`Cette star viendra peut-être quand la tour sera au niveau ${star.level}.`);
            this.openStarSheet(star.id);
          },
        },
        h('div', { class: 'thumb' }, fit(visits ? starKey(star.id) : `${starKey(star.id)}-sil`, 46, 18, 2)),
        h('div', null, visits ? star.name : '???'),
        h('div', { class: 'muted' }, visits ? `${visits} visite${visits > 1 ? 's' : ''}` : `Niv. ${star.level}`)));
      }
      body.append(
        h('p', { class: 'muted' }, 'Des célébrités (presque) connues passent parfois visiter la tour. Touche-les pour un autographe !'),
        grid,
      );
    }

    const found = discoveredCount(sim.state);
    const seenStars = STARS.filter((s) => sim.state.stars[s.id]).length;
    const panel = h('div', { class: 'panel' },
      this.head('Carnet du soigneur'),
      h('div', { class: 'tabs' },
        h('button', { class: `tab${tab === 'fish' ? ' on' : ''}`, onclick: () => this.openJournal('fish') }, `Poissons ${found}/${total}`),
        h('button', { class: `tab${tab === 'stars' ? ' on' : ''}`, onclick: () => this.openJournal('stars') }, `Livre d’or ${seenStars}/${STARS.length}`)),
      body,
    );
    this.open(panel);
  }

  private openHint(s: Species): void {
    const panel = h('div', { class: 'panel' },
      this.head('Espèce inconnue', () => this.openJournal('fish')),
      h('div', { class: 'panel-body center' },
        h('div', { class: 'sheet-hero', style: waterBg(s.biome) }, fit(`${fishKey(s.id)}-sil`, 140, 38)),
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
        h('div', { class: 'sheet-hero', style: waterBg(s.biome) }, fit(fishKey(s.id), 140, 38)),
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
      this.head(star.name, () => this.openJournal('stars')),
      h('div', { class: 'panel-body center' },
        h('div', { class: 'sheet-hero', style: 'background: linear-gradient(#fbeedd, #f3dcc0);' }, fit(starKey(id), 140, 38)),
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
        h('div', { class: 'sheet-hero', style: waterBg(s.biome) }, fit(fishKey(s.id), 140, 38)),
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
      h('div', { class: 'thumb' }, fit(decorKey(it.id), 46, 18, 2)),
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
      const s = SPECIES_BY_ID[fish.species];
      const pending = sim.state.toIdentify.includes(fish.uid);
      let confirm = false;
      const release = h('button', { class: 'btn small' }, 'Relâcher');
      release.addEventListener('click', () => {
        if (!confirm) {
          confirm = true;
          release.textContent = 'Sûr ?';
          return;
        }
        sim.releaseFish(fish.uid);
        services.audio.play('bubble');
        this.toast(`${pending ? 'Le poisson' : s.name} retourne à la nature. Bon voyage !`);
        this.openFishPanel(floorIndex);
      });
      body.append(h('div', { class: 'req' },
        h('div', { style: `width: calc(var(--px) * 24); display:flex; justify-content:center;` }, sprite(fishKey(s.id), 1.5)),
        h('div', { style: 'flex:1' }, pending ? 'Espèce inconnue' : s.name),
        pending
          ? h('button', { class: 'btn small primary', onclick: () => this.openIdentify(fish.uid) }, 'Identifier')
          : h('button', { class: 'btn small', onclick: () => this.openSpeciesSheet(s.id, () => this.openFishPanel(floorIndex)) }, 'Fiche'),
        release));
    }
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
