// Panneaux de la crique : création du personnage et carnet des relations.
import { actorFrame } from './actors';
import { CHARACTERS, hearts, MAX_HEARTS, orientationKnown, relationLabel, type Npc, type Relation } from './dialogue';
import { portraitUrl } from './DialogueUI';
import {
  ATTRACTIONS, GENDERS, HAIR_STYLES, HAIRS, OUTFITS, playerLook, SKINS, type Profile,
} from './profile';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function sheet(root: HTMLElement): { wrap: HTMLElement; body: HTMLElement; close: () => void } {
  const wrap = el('div', 'cove-sheet');
  const body = el('div', 'cove-sheet-body');
  wrap.append(body);
  root.append(wrap);
  requestAnimationFrame(() => wrap.classList.add('in'));
  return {
    wrap, body,
    close: () => {
      wrap.classList.remove('in');
      setTimeout(() => wrap.remove(), 300);
    },
  };
}

/** Création du personnage : prénom, genre, attirance et apparence, avec aperçu qui marche. */
export function openCreator(root: HTMLElement, start: Profile, first: boolean, done: (p: Profile) => void): void {
  const p: Profile = { ...start };
  const { body, close } = sheet(root);
  const preview = el('img', 'creator-preview');
  let step = 0;
  const redraw = () => {
    preview.src = actorFrame(playerLook(p), 'down', step).toCanvas().toDataURL();
  };
  const timer = setInterval(() => {
    step = (step + 1) % 4;
    redraw();
  }, 220);
  const name = el('input', 'creator-name');
  name.value = first ? '' : p.name;
  name.placeholder = 'Ton prénom';
  name.maxLength = 14;

  const chips = <T extends string>(options: { id: T; label: string }[], get: () => T, set: (v: T) => void) => {
    const row = el('div', 'chips');
    const render = () => {
      row.replaceChildren(...options.map((o) => {
        const b = el('button', `chip${get() === o.id ? ' on' : ''}`, o.label);
        b.addEventListener('click', () => {
          set(o.id);
          render();
          redraw();
        });
        return b;
      }));
    };
    render();
    return row;
  };
  const swatches = (colors: string[], get: () => string, set: (v: string) => void) => {
    const row = el('div', 'chips');
    const render = () => {
      row.replaceChildren(...colors.map((c) => {
        const b = el('button', `swatch${get() === c ? ' on' : ''}`);
        b.style.background = c;
        b.addEventListener('click', () => {
          set(c);
          render();
          redraw();
        });
        return b;
      }));
    };
    render();
    return row;
  };
  const label = (t: string) => el('div', 'sheet-label', t);

  body.append(
    el('div', 'sheet-title', first ? 'Bienvenue dans la crique !' : 'Ton personnage'),
    el('div', 'creator-top', ''),
  );
  const top = body.lastElementChild as HTMLElement;
  const side = el('div', 'creator-side');
  side.append(label('Prénom'), name);
  top.append(preview, side);
  body.append(
    label('Tu es'),
    chips(GENDERS, () => p.gender, (v) => (p.gender = v)),
    label('Tu es attiré·e par'),
    chips(ATTRACTIONS, () => p.attraction, (v) => (p.attraction = v)),
    label('Peau'),
    swatches(SKINS, () => p.skin, (v) => (p.skin = v)),
    label('Cheveux'),
    swatches(HAIRS, () => p.hair, (v) => (p.hair = v)),
    chips(HAIR_STYLES, () => p.hairStyle, (v) => (p.hairStyle = v)),
    label('Tenue'),
    swatches(OUTFITS, () => p.outfit, (v) => (p.outfit = v)),
    el('p', 'sheet-note', 'Les habitants s’adresseront à toi selon ton genre. Les romances ne naissent que si l’attirance est réciproque. Tu pourras tout changer plus tard depuis le carnet ♥.'),
  );
  const ok = el('button', 'sheet-ok', 'C’est moi !');
  ok.addEventListener('click', () => {
    p.name = name.value.trim().slice(0, 14) || 'Soigneur';
    clearInterval(timer);
    close();
    done(p);
  });
  body.append(ok);
  redraw();
}

/** Carnet des relations : cœurs, lien, et orientation une fois qu'on la connaît. */
export function openSocial(root: HTMLElement, rel: Record<Npc, Relation>, p: Profile, onClose: () => void, onEdit: () => void): void {
  const { body, close } = sheet(root);
  const head = el('div', 'social-head');
  head.append(el('div', 'sheet-title', `Carnet de ${p.name}`));
  const edit = el('button', 'chip', 'Modifier mon personnage');
  edit.addEventListener('click', () => {
    close();
    onEdit();
  });
  head.append(edit);
  body.append(head);
  for (const id of Object.keys(CHARACTERS) as Npc[]) {
    const c = CHARACTERS[id];
    const r = rel[id];
    const met = r.seen.includes('intro');
    const row = el('div', `social-row${met ? '' : ' unknown'}`);
    const img = el('img', 'social-face');
    img.src = portraitUrl(id, r.dating ? 'blush' : 'neutral', 'base');
    const info = el('div', 'social-info');
    info.append(el('div', 'social-name', met ? c.name : '???'), el('div', 'social-role', met ? c.role : 'Pas encore rencontré·e'));
    if (met) {
      const hs = el('div', 'dlg-hearts');
      for (let i = 0; i < MAX_HEARTS; i++) hs.append(el('span', i < hearts(r) ? 'h on' : 'h', '♥'));
      info.append(hs, el('div', 'social-status', relationLabel(r, met)));
      info.append(el('div', 'social-orient', orientationKnown(id, r) ? c.orientation : 'Orientation : ? — parle-lui davantage…'));
    }
    row.append(img, info);
    body.append(row);
  }
  const ok = el('button', 'sheet-ok', 'Fermer');
  ok.addEventListener('click', () => {
    close();
    onClose();
  });
  body.append(ok);
}

export interface RescueOpts {
  art: string;
  net: string;
  scene: 'sea' | 'pond' | 'beach';
  title: string;
  story: string;
  verb: string;
  taps: number;
  done: string;
  onTap?: () => void;
}

/** Le sauvetage : on touche plusieurs fois pour libérer la créature, puis elle saute de joie. */
export function rescueOverlay(root: HTMLElement, o: RescueOpts, finished: () => void): void {
  const wrap = el('div', `rescue ${o.scene}`);
  const card = el('div', 'rescue-card');
  const stage = el('div', 'rescue-stage');
  const creature = el('img', 'rescue-creature');
  creature.src = o.art;
  const net = el('img', 'rescue-net');
  net.src = o.net;
  stage.append(creature, net);
  const title = el('div', 'sheet-title', o.title);
  const story = el('div', 'rescue-story', o.story);
  const dots = el('div', 'rescue-dots');
  const hint = el('div', 'rescue-hint', `Touche pour : ${o.verb.toLowerCase()}`);
  card.append(title, stage, story, dots, hint);
  wrap.append(card);
  root.append(wrap);
  requestAnimationFrame(() => wrap.classList.add('in'));
  let n = 0;
  const renderDots = () => dots.replaceChildren(...Array.from({ length: o.taps }, (_, i) => el('span', i < n ? 'on' : '', '●')));
  renderDots();
  let finishedTaps = false;
  stage.addEventListener('click', () => {
    if (finishedTaps) return;
    n++;
    o.onTap?.();
    renderDots();
    net.style.opacity = String(1 - n / o.taps);
    stage.classList.remove('shake');
    void stage.offsetWidth;
    stage.classList.add('shake');
    if (n < o.taps) return;
    finishedTaps = true;
    net.remove();
    creature.classList.add('free');
    story.textContent = o.done;
    hint.remove();
    for (let k = 0; k < 6; k++) {
      const h = el('span', 'rescue-heart', '♥');
      h.style.left = `${20 + k * 12}%`;
      h.style.animationDelay = `${k * 90}ms`;
      stage.append(h);
    }
    const ok = el('button', 'sheet-ok', 'Continuer');
    ok.addEventListener('click', () => {
      wrap.classList.remove('in');
      setTimeout(() => wrap.remove(), 300);
      finished();
    });
    card.append(ok);
  });
}
