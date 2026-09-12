// DemoFriendsAdapter — real friends/shared trips need a backend + real-time
// sync we don't have here. This simulates a friend joining and later logging
// a catch of their own, entirely client-side, clearly a fixture interaction.
import { DEMO_FRIENDS, SPECIES } from '../data/fixtures.js';

export function listInvitableFriends() {
  return DEMO_FRIENDS;
}

/**
 * Simulates a friend adding a catch some time after joining a trip.
 * Returns a cancel function.
 */
export function simulateFriendCatch({ friend, delayMs = 6000, onCatch }) {
  const species = SPECIES[Math.floor(Math.random() * SPECIES.length)];
  const timer = setTimeout(() => {
    onCatch({ friend, species });
  }, delayMs);
  return () => clearTimeout(timer);
}
