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

## Contenu du MVP

- **Tour scrollable** : hall d’accueil, étages récif corallien, Amazonie et bassin koï,
  ascenseur-bulle et chantier du prochain étage.
- **Progression** : chaque étage se débloque selon le niveau de la tour (gagné grâce aux
  visiteurs), le nombre d’espèces identifiées et un coût en pièces. Mangrove, banquise
  et abysses sont annoncés « bientôt ».
- **Visiteurs** : ils prennent l’ascenseur, admirent les aquariums et laissent des pièces.
  Parfois, une **star** passe (Fray, Bob l’Épongeux, Capitaine Hadoque…) : touche-la pour
  un autographe, elle rejoint le **Livre d’or**.
- **18 vraies espèces** (6 par biome), fidèles en forme, en couleurs et en motifs, chacune
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

Prochaines étapes prévues : expéditions en sous-marin, reproduction avec variantes de
couleur rares, nouveaux biomes.

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
