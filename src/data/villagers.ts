// Les habitués de la tour : ils passent tous les jours, bavardent, reçoivent des
// cadeaux et envoient des lettres quand l'amitié grandit.
import type { CropId } from './garden';

export type VillagerId = 'marcel' | 'lila' | 'gobie' | 'nina';

export interface Villager {
  id: VillagerId;
  name: string;
  role: string;
  /** Apparence (gabarit des visiteurs). */
  look: { skin: string; hair: string; hairStyle: 'short' | 'long' | 'cap' | 'bun' | 'bald' | 'curly'; shirt: string; pants: string; shoes: string; cap?: string; dress?: boolean };
  loves: CropId[];
  likes: CropId[];
  lines: string[];
  /** Répliques débloquées avec l'amitié (index = cœurs requis). */
  friendLines: Record<number, string>;
  /** Lettres reçues au matin en atteignant 1, 3 et 5 cœurs. */
  letters: Record<number, { text: string; gift?: { seeds?: CropId; coins?: number } }>;
  loveReply: string;
  likeReply: string;
  neutralReply: string;
}

export const VILLAGERS: Record<VillagerId, Villager> = {
  marcel: {
    id: 'marcel', name: 'Marcel', role: 'vieux pêcheur ronchon',
    look: { skin: '#e8b890', hair: '#c8c8c8', hairStyle: 'cap', cap: '#3a5a8a', shirt: '#c8a060', pants: '#4a4a5a', shoes: '#3a2a1e' },
    loves: ['marimo', 'lotus'], likes: ['echinodorus', 'acropora'],
    lines: [
      'De mon temps, les poissons, on les pêchait. Maintenant on leur donne des prénoms…',
      'Hmpf. Ton poisson-clown m’a souri. Je l’ai vu, ne dis rien.',
      'J’ai pêché un brochet de deux mètres en 1974. Bon, un mètre. Bon, soixante centimètres.',
      'L’eau est propre aujourd’hui. C’est suspect.',
      'Mes genoux annoncent de la pluie. Ou alors c’est l’ascenseur-bulle qui me secoue.',
      'Je ne viens pas pour les poissons. Je viens pour le banc. Il est confortable, ton banc.',
      'Tu sais pourquoi les poissons vivent dans l’eau salée ? Parce que le poivre les fait éternuer. … Quoi ?',
      'J’ai parlé à ton koï. Il écoute mieux que ma femme. Ne le lui répète pas.',
    ],
    friendLines: {
      2: 'Tu es un bon soigneur, gamin. Enfin… pas mauvais.',
      4: 'Tiens, reste un peu. On regarde les poissons, sans rien dire. C’est bien, ça.',
    },
    letters: {
      1: { text: 'Soigneur,\nTon eau était claire hier. Je voulais le dire. Voilà, c’est dit.\n— Marcel\nPS : je t’envoie des boutures, ma femme en avait trop.', gift: { seeds: 'mousse' } },
      3: { text: 'Soigneur,\nJ’ai raconté ta tour aux copains du port. Ils ne me croient pas pour le poisson des glaces.\nEnvoie-leur une photo, qu’ils se taisent.\n— Marcel', gift: { coins: 120 } },
      5: { text: 'Petit,\nÀ mon âge, on a vu beaucoup d’eau passer. La tienne est la plus douce.\nMerci.\n— Marcel', gift: { seeds: 'marimo' } },
    },
    loveReply: 'Oh… un vrai marimo… Je… Hmpf. Merci. Vraiment.',
    likeReply: 'Pas mal, pas mal. Je le mettrai dans mon seau.',
    neutralReply: 'C’est gentil. Je ne sais pas ce que c’est, mais c’est gentil.',
  },
  lila: {
    id: 'lila', name: 'Lila', role: 'petite curieuse de 7 ans',
    look: { skin: '#a8704a', hair: '#23191a', hairStyle: 'bun', shirt: '#ff8ac0', pants: '#5a7ad8', shoes: '#ffffff', dress: true },
    loves: ['zoanthus', 'riccia'], likes: ['cabomba', 'champignon'],
    lines: [
      'Est-ce que les poissons font pipi dans l’eau ? … BEURK.',
      'Si je mets un poisson rouge dans l’eau salée, il devient un poisson-clown ?',
      'Les poissons dorment les yeux ouverts. Moi j’ai essayé. Ça pique.',
      'Mon poisson préféré, c’est celui-là. Non, celui-là. Non, TOUS.',
      'Pourquoi le poisson-lanterne il a une lampe ? Il a peur du noir ?',
      'Quand je serai grande, je serai soigneuse. Ou licorne. Ou les deux.',
      'J’ai donné un nom à ton corail. Il s’appelle Gérard.',
      'Tu savais que l’hippocampe c’est le papa qui a les bébés ? Mon papa, il a juste un gros ventre.',
    ],
    friendLines: {
      2: 'Tu veux être mon meilleur ami ? Après mon chat. Et mon poisson. Troisième meilleur ami.',
      4: 'J’ai fait un dessin de toi avec tous les poissons ! Le rond, c’est toi. Le autre rond aussi.',
    },
    letters: {
      1: { text: 'Coucou le soignneur !!\nJ’ai dessiné un poisson-clown. Il te fait un bisou.\nLila\n(maman a aidé pour écrire)', gift: { seeds: 'zoanthus' } },
      3: { text: 'Cher soigneur,\nÀ l’école, j’ai fait un exposé sur ta tour. J’ai eu une étoile !\nJe te la donne (c’est des pièces, c’est mieux).\nLila', gift: { coins: 80 } },
      5: { text: 'Soigneur,\nQuand je serai grande, je veux faire comme toi.\nOu licorne. Mais surtout comme toi.\nLila ♥', gift: { seeds: 'champignon' } },
    },
    loveReply: 'OUAAAH ! C’est pour moi ?! Je vais l’appeler Gérard 2 !',
    likeReply: 'Merci ! C’est tout doux !',
    neutralReply: 'Ah. … Merci quand même !',
  },
  gobie: {
    id: 'gobie', name: 'Pr Gobie', role: 'biologiste un peu distraite',
    look: { skin: '#f6d2b0', hair: '#e8c46a', hairStyle: 'long', shirt: '#f0f0f0', pants: '#4a5a7a', shoes: '#6a3a2a' },
    loves: ['champignon', 'echinodorus'], likes: ['acropora', 'marimo'],
    lines: [
      'J’ai encore oublié mes lunettes… dans le bac des néons. Encore.',
      'Saviez-vous que les poissons-perroquets dorment dans une bulle de mucus ? Moi, je dors dans un pyjama. Chacun ses choix.',
      'Je prépare une thèse sur votre gobie. Enfin, sur les gobies. Enfin, je crois.',
      'Ce corail pousse de 0,03 millimètre par jour. J’ai mesuré. Deux fois.',
      'Vous avez vu mes clés ? … Ah, elles sont dans ma main.',
      'Un poisson-lune peut pondre 300 millions d’œufs. Moi j’ai du mal à rendre mes copies à l’heure.',
      'La science, c’est 1 % d’inspiration et 99 % de « où est-ce que j’ai mis mon carnet ? ».',
      'Votre eau est à la bonne température. Mon café, lui, est froid depuis mardi.',
    ],
    friendLines: {
      2: 'Vous avez l’œil d’un vrai naturaliste. Et moi, j’ai perdu le mien… Ah non, lunettes.',
      4: 'Grâce à vous, j’ai retrouvé l’amour de mon métier. Et mes lunettes.',
    },
    letters: {
      1: { text: 'Cher collègue,\nJ’ai observé vos boutures : croissance remarquable.\nJe vous joins un échantillon. Enfin, si je le retrouve.\nPr Gobie', gift: { seeds: 'echinodorus' } },
      3: { text: 'Cher collègue,\nMon laboratoire vous accorde une petite bourse de recherche.\nN’en parlez pas au directeur, il croit que c’est pour du café.\nPr Gobie', gift: { coins: 150 } },
      5: { text: 'Cher ami,\nJ’ai nommé une nouvelle espèce de copépode d’après votre tour.\nElle mesure 0,4 mm. C’est un immense honneur.\nPr Gobie', gift: { seeds: 'lotus' } },
    },
    loveReply: 'Un spécimen parfait ! Je… je crois que je vais pleurer. Ou éternuer.',
    likeReply: 'Intéressant, très intéressant. Je note. Où est mon carnet ?',
    neutralReply: 'Merci ! Je vais l’étudier. Sous toutes les coutures.',
  },
  nina: {
    id: 'nina', name: 'Nina', role: 'photographe amatrice',
    look: { skin: '#fbd9bc', hair: '#7a58c0', hairStyle: 'short', shirt: '#4ac8c8', pants: '#2a2a34', shoes: '#f0f0f0' },
    loves: ['lotus', 'acropora'], likes: ['zoanthus', 'mousse'],
    lines: [
      'Ta tour a eu 3 likes hier. Dont ma mère. Deux fois.',
      'Ne bouge pas… la lumière est parfaite… et le poisson est parti. Évidemment.',
      'J’ai pris 400 photos de ton hippocampe. Il fait la même tête sur toutes.',
      'Mon objectif préféré ? Le poisson-lune. Il pose sans jamais se plaindre.',
      'Tu savais qu’on appelle ça « l’heure dorée » ? Moi j’appelle ça « l’heure où mon téléphone n’a plus de batterie ».',
      'Je fais une série « Poissons qui jugent ». Ton chabot est ma star.',
      'Un jour j’exposerai mes photos dans un musée. Ou au moins dans ta cage d’ascenseur.',
      'Sourire, c’est bien. Mais tu as vu comment ton discus prend la lumière ?',
    ],
    friendLines: {
      2: 'Je peux te prendre en photo avec tes poissons ? Tu fais partie du décor, maintenant.',
      4: 'J’ai gagné un concours avec une photo de ta tour ! Je t’ai cité, promis.',
    },
    letters: {
      1: { text: 'Salut !\nJe t’envoie un tirage de ton récif au lever du soleil.\nOk, en vrai c’est des boutures. Mais c’est joli aussi.\nNina', gift: { seeds: 'acropora' } },
      3: { text: 'Hey !\nUn magazine a acheté ma photo de ta tour. Moitié-moitié ?\nNina', gift: { coins: 200 } },
      5: { text: 'Coucou,\nMon expo s’appelle « La tour où le temps ralentit ».\nMerci d’avoir créé cet endroit.\nNina', gift: { seeds: 'lotus' } },
    },
    loveReply: 'Oh là là, la texture ! La couleur ! Je shoote tout de suite !',
    likeReply: 'Joli ! Ça ira très bien dans mon studio.',
    neutralReply: 'Merci ! Je trouverai bien un angle.',
  },
};

export const VILLAGER_LIST = Object.values(VILLAGERS);
