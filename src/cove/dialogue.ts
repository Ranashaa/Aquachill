// Conversations avec les habitués : rencontres, sujets à choix (qui changent la
// relation) et petites phrases du quotidien qui se souviennent de tes réponses.
import type { Mood } from './portraits';

export type Npc = 'marcel' | 'lila' | 'gobie' | 'nina';

export interface Line {
  text: string;
  mood?: Mood;
}

export interface Choice {
  text: string;
  /** Effet sur la relation (en points ; 50 points = 1 cœur). */
  delta: number;
  reply: Line[];
  flag?: string;
}

export interface Topic {
  id: string;
  /** Cœurs nécessaires pour que le sujet vienne sur le tapis. */
  hearts?: number;
  lines: Line[];
  choices: Choice[];
}

export interface SmallTalk {
  text: string;
  mood?: Mood;
  flag?: string;
  hearts?: number;
}

export interface Character {
  name: string;
  role: string;
  intro: Topic;
  topics: Topic[];
  small: SmallTalk[];
}

const L = (text: string, mood: Mood = 'neutral'): Line => ({ text, mood });

export const CHARACTERS: Record<Npc, Character> = {
  marcel: {
    name: 'Marcel',
    role: 'Pêcheur du ponton',
    intro: {
      id: 'intro',
      lines: [L('Hmpf. Encore un touriste.', 'grumpy'), L('Tu fais peur aux poissons, avec tes pas de géant.', 'grumpy')],
      choices: [
        { text: 'Pardon ! Je suis le nouveau soigneur de la crique.', delta: 20, reply: [L('Le soigneur ? …Bon. Alors tu n’es pas un touriste. C’est déjà ça.', 'surprised'), L('Marcel. Quarante ans que je pêche au bout de ce ponton. Enfin, que j’essaie.')] },
        { text: 'Les poissons n’ont pas d’oreilles, si ?', delta: 10, flag: 'marcel_malin', reply: [L('Ils entendent avec leur ligne latérale, monsieur je-sais-tout.', 'grumpy'), L('…Hé. Tu m’as fait sortir une phrase savante. Pas mal.', 'happy')] },
        { text: 'Alors, ça mord ?', delta: -5, reply: [L('Si ça mordait, je ne serais pas en train de te parler.', 'grumpy')] },
      ],
    },
    topics: [
      {
        id: 'brochet',
        lines: [L('Tu vois ce seau ? Vide. Comme tous les jours depuis 1974.'), L('Cette année-là, j’ai attrapé un brochet de deux mètres.', 'happy'), L('Enfin… un mètre. Bon. Soixante centimètres.', 'blush')],
        choices: [
          { text: 'Soixante centimètres, c’est déjà énorme !', delta: 30, reply: [L('Tu trouves ? …Josiane dit que c’était une chaussette.', 'blush'), L('Mais c’était un brochet.', 'happy')] },
          { text: 'Et vous l’avez relâché ?', delta: 20, flag: 'marcel_brochet', reply: [L('Évidemment. Il m’a regardé avec ses petits yeux…'), L('On ne mange pas quelqu’un qui vous regarde comme ça.', 'sad')] },
          { text: 'Ça ressemble à une histoire de pêcheur.', delta: -15, reply: [L('C’EST une histoire de pêcheur. C’est pour ça qu’elle est vraie.', 'grumpy')] },
        ],
      },
      {
        id: 'josiane',
        lines: [L('Josiane m’a encore tricoté un bonnet. C’est le septième.', 'grumpy'), L('J’ai une seule tête.', 'grumpy')],
        choices: [
          { text: 'C’est une preuve d’amour, ça.', delta: 30, reply: [L('…Quarante-deux ans de mariage et sept bonnets.', 'blush'), L('Oui. Je suppose que c’en est une.', 'happy')] },
          { text: 'Vous pourriez en tricoter pour les poissons !', delta: 10, reply: [L('Des bonnets pour poissons…', 'surprised'), L('Ne dis surtout pas ça à Josiane. Elle en serait capable.', 'happy')] },
          { text: 'Je préfère votre casquette, de toute façon.', delta: 20, reply: [L('Ha ! Enfin quelqu’un de raisonnable dans cette crique.', 'happy')] },
        ],
      },
      {
        id: 'calme',
        hearts: 2,
        lines: [L('Tu sais pourquoi je viens ici tous les matins, si ça ne mord jamais ?')],
        choices: [
          { text: 'Pour le calme ?', delta: 35, flag: 'marcel_calme', reply: [L('Pour le calme. Le bruit de l’eau. Le temps qui passe moins vite.'), L('Tu comprends vite, toi.', 'happy')] },
          { text: 'Pour échapper aux bonnets ?', delta: 20, reply: [L('Ha ! Aussi.', 'happy'), L('Mais surtout pour le calme.')] },
          { text: 'Parce que vous êtes têtu ?', delta: 0, reply: [L('Aussi. Mais pas seulement.', 'grumpy')] },
        ],
      },
    ],
    small: [
      { text: 'L’eau est calme aujourd’hui. C’est suspect.' },
      { text: 'Mes genoux annoncent de la pluie. Ou alors c’est l’âge.', mood: 'grumpy' },
      { text: 'Tu sais pourquoi les poissons vivent dans l’eau salée ? Parce que le poivre les fait éternuer. …Quoi ? Josiane rit, elle.', mood: 'happy' },
      { text: 'J’ai revu mon brochet. Enfin, je crois. Il m’a fait un clin d’œil.', mood: 'happy', flag: 'marcel_brochet' },
      { text: 'Assieds-toi, si tu veux. On regarde l’eau, sans rien dire. C’est bien, ça.', flag: 'marcel_calme' },
      { text: 'Ligne latérale. Je l’ai répété à Josiane, elle était impressionnée.', mood: 'blush', flag: 'marcel_malin' },
    ],
  },
  lila: {
    name: 'Lila',
    role: 'Exploratrice de la plage, 7 ans ¾',
    intro: {
      id: 'intro',
      lines: [L('T’es qui, toi ? T’es un pirate ?', 'surprised')],
      choices: [
        { text: 'Non, je suis le soigneur des poissons.', delta: 15, reply: [L('WOUAH. Comme un docteur, mais pour les poissons ?', 'surprised'), L('Moi c’est Lila. J’ai sept ans et trois quarts.', 'happy')] },
        { text: 'Oui. Le terrible capitaine Crevette.', delta: 30, flag: 'lila_pirate', reply: [L('C’est vrai ?!', 'surprised'), L('Alors moi je suis ta matelote. Lila, sept ans et trois quarts, à vos ordres !', 'happy')] },
        { text: 'Je suis un adulte très occupé.', delta: -10, reply: [L('Oh. Maman aussi, elle dit ça.', 'sad')] },
      ],
    },
    topics: [
      {
        id: 'gerard',
        lines: [L('J’ai trouvé un crabe ! Il s’appelle Gérard.', 'happy'), L('Il a peur de moi.', 'sad')],
        choices: [
          { text: 'On le remet dans l’eau ensemble ?', delta: 35, flag: 'lila_gerard', reply: [L('Mais… il va me manquer.', 'sad'), L('D’accord. Au revoir Gérard ! Écris-moi !', 'happy')] },
          { text: 'Gérard, c’est un super nom.', delta: 15, reply: [L('Hein que oui ! C’est le nom de mon papi. Il a aussi des pinces. Enfin, des mains.', 'happy')] },
          { text: 'Attention, les crabes, ça pince fort.', delta: -5, reply: [L('…', 'surprised'), L('Gérard, il pince pas. Il est gentil. C’est toi qui pinces.', 'grumpy')] },
        ],
      },
      {
        id: 'pipi',
        lines: [L('Question très sérieuse.', 'grumpy'), L('Est-ce que les poissons, ils font pipi dans l’eau ?', 'surprised')],
        choices: [
          { text: 'Oui. Tout le temps.', delta: 20, reply: [L('BEURK !', 'surprised'), L('Je vais le dire à toute ma classe.', 'happy')] },
          { text: 'C’est un secret de soigneur.', delta: 25, flag: 'lila_secret', reply: [L('Un secret ?! Je le dirai à personne.', 'surprised'), L('Sauf à Gérard.', 'blush')] },
          { text: 'On ne pose pas ce genre de questions.', delta: -15, reply: [L('Mais c’est une vraie question…', 'sad')] },
        ],
      },
      {
        id: 'grande',
        hearts: 2,
        lines: [L('Quand je serai grande, je serai soigneuse. Ou licorne.'), L('Tu crois que je peux faire les deux ?', 'surprised')],
        choices: [
          { text: 'Évidemment. Licorne-soigneuse.', delta: 40, flag: 'lila_licorne', reply: [L('OUI ! Avec une corne pour nettoyer les vitres !', 'happy')] },
          { text: 'Soigneuse, c’est un super métier.', delta: 25, reply: [L('Comme toi ?', 'blush'), L('Alors je serai comme toi.', 'happy')] },
          { text: 'Les licornes, ça n’existe pas.', delta: -20, reply: [L('…Toi non plus, peut-être, t’existes pas.', 'sad'), L('Voilà.', 'grumpy')] },
        ],
      },
    ],
    small: [
      { text: 'J’ai creusé un trou jusqu’en Chine. Enfin presque. Il reste un peu.', mood: 'happy' },
      { text: 'Tu savais que l’hippocampe, c’est le papa qui a les bébés ? Mon papa, il a juste un gros ventre.', mood: 'surprised' },
      { text: 'Les poissons dorment les yeux ouverts. J’ai essayé. Ça pique.', mood: 'sad' },
      { text: 'Capitaine Crevette ! Rien à signaler, à part un nuage qui ressemble à un chien.', mood: 'happy', flag: 'lila_pirate' },
      { text: 'Gérard m’a pas encore écrit. Il sait peut-être pas écrire.', mood: 'sad', flag: 'lila_gerard' },
      { text: 'J’ai gardé le secret. J’ai juste fait des clins d’œil à tout le monde.', mood: 'blush', flag: 'lila_secret' },
      { text: 'Je me suis entraînée à être une licorne toute la journée. Je suis fatiguée.', mood: 'happy', flag: 'lila_licorne' },
    ],
  },
  gobie: {
    name: 'Pr Gobie',
    role: 'Biologiste (un peu distraite)',
    intro: {
      id: 'intro',
      lines: [L('Ah ! Vous m’avez fait peur !', 'surprised'), L('J’étais en train de compter les têtards. J’en étais à… zut.', 'sad')],
      choices: [
        { text: 'Je peux vous aider à recompter ?', delta: 30, flag: 'gobie_tetards', reply: [L('Vraiment ? Quelle gentillesse ! Un, deux… Ils bougent tout le temps, c’est scandaleux.', 'happy'), L('Professeure Gobie, enchantée. Biologiste. Enfin, les jours où je retrouve mes lunettes.')] },
        { text: 'Pardon ! Je suis le soigneur de la crique.', delta: 15, reply: [L('Le soigneur ! Parfait.', 'happy'), L('Vous saurez sûrement où j’ai posé mon carnet.')] },
        { text: 'Il y en a combien, à peu près ?', delta: 0, reply: [L('« À peu près » n’est pas une unité scientifique.', 'grumpy'), L('…Beaucoup. Il y en a beaucoup.', 'blush')] },
      ],
    },
    topics: [
      {
        id: 'lunettes',
        lines: [L('Vous n’auriez pas vu mes lunettes ? Je les cherche depuis ce matin.', 'sad')],
        choices: [
          { text: 'Elles sont sur votre nez.', delta: 30, reply: [L('…', 'surprised'), L('Ah. Oui. C’est donc pour ça que je voyais si bien en les cherchant.', 'blush')] },
          { text: 'Je vous aide à chercher !', delta: 15, reply: [L('Merci ! Commençons par la mare. …Non, attendez.', 'happy'), L('Elles sont sur mon nez.', 'blush')] },
          { text: 'Encore ?', delta: -10, reply: [L('Oui, encore. C’est une maladie, je crois. Le « lunettisme ».', 'sad')] },
        ],
      },
      {
        id: 'koi',
        lines: [L('Saviez-vous qu’une carpe koï peut vivre plus de deux cents ans ?', 'happy')],
        choices: [
          { text: 'Deux cents ans ?! Incroyable.', delta: 25, reply: [L('N’est-ce pas ? Une koï nommée Hanako aurait vécu 226 ans.', 'happy'), L('Plus vieille que ma voiture. Et plus fiable.')] },
          { text: 'Et vous, vous avez quel âge ?', delta: -10, reply: [L('On ne demande pas l’âge d’une dame. Ni celui d’une carpe, d’ailleurs.', 'grumpy')] },
          { text: 'On devrait en installer dans la mare.', delta: 20, flag: 'gobie_koi', reply: [L('Mais… c’est une idée brillante !', 'surprised'), L('Je note. Où est mon carnet ? …Dans ma main. Bien.', 'happy')] },
        ],
      },
      {
        id: 'science',
        hearts: 2,
        lines: [L('Parfois je me demande si la science sert à quelque chose.', 'sad'), L('On compte, on mesure… et les têtards s’en fichent.', 'sad')],
        choices: [
          { text: 'Ça sert à mieux les protéger.', delta: 40, flag: 'gobie_science', reply: [L('…Vous avez raison. On protège mieux ce qu’on comprend.', 'blush'), L('Merci, collègue.', 'happy')] },
          { text: 'Les têtards vous aiment bien, je crois.', delta: 25, reply: [L('Vous croyez ? Il y en a un qui me suit. Je l’ai appelé Darwin.', 'happy')] },
          { text: 'C’est vrai que ça a l’air ennuyeux.', delta: -20, reply: [L('Ah. Oui. Sans doute.', 'sad')] },
        ],
      },
    ],
    small: [
      { text: 'Ce nénuphar pousse de trois millimètres par jour. J’ai mesuré. Deux fois.', mood: 'happy' },
      { text: 'La science, c’est 1 % d’inspiration et 99 % de « où est mon carnet ? ».' },
      { text: 'Mon café est froid depuis mardi. Mais c’est une expérience.', mood: 'blush' },
      { text: 'J’ai recompté les têtards grâce à vous : 214. Ou 241. L’un des deux.', mood: 'happy', flag: 'gobie_tetards' },
      { text: 'J’ai écrit à un éleveur de koïs pour la mare ! Il faut encore poster la lettre. Et la retrouver.', mood: 'happy', flag: 'gobie_koi' },
      { text: 'J’ai repris mes carnets de jeunesse. J’avais oublié à quel point j’aimais ça.', mood: 'blush', flag: 'gobie_science' },
    ],
  },
  nina: {
    name: 'Nina',
    role: 'Photographe des rochers',
    intro: {
      id: 'intro',
      lines: [L('Chut… ne bouge pas… la lumière est parfaite…'), L('…et la mouette est partie. Bon.', 'sad')],
      choices: [
        { text: 'Pardon ! Je peux voir tes photos ?', delta: 25, reply: [L('Bien sûr ! Regarde : mouette floue, mouette floue, mon pouce, mouette floue.', 'happy'), L('Nina. Photographe. Surtout de mouettes floues.')] },
        { text: 'Elle va revenir, la mouette.', delta: 15, reply: [L('Tu as raison. Elles reviennent toujours. Surtout quand on a un sandwich.', 'happy')] },
        { text: 'Tu devrais photographier autre chose.', delta: -10, reply: [L('Merci du conseil, monsieur le critique d’art.', 'grumpy')] },
      ],
    },
    topics: [
      {
        id: 'portrait',
        lines: [L('Je peux te prendre en photo ?'), L('C’est pour ma série « Les gens de la crique ».', 'happy')],
        choices: [
          { text: 'Avec plaisir !', delta: 30, flag: 'nina_photo', reply: [L('Super ! Regarde l’horizon, l’air mystérieux…', 'happy'), L('…Parfait. Tu es très photogénique, en fait.', 'blush')] },
          { text: 'Seulement de mon meilleur profil.', delta: 20, reply: [L('Ha ! Lequel ? …D’accord, les deux sont bien.', 'happy')] },
          { text: 'Non merci, je suis timide.', delta: 5, reply: [L('Pas de souci. Je photographierai tes poissons, alors. Ils sont moins timides.')] },
        ],
      },
      {
        id: 'galerie',
        lines: [L('Un jour, j’exposerai mes photos dans une vraie galerie.'), L('Pour l’instant, c’est le frigo de ma mère.', 'sad')],
        choices: [
          { text: 'Le frigo, c’est une galerie avec des aimants.', delta: 30, reply: [L('Ha ! Tu sais quoi, je vais le mettre dans mon CV.', 'happy')] },
          { text: 'Tu pourrais exposer à l’aquarium de la crique.', delta: 35, flag: 'nina_expo', reply: [L('À l’aquarium ?', 'surprised'), L('…Ce serait vraiment possible ?', 'blush')] },
          { text: 'Beaucoup de gens rêvent de ça.', delta: -15, reply: [L('Oui. Je sais.', 'sad')] },
        ],
      },
      {
        id: 'soleil',
        hearts: 2,
        lines: [L('Tu sais ce qui est dur, en photo ? Le coucher de soleil.'), L('Il est toujours plus beau en vrai.', 'sad')],
        choices: [
          { text: 'Alors on le regarde en vrai, ce soir ?', delta: 40, flag: 'nina_soleil', reply: [L('…D’accord. Sans appareil. Juste pour une fois.', 'blush')] },
          { text: 'C’est peut-être ça qui le rend précieux.', delta: 30, reply: [L('…Oui. On ne peut pas tout garder. C’est joli, dit comme ça.')] },
          { text: 'Il faut juste plus de filtres.', delta: -5, reply: [L('Sacrilège.', 'grumpy')] },
        ],
      },
    ],
    small: [
      { text: 'Ta crique a eu trois likes hier. Dont ma mère. Deux fois.', mood: 'happy' },
      { text: 'Je fais une série « Poissons qui jugent ». Ta carpe est ma star.' },
      { text: 'L’heure dorée, c’est dans deux heures. Je reste là. Je ne bouge plus.' },
      { text: 'J’ai imprimé ta photo. Tu fais « soigneur mystérieux ». Ça marche bien.', mood: 'blush', flag: 'nina_photo' },
      { text: 'J’ai commencé à choisir les photos pour l’expo. Il y a beaucoup de mouettes floues.', mood: 'happy', flag: 'nina_expo' },
      { text: 'Hier soir, le coucher de soleil… Je n’ai rien pris en photo. C’était parfait.', mood: 'blush', flag: 'nina_soleil' },
    ],
  },
};

// ------------------------------------------------------------------ relations

export const HEART = 50;
export const MAX_HEARTS = 10;
/** Délai (ms) avant qu'un habitué aborde un nouveau sujet. */
export const TOPIC_COOLDOWN = 4 * 60_000;

export interface Relation {
  points: number;
  seen: string[];
  flags: string[];
  lastTopicAt: number;
  lastGreetDay: string;
  smallIndex: number;
}

export const newRelation = (): Relation => ({ points: 0, seen: [], flags: [], lastTopicAt: 0, lastGreetDay: '', smallIndex: 0 });
export const hearts = (r: Relation) => Math.max(0, Math.min(MAX_HEARTS, Math.floor(r.points / HEART)));

export type Conversation =
  | { kind: 'topic'; topic: Topic }
  | { kind: 'small'; lines: Line[] };

/** Ce que l'habitué a à dire maintenant. */
export function nextConversation(id: Npc, r: Relation, now: number): Conversation {
  const c = CHARACTERS[id];
  if (!r.seen.includes('intro')) return { kind: 'topic', topic: c.intro };
  const topic = c.topics.find((t) => !r.seen.includes(t.id) && hearts(r) >= (t.hearts ?? 0));
  if (topic && now - r.lastTopicAt >= TOPIC_COOLDOWN) return { kind: 'topic', topic };
  // petites phrases : d'abord celles qui se souviennent de tes réponses
  const pool = c.small.filter((s) => (!s.flag || r.flags.includes(s.flag)) && hearts(r) >= (s.hearts ?? 0));
  const remembered = pool.filter((s) => s.flag);
  const list = remembered.length && r.smallIndex % 2 === 0 ? remembered : pool;
  const s = list[r.smallIndex % list.length];
  return { kind: 'small', lines: [{ text: s.text, mood: s.mood ?? 'neutral' }] };
}

/** Un bonjour par jour fait plaisir. Renvoie le gain. */
export function greet(r: Relation, day: string): number {
  if (r.lastGreetDay === day) return 0;
  r.lastGreetDay = day;
  r.points = Math.min(MAX_HEARTS * HEART, r.points + 10);
  return 10;
}

export function finishSmallTalk(r: Relation): void {
  r.smallIndex++;
}

export function choose(r: Relation, topic: Topic, choice: Choice, now: number): void {
  if (!r.seen.includes(topic.id)) r.seen.push(topic.id);
  if (topic.id !== 'intro') r.lastTopicAt = now;
  r.points = Math.max(0, Math.min(MAX_HEARTS * HEART, r.points + choice.delta));
  if (choice.flag && !r.flags.includes(choice.flag)) r.flags.push(choice.flag);
}
