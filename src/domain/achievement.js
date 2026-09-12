// Achievements are derived from real Alpha state, not static images (§23).
// No XP, no levels, no points — a badge is either earned or not.

export const ACHIEVEMENT_DEFS = [
  { id: 'first_trip', label: 'Pierwsza wyprawa', description: 'Rozpocząłeś swoją pierwszą wyprawę z Fishi.' },
  { id: 'first_species', label: 'Pierwszy gatunek', description: 'Zapisałeś swój pierwszy połów z rozpoznanym gatunkiem.' },
  { id: 'first_private_spot', label: 'Pierwsza miejscówka', description: 'Zapisałeś swoje pierwsze prywatne miejsce.' },
  { id: 'first_shared_trip', label: 'Pierwsza wspólna wyprawa', description: 'Wybrałeś się na wyprawę razem ze znajomym.' },
  { id: 'new_pb', label: 'Nowy rekord osobisty', description: 'Zmierzony połów pobił Twój dotychczasowy rekord.' },
];

/**
 * Pure function: given full Alpha state, returns the set of earned
 * achievement ids. Recomputed on demand — never hand-set, never requires the
 * user to watch an animation to "keep" it (§18/§23).
 */
export function computeEarnedAchievements({ trips, catches, privateSpots, newPbEventCount }) {
  const earned = new Set();
  if (trips.some((t) => t.phase !== 'planned')) earned.add('first_trip');
  if (catches.some((c) => c.speciesId)) earned.add('first_species');
  if (privateSpots.length > 0) earned.add('first_private_spot');
  if (trips.some((t) => t.participantIds.length > 0)) earned.add('first_shared_trip');
  if (newPbEventCount > 0) earned.add('new_pb');
  return earned;
}
