/**
 * Standard Elo Rating Calculator
 *
 * Uses the FIDE-style Elo formula (same approach as chess.com / lichess):
 *   Expected score:  E_a = 1 / (1 + 10^((R_b - R_a) / 400))
 *   New rating:      R'_a = R_a + K * (S_a - E_a)
 *
 * K-factor:
 *   40 for players with fewer than 30 games (provisional)
 *   20 for players with 30+ games (established)
 */

/**
 * Get K-factor based on number of games played
 * @param {number} gamesPlayed
 * @returns {number}
 */
const getKFactor = (gamesPlayed) => {
  return gamesPlayed < 30 ? 40 : 20;
};

/**
 * Calculate expected score for player A against player B
 * @param {number} ratingA
 * @param {number} ratingB
 * @returns {number} Expected score (0 to 1)
 */
const expectedScore = (ratingA, ratingB) => {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
};

/**
 * Calculate Elo rating changes for both players after a game
 *
 * @param {object} params
 * @param {number} params.whiteRating - Current rating of white player
 * @param {number} params.blackRating - Current rating of black player
 * @param {number} params.whiteGamesPlayed - Total games played by white
 * @param {number} params.blackGamesPlayed - Total games played by black
 * @param {string} params.result - "white" | "black" | "draw"
 * @returns {{ whiteRatingChange: number, blackRatingChange: number, whiteNewRating: number, blackNewRating: number }}
 */
export const calculateElo = ({
  whiteRating,
  blackRating,
  whiteGamesPlayed,
  blackGamesPlayed,
  result,
}) => {
  // Actual scores
  let whiteScore, blackScore;
  if (result === "white") {
    whiteScore = 1;
    blackScore = 0;
  } else if (result === "black") {
    whiteScore = 0;
    blackScore = 1;
  } else {
    // draw
    whiteScore = 0.5;
    blackScore = 0.5;
  }

  // Expected scores
  const whiteExpected = expectedScore(whiteRating, blackRating);
  const blackExpected = expectedScore(blackRating, whiteRating);

  // K-factors
  const whiteK = getKFactor(whiteGamesPlayed);
  const blackK = getKFactor(blackGamesPlayed);

  // Rating changes (rounded to nearest integer)
  const whiteRatingChange = Math.round(whiteK * (whiteScore - whiteExpected));
  const blackRatingChange = Math.round(blackK * (blackScore - blackExpected));

  // New ratings (minimum 100)
  const whiteNewRating = Math.max(100, whiteRating + whiteRatingChange);
  const blackNewRating = Math.max(100, blackRating + blackRatingChange);

  return {
    whiteRatingChange,
    blackRatingChange,
    whiteNewRating,
    blackNewRating,
  };
};
