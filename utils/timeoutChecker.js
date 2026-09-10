/**
 * Lazy Timeout Checker
 *
 * Called before processing any game action (move, get state, etc.)
 * Checks whether the current player's move timer has expired.
 * If expired, the game is ended with a timeout loss for the current player.
 *
 * This is "lazy" because we don't run background timers — we check
 * on each API request, which is perfectly fine for correspondence chess
 * where moves take hours or days.
 */

/**
 * Check if the current player's time has expired
 *
 * @param {object} game - Mongoose game document
 * @returns {{ timedOut: boolean, timedOutPlayer: string|null }}
 */
export const checkTimeout = (game) => {
  // Only check active games with a turn in progress
  if (game.status !== "active" || !game.turnStartedAt) {
    return { timedOut: false, timedOutPlayer: null };
  }

  const now = new Date();
  const turnStart = new Date(game.turnStartedAt);
  const maxTimeMs = game.maxTimePerMoveHours * 60 * 60 * 1000;
  const elapsed = now.getTime() - turnStart.getTime();

  if (elapsed > maxTimeMs) {
    return {
      timedOut: true,
      timedOutPlayer: game.currentTurn, // "w" or "b"
    };
  }

  return { timedOut: false, timedOutPlayer: null };
};

/**
 * Calculate remaining time in milliseconds for the current turn
 *
 * @param {object} game - Mongoose game document
 * @returns {number} Remaining time in ms (0 if expired or game not active)
 */
export const getRemainingTime = (game) => {
  if (game.status !== "active" || !game.turnStartedAt) {
    return 0;
  }

  const now = new Date();
  const turnStart = new Date(game.turnStartedAt);
  const maxTimeMs = game.maxTimePerMoveHours * 60 * 60 * 1000;
  const elapsed = now.getTime() - turnStart.getTime();
  const remaining = maxTimeMs - elapsed;

  return Math.max(0, remaining);
};
