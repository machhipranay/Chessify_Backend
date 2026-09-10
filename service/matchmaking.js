import mongoose from "mongoose";
import Challenge from "../models/challenge.model.js";
import Game from "../models/game.model.js";
import User from "../models/user.model.js";

/**
 * Matchmaking rating tolerance — find opponents within this Elo range
 */
const ELO_RANGE = 150;

/**
 * Challenge expiry duration in hours
 */
const CHALLENGE_EXPIRY_HOURS = 24;

// ─── Find & Challenge ────────────────────────────────────────────────────────

/**
 * Find a random opponent within Elo range and create a pending challenge.
 *
 * Rules:
 * - Opponent must be within ±150 Elo of the challenger
 * - Opponent must not already have a pending challenge from this player
 * - Opponent must not be the same player
 * - Opponent must not be banned
 *
 * @param {string} playerId - ID of the player looking for a match
 * @param {number} maxTimePerMoveHours - Time control preference
 * @returns {object} The created challenge
 */
export const findAndChallenge = async (playerId, maxTimePerMoveHours = 24) => {
  const player = await User.findById(playerId);
  if (!player) throw new Error("Player not found");

  // Find existing pending challenges sent by this player
  const existingChallenges = await Challenge.find({
    challenger: playerId,
    status: "pending",
  }).select("challenged");

  const excludeIds = [
    playerId,
    ...existingChallenges.map((c) => c.challenged.toString()),
  ];

  // Find a random opponent within Elo range
  const ratingMin = player.rating - ELO_RANGE;
  const ratingMax = player.rating + ELO_RANGE;

  // Convert excludeIds to ObjectIds for the aggregation pipeline
  const excludeObjectIds = excludeIds.map((id) => new mongoose.Types.ObjectId(id));

  const opponents = await User.aggregate([
    {
      $match: {
        _id: { $nin: excludeObjectIds },
        isBanned: false,
        rating: { $gte: ratingMin, $lte: ratingMax },
      },
    },
    { $sample: { size: 1 } },
  ]);

  if (!opponents || opponents.length === 0) {
    throw new Error(
      "No available opponents found within your rating range. Please try again later.",
    );
  }

  const opponent = opponents[0];

  // Create the challenge
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + CHALLENGE_EXPIRY_HOURS);

  const challenge = await Challenge.create({
    challenger: playerId,
    challenged: opponent._id,
    gameType: "matchmaking",
    maxTimePerMoveHours,
    expiresAt,
  });

  // Populate for the response
  const populatedChallenge = await Challenge.findById(challenge._id)
    .populate("challenger", "username avatar rating")
    .populate("challenged", "username avatar rating");

  return populatedChallenge;
};

// ─── Respond to Challenge ────────────────────────────────────────────────────

/**
 * Accept or decline a challenge.
 * If accepted, a game is created with random color assignment.
 *
 * @param {string} challengeId
 * @param {string} playerId - Must be the challenged player
 * @param {boolean} accept
 */
export const respondToChallenge = async (challengeId, playerId, accept) => {
  const challenge = await Challenge.findById(challengeId);

  if (!challenge) throw new Error("Challenge not found");
  if (challenge.status !== "pending") throw new Error("Challenge is no longer pending");
  if (challenge.challenged.toString() !== playerId.toString()) {
    throw new Error("You are not the challenged player");
  }

  // Check if challenge has expired
  if (new Date() > new Date(challenge.expiresAt)) {
    challenge.status = "expired";
    await challenge.save();
    throw new Error("This challenge has expired");
  }

  if (!accept) {
    challenge.status = "declined";
    await challenge.save();
    return { message: "Challenge declined" };
  }

  // Accept — create a game
  const { white, black } = assignColors(
    challenge.challenger.toString(),
    challenge.challenged.toString(),
  );

  const game = await Game.create({
    playerAsWhite: white,
    playerAsBlack: black,
    gameType: "matchmaking",
    maxTimePerMoveHours: challenge.maxTimePerMoveHours,
    status: "active",
    currentTurn: "w",
    turnStartedAt: new Date(),
  });

  // Update challenge
  challenge.status = "accepted";
  challenge.game = game._id;
  await challenge.save();

  // Add game to both players' onGoingGames
  await User.updateMany(
    { _id: { $in: [white, black] } },
    { $addToSet: { onGoingGames: game._id } },
  );

  // Return populated game
  const populatedGame = await Game.findById(game._id)
    .populate("playerAsWhite", "username avatar rating")
    .populate("playerAsBlack", "username avatar rating");

  return {
    message: "Challenge accepted — game started!",
    game: populatedGame,
  };
};

// ─── Get Pending Challenges ──────────────────────────────────────────────────

/**
 * Get all pending challenges for a player (both sent and received)
 */
export const getPendingChallenges = async (playerId) => {
  // Expire old challenges first
  await expireOldChallenges();

  const [received, sent] = await Promise.all([
    Challenge.find({ challenged: playerId, status: "pending" })
      .populate("challenger", "username avatar rating")
      .sort({ createdAt: -1 }),
    Challenge.find({ challenger: playerId, status: "pending" })
      .populate("challenged", "username avatar rating")
      .sort({ createdAt: -1 }),
  ]);

  return { received, sent };
};

// ─── Cancel Challenge ────────────────────────────────────────────────────────

/**
 * Cancel a pending challenge (only the challenger can cancel)
 */
export const cancelChallenge = async (challengeId, playerId) => {
  const challenge = await Challenge.findById(challengeId);

  if (!challenge) throw new Error("Challenge not found");
  if (challenge.status !== "pending") throw new Error("Challenge is no longer pending");
  if (challenge.challenger.toString() !== playerId.toString()) {
    throw new Error("Only the challenger can cancel their challenge");
  }

  challenge.status = "cancelled";
  await challenge.save();

  return { message: "Challenge cancelled" };
};

// ─── Expire Old Challenges ───────────────────────────────────────────────────

/**
 * Mark challenges past their expiry date as expired.
 * Called lazily when fetching challenges.
 */
const expireOldChallenges = async () => {
  await Challenge.updateMany(
    {
      status: "pending",
      expiresAt: { $lt: new Date() },
    },
    { $set: { status: "expired" } },
  );
};

// ─── Helper ──────────────────────────────────────────────────────────────────

/**
 * Randomly assign two player IDs to white and black
 */
const assignColors = (player1Id, player2Id) => {
  if (Math.random() < 0.5) {
    return { white: player1Id, black: player2Id };
  }
  return { white: player2Id, black: player1Id };
};
