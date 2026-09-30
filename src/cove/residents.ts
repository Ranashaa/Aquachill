// Les nouveaux habitants adultes de la crique. Chacun a son orientation, que l'on
// devine à de petits détails (un pin's sur la veste…) et qu'on apprend en discutant.
import type { Character, Line } from './dialogue';
import type { Mood } from './portraits';

const L = (text: string, mood: Mood = 'neutral'): Line => ({ text, mood });

export type Resident = 'elio' | 'maelle' | 'yanis' | 'camille';

export const RESIDENTS: Record<Resident, Character> = {
  elio: {
    name: 'Élio',
    role: 'Boulanger de la buvette',
    gender: 'm', attraction: 'all', romanceable: true,
    orientation: 'Attiré par tout le monde',
    pin: ['#d60270', '#9b4f96', '#0038a8'],
    intro: {
      id: 'intro',
      lines: [L('Bonjour bonjour ! Croissant ? Pain au chocolat ? Chocolatine ? Je ne prends pas parti.', 'happy'), L('Tu dois être la nouvelle personne qui soigne les poissons !', 'surprised')],
      choices: [
        { text: 'Un pain au chocolat, s’il te plaît !', delta: 25, flag: 'elio_painchoc', reply: [L('Excellent choix. Et le premier est offert : bienvenue dans la crique !', 'happy'), L('Moi c’est Élio. Je fais le pain, les blagues, et parfois les deux en même temps.')] },
        { text: 'Une chocolatine, évidemment.', delta: 25, flag: 'elio_chocolatine', reply: [L('Ah ! Quelqu’un du Sud-Ouest ! Tu vas bien t’entendre avec mon four, il est très chaud.', 'happy'), L('Élio, enchanté. Reviens quand tu veux.')] },
        { text: 'Je ne mange pas le matin.', delta: 0, reply: [L('Pas le matin ?! Mais… le matin, c’est le moment du croissant.', 'surprised'), L('Bon. Je t’en garde un pour ce soir. On ne sait jamais.', 'happy')] },
      ],
    },
    topics: [
      {
        id: 'reve',
        lines: [L('Tu sais ce dont je rêve ?'), L('Une boulangerie-aquarium. Tu achètes ta baguette, et un poisson-clown te regarde faire.', 'happy')],
        choices: [
          { text: 'C’est génial, je viendrais tous les jours !', delta: 30, flag: 'elio_reve', reply: [L('Vrai ? Tu serais ma première cliente et mon premier client en même temps.', 'blush'), L('…Enfin, tu vois ce que je veux dire.', 'happy')] },
          { text: 'Les poissons n’aiment peut-être pas la farine.', delta: 10, reply: [L('Hmm. Un aquarium hermétique à la farine. Je note.', 'surprised')] },
          { text: 'Un peu étrange, non ?', delta: -10, reply: [L('Étrange, c’est ce qu’on disait du pain aux olives. Et regarde aujourd’hui.', 'grumpy')] },
        ],
      },
      {
        id: 'blague',
        lines: [L('J’ai une blague. Qu’est-ce qu’un croissant qui fait du sport ?', 'happy')],
        choices: [
          { text: 'Un croissant… de lune ?', delta: 10, reply: [L('Non ! Un pain au chocolat… qui s’entraîne.', 'happy'), L('…Je la retravaille encore.', 'blush')] },
          { text: 'Je donne ma langue au chat.', delta: 20, reply: [L('Un croissance musculaire !', 'happy'), L('Tu ris ? Tu ris. Victoire.', 'happy')] },
          { text: 'Épargne-moi, s’il te plaît.', delta: -5, reply: [L('Trop tard. Elle est déjà dans ta tête. Pour toujours.', 'grumpy')] },
        ],
      },
      {
        id: 'confide',
        hearts: 3,
        lines: [L('Tu sais, avant d’ouvrir la buvette, j’ai eu le cœur brisé deux fois.', 'sad'), L('Une fois par Léa, une fois par Mathis. Deux personnes géniales. Juste… pas pour moi.', 'sad')],
        choices: [
          { text: 'Ça fait mal, mais tu mérites quelqu’un de bien.', delta: 30, reply: [L('…Merci. Je suis content de te l’avoir dit.', 'blush'), L('Moi, je tombe amoureux des gens. Peu importe qui ils sont.')] },
          { text: 'Tu veux un croissant pour te consoler ?', delta: 25, reply: [L('Tu m’offres MON croissant ?', 'surprised'), L('C’est la chose la plus gentille qu’on m’ait dite cette semaine.', 'happy')] },
          { text: 'Deux fois ? Tu collectionnes !', delta: -10, reply: [L('Ha. Ha. Très drôle.', 'grumpy')] },
        ],
      },
    ],
    small: [
      { text: 'La pâte a levé plus vite aujourd’hui. Elle devait être de bonne humeur.', mood: 'happy' },
      { text: 'Marcel prend une baguette tous les matins. Il dit que c’est pour Josiane. Il en mange la moitié en chemin.' },
      { text: 'Lila m’a demandé si les poissons mangent du pain. J’ai dit non. Elle a dit « t’es sûr ? ».', mood: 'happy' },
      { text: 'Chocolatine, j’ai réfléchi. Tu avais peut-être raison.', mood: 'blush', flag: 'elio_chocolatine' },
      { text: 'J’ai dessiné les plans de la boulangerie-aquarium. Il y a un tunnel. Pour les baguettes.', mood: 'happy', flag: 'elio_reve' },
    ],
    romance: {
      ask: [L('Dis… Je me demandais…', 'blush'), L('Quand tu passes à la buvette, je rate toujours une fournée. Tu sais pourquoi ?', 'blush')],
      accept: [L('…Vraiment ?', 'surprised'), L('Moi aussi. Depuis le premier pain au chocolat. Enfin, la première chocolatine. Enfin… depuis toi.', 'blush'), L('On pourrait regarder le coucher de soleil depuis la buvette, ce soir ?', 'happy')],
      decline: [L('Oh…', 'sad'), L('Je t’aime beaucoup aussi. Mais pas de cette façon-là.', 'sad'), L('On reste les meilleurs amis de la croûte, d’accord ?', 'happy')],
      friend: [L('L’amitié, c’est comme le levain : ça se nourrit tous les jours.', 'happy')],
      couple: [
        { text: 'Je t’ai gardé le croissant le plus doré. Ne le dis à personne.', mood: 'blush' },
        { text: 'Ce soir, coucher de soleil depuis la buvette ? J’apporte les chouquettes.', mood: 'happy' },
        { text: 'J’ai mis un cœur en farine sur ta baguette. Ça ne se voit presque pas.', mood: 'blush' },
      ],
    },
  },

  maelle: {
    name: 'Maëlle',
    role: 'Sauveteuse en mer',
    gender: 'f', attraction: 'f', romanceable: true,
    orientation: 'Attirée par les femmes',
    pin: ['#d62900', '#ffffff', '#d462a6'],
    intro: {
      id: 'intro',
      lines: [L('Hé, attention au ponton, les planches sont glissantes le matin.'), L('Maëlle. Je m’occupe du bateau de sauvetage. Et des gens qui glissent sur les pontons.', 'grumpy')],
      choices: [
        { text: 'Merci ! Tu sauves aussi des animaux ?', delta: 30, flag: 'maelle_animaux', reply: [L('Surtout des animaux. Tortues prises dans des filets, dauphins égarés…', 'surprised'), L('Un jour, je t’emmènerai en mer. Si tu as le pied marin.', 'happy')] },
        { text: 'Je ne glisse jamais, moi.', delta: 5, reply: [L('C’est ce qu’ils disent tous. Juste avant de glisser.', 'grumpy')] },
        { text: 'Tu as l’air sérieuse.', delta: 10, reply: [L('En mer, on n’a pas le choix.', 'neutral'), L('À terre… je peux rire. Parfois. Si c’est drôle.', 'happy')] },
      ],
    },
    topics: [
      {
        id: 'tempete',
        lines: [L('La nuit dernière, il y avait de la houle. J’ai ramené un bébé phoque au port.'), L('Il m’a mordu le doigt. Par gratitude, je suppose.', 'grumpy')],
        choices: [
          { text: 'Tu es une vraie héroïne.', delta: 25, reply: [L('Non. Je fais juste mon travail.', 'blush'), L('…Mais tu peux le redire.', 'happy')] },
          { text: 'Et ton doigt, ça va ?', delta: 30, flag: 'maelle_doigt', reply: [L('Tu es la première personne à me le demander.', 'surprised'), L('Ça va. Merci.', 'blush')] },
          { text: 'Un phoque, c’est pas un peu gros pour un bébé ?', delta: 5, reply: [L('Vingt kilos. De pur caractère.', 'happy')] },
        ],
      },
      {
        id: 'mer',
        lines: [L('Tu sais ce que je préfère, en mer ?'), L('Le moment juste avant l’aube. Tout est gris et bleu, et on n’entend que l’eau.')],
        choices: [
          { text: 'Ça a l’air magnifique.', delta: 25, reply: [L('Ça l’est. Je te montrerai.', 'happy')] },
          { text: 'Moi je préfère dormir, à l’aube.', delta: 10, reply: [L('Ha ! Honnête. J’aime bien.', 'happy')] },
          { text: 'Tu n’as jamais peur ?', delta: 20, reply: [L('Tout le temps. C’est pour ça que je fais attention.', 'sad'), L('La peur, c’est une boussole.')] },
        ],
      },
      {
        id: 'confide',
        hearts: 3,
        lines: [L('Clara, mon ex, disait que j’étais mariée à la mer.', 'sad'), L('Elle avait sûrement raison. On s’est quittées il y a deux ans.', 'sad')],
        choices: [
          { text: 'La mer ne t’empêche pas d’aimer quelqu’un.', delta: 35, reply: [L('…Peut-être pas.', 'blush'), L('Je crois que je cherche une femme qui aime la mer autant que moi.')] },
          { text: 'Tu es encore triste ?', delta: 25, reply: [L('Un peu. Moins qu’avant.', 'sad'), L('Parler avec toi aide, en fait.', 'blush')] },
          { text: 'Tu devrais changer de métier.', delta: -20, reply: [L('Non.', 'grumpy')] },
        ],
      },
    ],
    small: [
      { text: 'Vent de sud-ouest aujourd’hui. Parfait pour sortir.' },
      { text: 'J’ai trouvé une bouteille à la mer. Le message disait « aide-moi à finir mes devoirs ». Lila, sûrement.', mood: 'happy' },
      { text: 'Le bateau s’appelle « La Mouette ». Il y a une vraie mouette qui vit sur le mât. Elle ne paie pas de loyer.', mood: 'grumpy' },
      { text: 'Mon doigt a guéri. Le phoque, lui, va très bien. Il m’envoie ses amitiés.', mood: 'happy', flag: 'maelle_doigt' },
      { text: 'Quand tu seras prête… ou prêt… on ira sauver des poissons au large. Promis.', flag: 'maelle_animaux' },
    ],
    romance: {
      ask: [L('Viens, assieds-toi sur le ponton. Regarde.', 'neutral'), L('…Je voulais te dire un truc. Et je n’aime pas les détours.', 'blush')],
      accept: [L('Je sais. Je l’ai su à l’instant où tu m’as demandé des nouvelles de mon doigt.', 'blush'), L('Alors… on essaie ? Toi, moi, et la mer en témoin.', 'happy')],
      decline: [L('…', 'surprised'), L('Tu comptes beaucoup pour moi. Mais je n’aime que les femmes. Et c’est une amitié qu’on a, toi et moi.', 'sad'), L('Une vraie. Ça, je ne veux pas la perdre.', 'happy')],
      friend: [L('Tu es une des rares personnes avec qui je parle à terre. Ne change pas.', 'happy')],
      couple: [
        { text: 'Je t’ai gardé une place sur La Mouette. À l’avant. C’est la meilleure.', mood: 'blush' },
        { text: 'Clara avait tort, finalement. On peut aimer la mer et quelqu’un d’autre.', mood: 'blush' },
        { text: 'Si tu glisses sur le ponton, je te rattrape. Toujours.', mood: 'happy' },
      ],
    },
  },

  yanis: {
    name: 'Yanis',
    role: 'Musicien sous le grand chêne',
    gender: 'm', attraction: 'm', romanceable: true,
    orientation: 'Attiré par les hommes',
    pin: ['#078d70', '#ffffff', '#3d1a78'],
    intro: {
      id: 'intro',
      lines: [L('♪ La la… oh, pardon. Je t’avais pas vu venir.', 'surprised'), L('Je joue pour les mouettes. Elles sont mon public le plus fidèle. Et le plus bruyant.', 'happy')],
      choices: [
        { text: 'Tu peux jouer quelque chose pour moi ?', delta: 30, flag: 'yanis_chanson', reply: [L('Pour toi ? D’accord. Ça s’appelle « Le crabe qui voulait voler ».', 'happy'), L('…C’est une chanson triste. Il n’y arrive pas. Yanis, au fait.', 'sad')] },
        { text: 'Les mouettes chantent faux, non ?', delta: 15, reply: [L('Elles chantent en mouette. C’est une autre gamme.', 'happy')] },
        { text: 'Tu ne travailles pas ?', delta: -10, reply: [L('La musique, c’est un travail. Juste, personne ne me paie.', 'grumpy')] },
      ],
    },
    topics: [
      {
        id: 'guitare',
        lines: [L('Cette guitare appartenait à ma grand-mère. Elle jouait dans les bals de la côte.'), L('Elle disait : « une chanson, c’est une lettre qu’on écrit à tout le monde à la fois ».', 'happy')],
        choices: [
          { text: 'Elle devait être formidable.', delta: 30, reply: [L('Elle l’était. Elle dansait mieux que tout le village.', 'blush')] },
          { text: 'Tu m’apprendras quelques accords ?', delta: 25, flag: 'yanis_accords', reply: [L('Avec plaisir. Commence par le sol. Tout le monde aime le sol.', 'happy')] },
          { text: 'Elle est un peu vieille, non ?', delta: -10, reply: [L('Comme le chêne. Comme la mer. Et pourtant.', 'grumpy')] },
        ],
      },
      {
        id: 'trac',
        lines: [L('On m’a proposé de jouer à la fête du port. Devant tout le monde.', 'sad'), L('J’ai le trac rien que d’y penser.', 'sad')],
        choices: [
          { text: 'Je serai au premier rang.', delta: 35, flag: 'yanis_fete', reply: [L('Vrai ? Alors je jouerai en te regardant. Comme ça, ce sera plus facile.', 'blush')] },
          { text: 'Imagine qu’ils sont tous des mouettes.', delta: 20, reply: [L('Ha ! Marcel en mouette… Ça marche plutôt bien.', 'happy')] },
          { text: 'Tu n’as qu’à refuser.', delta: -5, reply: [L('Oui… sans doute.', 'sad')] },
        ],
      },
      {
        id: 'confide',
        hearts: 3,
        lines: [L('J’ai écrit une nouvelle chanson. Elle parle… d’un garçon.', 'blush'), L('Un garçon que j’aimais au lycée. Il ne l’a jamais su.', 'sad')],
        choices: [
          { text: 'Tu me la chantes ?', delta: 35, reply: [L('♪ Il avait les yeux couleur de marée… ♪', 'blush'), L('Voilà. Tu es la première personne à l’entendre. Et à savoir.', 'happy')] },
          { text: 'Il a raté quelque chose.', delta: 30, reply: [L('…Tu crois ?', 'surprised'), L('Merci. Ça me fait du bien de le dire à voix haute.', 'blush')] },
          { text: 'Tu devrais écrire sur la mer, plutôt.', delta: -10, reply: [L('La mer, tout le monde écrit dessus. Lui, personne.', 'grumpy')] },
        ],
      },
    ],
    small: [
      { text: 'J’ai composé un air pour la mare. Les koïs dansent. Enfin, ils nagent. En rythme.', mood: 'happy' },
      { text: 'Camille m’a dit que les étoiles chantent aussi. Juste trop bas pour qu’on les entende.' },
      { text: 'Nina a pris une photo de moi en train de jouer. J’ai l’air très profond. Je pensais à un sandwich.', mood: 'happy' },
      { text: 'Alors, le sol ? N’oublie pas : le pouce détendu.', mood: 'happy', flag: 'yanis_accords' },
      { text: 'La fête du port approche. Tu seras là, hein ? Premier rang.', mood: 'blush', flag: 'yanis_fete' },
    ],
    romance: {
      ask: [L('Assieds-toi sous le chêne avec moi. J’ai une chanson… elle est pour toi.', 'blush'), L('♪ Il est venu soigner les poissons, et il a soigné mon cœur… ♪', 'blush')],
      accept: [L('…Tu es sérieux ?', 'surprised'), L('Alors c’était pas qu’une chanson. Tant mieux. Vraiment tant mieux.', 'blush'), L('Je vais devoir écrire la suite, maintenant.', 'happy')],
      decline: [L('Oh. Je… je comprends.', 'sad'), L('Moi, c’est les garçons qui me font chanter. Mais notre amitié, elle, elle a sa propre chanson.', 'happy')],
      friend: [L('Tu es dans une de mes chansons, tu sais. Au refrain. C’est la meilleure place.', 'happy')],
      couple: [
        { text: 'J’ai ajouté un couplet à notre chanson. Il y a une rime avec « nénuphar ». J’en suis fier.', mood: 'happy' },
        { text: 'Viens t’asseoir. Je joue mieux quand tu es là.', mood: 'blush' },
        { text: 'Ma grand-mère t’aurait adoré. Elle aurait dansé avec toi toute la nuit.', mood: 'blush' },
      ],
    },
  },

  camille: {
    name: 'Camille',
    role: 'Gardien·ne du phare (iel)',
    gender: 'n', attraction: 'all', romanceable: true,
    orientation: 'Attiré·e par tout le monde',
    pin: ['#ff218c', '#ffd800', '#21b1ff'],
    intro: {
      id: 'intro',
      lines: [L('Oh, de la visite. Le phare n’en reçoit pas souvent.', 'surprised'), L('Je suis Camille. Je veille sur la lumière. On dit « iel », pour moi.')],
      choices: [
        { text: 'Enchanté·e, Camille ! Moi c’est {nom}.', delta: 30, flag: 'camille_nom', reply: [L('{nom}. C’est joli. Je vais le dire aux étoiles, ce soir.', 'happy')] },
        { text: 'Tu ne t’ennuies pas, seul·e là-haut ?', delta: 15, reply: [L('Jamais. Il y a la mer, le ciel, et un chat qui s’appelle Bouée.', 'happy')] },
        { text: 'Un phare, ça sert encore à quelque chose ?', delta: -5, reply: [L('Demande aux bateaux qui rentrent la nuit.', 'grumpy')] },
      ],
    },
    topics: [
      {
        id: 'etoiles',
        lines: [L('Ce soir, on pourra voir la constellation du Poisson. Tu la connais ?')],
        choices: [
          { text: 'Non, tu me la montreras ?', delta: 30, flag: 'camille_etoiles', reply: [L('Avec plaisir. Reviens après le coucher du soleil.', 'happy'), L('Je t’apprendrai à la trouver. Elle ressemble à… un poisson. Surprise.', 'happy')] },
          { text: 'Il y a une constellation de l’aquarium ?', delta: 20, reply: [L('Pas encore. On pourrait en inventer une.', 'happy')] },
          { text: 'Je ne vois jamais rien, le ciel est flou.', delta: 5, reply: [L('Il faut laisser tes yeux s’habituer. Vingt minutes. Comme pour les gens.')] },
        ],
      },
      {
        id: 'bouee',
        lines: [L('Bouée, mon chat, a encore ramené un crabe dans le phare.', 'grumpy'), L('Vivant. Il l’a posé sur mon oreiller. Avec fierté.', 'grumpy')],
        choices: [
          { text: 'Je peux le ramener à l’aquarium !', delta: 30, reply: [L('Tu ferais ça ? Bouée sera vexé. Moi, soulagé·e.', 'happy')] },
          { text: 'C’est un cadeau, c’est mignon.', delta: 20, reply: [L('Mignon à 3 h du matin, moins.', 'happy')] },
          { text: 'Ton chat a de drôles de goûts.', delta: 10, reply: [L('Il m’a choisi·e. Tout le monde a ses faiblesses.', 'happy')] },
        ],
      },
      {
        id: 'confide',
        hearts: 3,
        lines: [L('Tu sais, on me demande souvent si je préfère les hommes ou les femmes.'), L('Moi, je tombe amoureux·se des gens. Pas des cases.', 'blush')],
        choices: [
          { text: 'C’est une belle façon de voir les choses.', delta: 35, reply: [L('Merci. C’est surtout la seule que je connaisse.', 'happy')] },
          { text: 'Merci de me le confier.', delta: 30, reply: [L('Je ne le dis pas à tout le monde. Tu n’es pas tout le monde.', 'blush')] },
          { text: 'Ça ne me regarde pas vraiment.', delta: 5, reply: [L('Non, c’est vrai. Mais j’avais envie que tu saches.', 'neutral')] },
        ],
      },
    ],
    small: [
      { text: 'La lampe du phare tourne toutes les dix secondes. Je les compte parfois. Ça calme.' },
      { text: 'Bouée a décidé que le fauteuil était à lui. Je lis debout maintenant.', mood: 'grumpy' },
      { text: 'Yanis joue parfois sous le chêne à la tombée du jour. D’ici, on l’entend juste assez.', mood: 'happy' },
      { text: 'Tu as vu le Poisson, hier soir ? Je l’ai regardé en pensant à ton aquarium.', mood: 'blush', flag: 'camille_etoiles' },
      { text: '{nom}. Les étoiles ont bien reçu ton prénom. Elles clignotent plus fort.', mood: 'happy', flag: 'camille_nom' },
    ],
    romance: {
      ask: [L('Monte en haut du phare avec moi. De là, on voit toute la crique.', 'neutral'), L('…Je voulais te montrer la plus belle vue d’ici. Et te dire quelque chose.', 'blush')],
      accept: [L('Toi aussi ?', 'surprised'), L('J’ai compté les tours de la lampe en pensant à toi. Des centaines.', 'blush'), L('Alors on peut compter ensemble, maintenant.', 'happy')],
      decline: [L('Ah.', 'sad'), L('Je comprends. On ne choisit pas qui fait battre notre cœur.', 'neutral'), L('Mais tu resteras toujours la bienvenue au phare.', 'happy')],
      friend: [L('Une amitié comme la nôtre, c’est une lumière qui ne s’éteint pas.', 'happy')],
      couple: [
        { text: 'Bouée t’a adopté·e, je crois. Il a posé un crabe sur ton côté du canapé.', mood: 'happy' },
        { text: 'Ce soir, on regarde les étoiles ? J’ai une couverture et du chocolat chaud.', mood: 'blush' },
        { text: 'J’ai nommé une étoile d’après toi. Elle n’a pas de nom officiel. Maintenant, si.', mood: 'blush' },
      ],
    },
  },
};
