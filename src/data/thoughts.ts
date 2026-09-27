// Petites pensées pour accompagner une pause. Rien à faire, juste à lire.

export const THOUGHTS = [
  'Rien ne presse. Les poissons, eux, ne regardent jamais l’heure.',
  'Trois respirations lentes, et le reste attendra un peu.',
  'Tu as le droit de ne rien faire pendant quelques minutes.',
  'Choisis un seul poisson et suis-le du regard. Simplement.',
  'Un corail grandit d’un centimètre par an. Tu as le temps, toi aussi.',
  'Relâche tes épaules. Desserre la mâchoire. Voilà.',
  'L’eau ne force jamais le passage : elle contourne.',
  'Écoute les bulles. Elles montent sans se dépêcher.',
  'Un koï peut vivre des dizaines d’années. Il ne se presse pas.',
  'Ce moment-ci t’appartient. Le suivant viendra bien assez tôt.',
  'Même au fond des abysses, il y a de la lumière.',
  'Le calme n’est pas l’absence de vagues, c’est savoir flotter.',
  'Tu as déjà traversé des journées compliquées. Celle-ci passera aussi.',
  'Pose ton regard sur le bleu. Laisse-le faire le reste.',
  'Inspire par le nez, lentement. Expire comme si tu soufflais sur une bulle.',
  'Les mangroves plient sous le vent mais ne rompent pas.',
  'Tes poissons sont contents de te voir. Vraiment.',
  'Rien à gagner, rien à perdre ici. Juste de l’eau et de la douceur.',
  'Sous la banquise, tout est silencieux. Offre-toi un peu de ce silence.',
  'Prendre soin de soi, c’est aussi du travail bien fait.',
];

export function thoughtOfTheDay(date = new Date()): string {
  const day = Math.floor(date.getTime() / 86_400_000);
  return THOUGHTS[day % THOUGHTS.length];
}

export function randomThought(exclude?: string): string {
  const pool = THOUGHTS.filter((t) => t !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}
