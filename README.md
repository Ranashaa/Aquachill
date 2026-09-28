# 🐠 Aquachill

Un petit jeu **ultra chill** en pixel art, inspiré de Tiny Tower : construis une tour
d’aquariums, un étage = un biome. Aucun game over, aucun poisson ne meurt, pas de timer
stressant.

## Jouer

- En ligne : `https://ranashaa.github.io/Aquachill/` (après le premier déploiement, voir plus bas)
- En local :

```bash
npm install
npm run dev      # http://localhost:5173 (aussi accessible depuis ton téléphone sur le même Wi-Fi)
```

Paramètres d’URL utiles pour le développement :

- `?gallery` : affiche tous les sprites générés (page de test visuelle)
- `?speed=10` : accélère la simulation ×10

## Une journée de soigneur (inspirée de Stardew Valley)

- **Ton soigneur** : touche un endroit de la tour, il y va à pied et prend l’ascenseur-bulle
  tout seul, puis fait l’action prévue (regarder un aquarium, soigner un bac, bavarder…).
- **Bacs de culture** au pied des aquariums : de vraies boutures (zoanthes, acropora, corail
  champignon, cabomba, riccia, échinodorus, mousse de Java, lotus, marimo). Plante, soigne
  une fois par jour, récolte. Rien ne fane jamais : un bac oublié attend simplement.
- **Coffre d’expédition** dans le hall : ce que tu y déposes est vendu pendant la nuit.
- **Calendrier** : saisons et jours, environ 13 minutes par journée. Le temps ne passe que
  quand tu joues ; la journée se termine quand tu vas dormir au comptoir de l’accueil, avec
  un bilan du jour. Le ciel suit l’heure du jeu (`?hour=21` pour régler l’horloge).
- **Quatre habitués** : Marcel le pêcheur ronchon, Lila (7 ans), la Pr Gobie et Nina la
  photographe. Bavarde avec eux, offre-leur ce qu’ils aiment : ils t’écrivent des lettres
  (avec un petit cadeau) quand l’amitié grandit.
- **Le Grand Bassin** du hall, vieil aquarium public en ruine, se restaure lot par lot
  (boutures, soins, amitiés), avec des récompenses comme les bottes de soigneur.

## Contenu du MVP

- **Tour scrollable** : hall d’accueil et six étages à débloquer — récif corallien,
  Amazonie, bassin koï, mangrove, banquise et abysses —, ascenseur-bulle et chantier.
- **Progression** : chaque étage se débloque selon le niveau de la tour (gagné grâce aux
  visiteurs), le nombre d’espèces identifiées et un coût en pièces.
- **Visiteurs** : ils prennent l’ascenseur, admirent les aquariums et laissent des pièces.
  Parfois, une **star** passe (Fray, Bob l’Épongeux, Capitaine Hadoque…) : touche-la pour
  un autographe. Chaque star rejoint l’**album des stars**, avec des indices pour celles
  qui ne sont pas encore venues.
- **Une tour vivante** : bulles de pensée et photos des visiteurs, repas des poissons
  (bouton « Nourrir »), plantes qui ondulent, reflets de lumière dans l’eau, passants,
  voitures et oiseaux, cycle jour/nuit calé sur l’horloge du jeu.
- **36 vraies espèces** (6 par biome), fidèles en forme, en couleurs et en motifs, chacune
  avec une fiche : nom commun, nom scientifique, origine, taille et anecdote, plus un lien
  Wikipédia.
- **Attraction par le décor** : chaque espèce a ses préférences de décor et de
  température. Les espèces rares demandent des combinaisons précises. Le carnet donne des
  indices.
- **Identification** : quand un nouveau poisson arrive, un mini-jeu te demande de deviner
  l’espèce d’après ses traits distinctifs.
- **Entretien doux** : les algues poussent lentement sur la vitre et se nettoient en
  frottant. Une vitre sale rend les poissons moins joyeux, sans jamais de conséquence
  grave.
- **Musique et sons** générés en WebAudio. **Sauvegarde automatique** dans le navigateur,
  avec gains (plafonnés) pendant l’absence.

- **Des poissons attachants** : chacun a un prénom (modifiable), un caractère (curieux,
  timide, gourmand, joueur, paresseux, sociable) qui change sa façon de nager, et une
  amitié en cœurs qui grandit avec les câlins et les repas.
- **Reproduction** : un couple d’adultes complices dans un aquarium heureux pond un œuf.
  Il éclot, l’alevin grandit en temps réel, et parfois il porte une **couleur rare**
  inspirée d’une vraie variété (clown noir « Darwin », scalaire doré, koï showa…).
- **Expéditions en sous-marin** vers un lagon, le Rio Negro ou un torrent de montagne :
  il rapporte un œuf et une carte postale pour le carnet de bord.
- **Moments zen** : mode contemplation plein écran, respiration guidée, photos souvenirs
  à télécharger, objectifs doux sans chrono, nouvelles de la tour et résumé au retour.
- **Ta tour à toi** : donne-lui un nom, il s’affiche sur l’enseigne et dans le hall.
- **Mode Pause**, pensé pour souffler entre deux rendez-vous : choisis 2, 5 ou 10 minutes,
  une ambiance (vagues, pluie, musique douce ou silence) et ton aquarium préféré. Tes
  poissons viennent te dire bonjour à la vitre, une pensée du jour s’affiche, aucune
  notification ne te dérange, et un carillon doux annonce la fin.
  Astuce : ajoute `…/Aquachill/?pause=5` à l’écran d’accueil de ton téléphone pour une
  pause en un geste.

Prochaine étape possible : de vrais sprites dessinés à la main.

## Architecture

```
src/
  data/        données pures : biomes, espèces, décors, stars, progression
  state/       état du jeu + sauvegarde localStorage versionnée (migrations)
  systems/     logique pure et testée : Sim (boucle), attraction, algues, bonheur,
               économie, visiteurs, progression
  sprites/     sprites pixel art en grilles de caractères + palettes, police pixel,
               SpriteFactory (génération des textures), overrides.ts
  scenes/      scènes Phaser : Boot, Tower (tour), Aquarium (vue détaillée), TankView
  ui/          interface HTML/CSS pixel : HUD, carnet, fiches, panneaux
  audio/       synthé WebAudio (musique générative + bruitages)
tests/         tests Vitest de la logique
```

La simulation (`systems/Sim.ts`) est indépendante de Phaser : les scènes ne font qu’afficher
l’état et appeler ses actions.

### Remplacer les sprites par de vrais dessins

Tous les sprites sont générés à partir de grilles dans `src/sprites/defs/`. Pour en
remplacer un par un PNG, dépose le fichier dans `public/sprites/` et déclare-le dans
`src/sprites/overrides.ts` sous la même clé (`fish-clown`, `decor-anemone`, `star-fray`…).

## Scripts

```bash
npm test          # tests de la logique (Vitest)
npm run typecheck # vérification TypeScript
npm run build     # build de production dans dist/
```

## Déploiement sur GitHub Pages

Le workflow `.github/workflows/deploy.yml` construit et publie le jeu à chaque push sur
`main`. À faire une seule fois :

1. Le dépôt doit être **public** (GitHub Pages est gratuit pour les dépôts publics).
2. Dans **Settings → Pages → Build and deployment**, choisis **Source : GitHub Actions**.
3. Fusionne la branche de développement dans `main` : le jeu est en ligne quelques minutes
   plus tard.
