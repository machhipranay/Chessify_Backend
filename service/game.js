import { Chess } from "chess.js";
import { v4 as uuidv4 } from "uuid";
import Game from "../models/game.model.js";
import User from "../models/user.model.js";
import { calculateElo } from "../utils/elo.js";
import { checkTimeout, getRemainingTime } from "../utils/timeoutChecker.js";
import { withTransaction } from "../utils/mongo.transaction.js";

/**
 * Generate a short, unique 8-character invite code
 */
const generateInviteCode = () => {
  return uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();
};

/**
 * Randomly assign two players to white and black (50/50 probability)
 */
const assignColors = (player1Id, player2Id) => {
  if (Math.random() < 0.5) {
    return { white: player1Id, black: player2Id };
  }
  return { white: player2Id, black: player1Id };
};

// ─── Game Creation ───────────────────────────────────────────────────────────

/**
 * Create a game with an invite code for friend challenges
 * The creator waits for someone to join via the invite code.
 */
export const createInviteGame = async (creatorId, maxTimePerMoveHours = 24) => {
  const inviteCode = generateInviteCode();

  const game = await Game.create({
    gameType: "invite",
    inviteCode,
    maxTimePerMoveHours,
    status: "waiting",
    // Creator is stored temporarily as white; colors reassigned when opponent joins
    playerAsWhite: creatorId,
  });

  return {
    gameId: game._id,
    inviteCode: game.inviteCode,
    maxTimePerMoveHours: game.maxTimePerMoveHours,
  };
};

// ─── Join by Invite ──────────────────────────────────────────────────────────

/**
 * Join a game using an invite code.
 * Assigns both players randomly to white/black and starts the game.
 */
export const joinGameByInvite = async (inviteCode, playerId) => {
  const game = await Game.findOne({ inviteCode, status: "waiting" });

  if (!game) {
    throw new Error("Invalid invite code or game is no longer available");
  }

  // Can't join your own game
  const creatorId = game.playerAsWhite.toString();
  if (creatorId === playerId.toString()) {
    throw new Error("You cannot join your own game");
  }

  // Randomly assign colors
  const { white, black } = assignColors(creatorId, playerId);

  game.playerAsWhite = white;
  game.playerAsBlack = black;
  game.status = "active";
  game.currentTurn = "w";
  game.turnStartedAt = new Date();
  game.inviteCode = null; // Consumed; no longer valid

  await game.save();

  // Add game to both players' onGoingGames
  await User.updateMany(
    { _id: { $in: [white, black] } },
    { $addToSet: { onGoingGames: game._id } },
  );

  return game;
};

// ─── Move Processing ─────────────────────────────────────────────────────────

/**
 * Process a chess move.
 *
 * Flow:
 * 1. Check timeout (lazy)
 * 2. Verify it's this player's turn
 * 3. Validate the move via chess.js
 * 4. Update FEN, PGN, moves list
 * 5. Check for game over (checkmate/stalemate/draw)
 * 6. Switch turn and reset timer
 */
export const processMove = async (gameId, playerId, move) => {
  const game = await Game.findById(gameId);
  if (!game) throw new Error("Game not found");
  if (game.status !== "active") throw new Error("Game is not active");

  // 1. Check timeout
  const { timedOut, timedOutPlayer } = checkTimeout(game);
  if (timedOut) {
    return await handleTimeout(game, timedOutPlayer);
  }

  // 2. Verify turn
  const isWhite = game.playerAsWhite.toString() === playerId.toString();
  const isBlack = game.playerAsBlack.toString() === playerId.toString();

  if (!isWhite && !isBlack) {
    throw new Error("You are not a player in this game");
  }

  const playerColor = isWhite ? "w" : "b";
  if (game.currentTurn !== playerColor) {
    throw new Error("It is not your turn");
  }

  // 3. Validate move via chess.js
  const chess = new Chess(game.fen);

  let result;
  try {
    result = chess.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion || undefined,
    });
  } catch (err) {
    throw new Error("Illegal move");
  }

  if (!result) {
    throw new Error("Illegal move");
  }

  // 4. Update game state
  game.fen = chess.fen();
  game.pgn = chess.pgn();
  game.moves.push(`${move.from}${move.to}${move.promotion || ""}`);

  // Clear any pending draw offer when a move is made
  game.drawOfferedBy = null;

  // 5. Check for game over conditions
  if (chess.isCheckmate()) {
    return await finalizeGame(game, playerColor === "w" ? "white" : "black", "checkmate");
  }

  if (chess.isStalemate()) {
    return await finalizeGame(game, "draw", "stalemate");
  }

  if (chess.isDraw()) {
    // chess.js checks insufficient material, threefold repetition, 50-move rule
    let reason = "draw_agreement";
    if (chess.isInsufficientMaterial()) reason = "insufficient_material";
    else if (chess.isThreefoldRepetition()) reason = "threefold_repetition";
    else reason = "fifty_move_rule";
    return await finalizeGame(game, "draw", reason);
  }

  // 6. Switch turn and reset timer
  game.currentTurn = playerColor === "w" ? "b" : "w";
  game.turnStartedAt = new Date();

  await game.save();

  return {
    game: formatGameResponse(game, playerId),
    moveResult: {
      from: result.from,
      to: result.to,
      piece: result.piece,
      captured: result.captured || null,
      promotion: result.promotion || null,
      san: result.san,
      isCheck: chess.isCheck(),
    },
    gameOver: false,
  };
};

// ─── Timeout Handling ────────────────────────────────────────────────────────

/**
 * Handle a timeout — the timed-out player loses
 */
const handleTimeout = async (game, timedOutPlayer) => {
  const winner = timedOutPlayer === "w" ? "black" : "white";
  return await finalizeGame(game, winner, "timeout");
};

// ─── Draw Offers ─────────────────────────────────────────────────────────────

/**
 * Offer a draw to the opponent
 */
export const offerDraw = async (gameId, playerId) => {
  const game = await Game.findById(gameId);
  if (!game) throw new Error("Game not found");
  if (game.status !== "active") throw new Error("Game is not active");

  // Verify player is in this game
  const isWhite = game.playerAsWhite.toString() === playerId.toString();
  const isBlack = game.playerAsBlack.toString() === playerId.toString();
  if (!isWhite && !isBlack) throw new Error("You are not a player in this game");

  // Can't offer draw if one is already pending
  if (game.drawOfferedBy) {
    throw new Error("A draw offer is already pending");
  }

  // Check timeout first
  const { timedOut, timedOutPlayer } = checkTimeout(game);
  if (timedOut) {
    return await handleTimeout(game, timedOutPlayer);
  }

  game.drawOfferedBy = playerId;
  await game.save();

  return { message: "Draw offer sent", gameId: game._id };
};

/**
 * Respond to a draw offer (accept or decline)
 */
export const respondToDraw = async (gameId, playerId, accept) => {
  const game = await Game.findById(gameId);
  if (!game) throw new Error("Game not found");
  if (game.status !== "active") throw new Error("Game is not active");

  // Verify player is in this game
  const isWhite = game.playerAsWhite.toString() === playerId.toString();
  const isBlack = game.playerAsBlack.toString() === playerId.toString();
  if (!isWhite && !isBlack) throw new Error("You are not a player in this game");

  // Must have a pending draw offer
  if (!game.drawOfferedBy) {
    throw new Error("No draw offer to respond to");
  }

  // Can't respond to your own draw offer
  if (game.drawOfferedBy.toString() === playerId.toString()) {
    throw new Error("You cannot respond to your own draw offer");
  }

  // Check timeout first
  const { timedOut, timedOutPlayer } = checkTimeout(game);
  if (timedOut) {
    return await handleTimeout(game, timedOutPlayer);
  }

  if (accept) {
    return await finalizeGame(game, "draw", "draw_agreement");
  }

  // Decline — clear the draw offer
  game.drawOfferedBy = null;
  await game.save();

  return { message: "Draw offer declined", gameId: game._id };
};

// ─── Resignation ─────────────────────────────────────────────────────────────

/**
 * Player resigns the game — opponent wins
 */
export const resignGame = async (gameId, playerId) => {
  const game = await Game.findById(gameId);
  if (!game) throw new Error("Game not found");
  if (game.status !== "active") throw new Error("Game is not active");

  const isWhite = game.playerAsWhite.toString() === playerId.toString();
  const isBlack = game.playerAsBlack.toString() === playerId.toString();
  if (!isWhite && !isBlack) throw new Error("You are not a player in this game");

  const winner = isWhite ? "black" : "white";
  return await finalizeGame(game, winner, "resignation");
};

// ─── Game State ──────────────────────────────────────────────────────────────

/**
 * Get the current game state (checks timeout lazily)
 */
export const getGameState = async (gameId, playerId) => {
  const game = await Game.findById(gameId)
    .populate("playerAsWhite", "username avatar rating")
    .populate("playerAsBlack", "username avatar rating");

  if (!game) throw new Error("Game not found");

  // Verify player has access to this game
  const isWhite = game.playerAsWhite?._id.toString() === playerId.toString();
  const isBlack = game.playerAsBlack?._id.toString() === playerId.toString();
  if (!isWhite && !isBlack) throw new Error("You are not a player in this game");

  // Lazy timeout check for active games
  if (game.status === "active") {
    const { timedOut, timedOutPlayer } = checkTimeout(game);
    if (timedOut) {
      const result = await handleTimeout(game, timedOutPlayer);
      // Re-fetch the updated game with populated fields
      const updatedGame = await Game.findById(gameId)
        .populate("playerAsWhite", "username avatar rating")
        .populate("playerAsBlack", "username avatar rating");
      return formatGameResponse(updatedGame, playerId);
    }
  }

  return formatGameResponse(game, playerId);
};

// ─── Chat ────────────────────────────────────────────────────────────────────

/**
 * Send a chat message in an active game
 */
export const sendChatMessage = async (gameId, playerId, message) => {
  const game = await Game.findById(gameId);
  if (!game) throw new Error("Game not found");
  if (game.status !== "active") throw new Error("Game is not active");

  const isWhite = game.playerAsWhite.toString() === playerId.toString();
  const isBlack = game.playerAsBlack.toString() === playerId.toString();
  if (!isWhite && !isBlack) throw new Error("You are not a player in this game");

  game.gameChats.push({
    sender: playerId,
    message,
    timestamp: new Date(),
  });

  await game.save();

  return {
    sender: playerId,
    message,
    timestamp: new Date(),
  };
};

/**
 * Get all chat messages for a game
 */
export const getChatMessages = async (gameId, playerId) => {
  const game = await Game.findById(gameId)
    .populate("gameChats.sender", "username avatar");

  if (!game) throw new Error("Game not found");

  const isWhite = game.playerAsWhite.toString() === playerId.toString();
  const isBlack = game.playerAsBlack.toString() === playerId.toString();
  if (!isWhite && !isBlack) throw new Error("You are not a player in this game");

  return game.gameChats;
};

// ─── Player's Games ──────────────────────────────────────────────────────────

/**
 * Get all active games for a player
 */
export const getActiveGames = async (playerId) => {
  const games = await Game.find({
    $or: [{ playerAsWhite: playerId }, { playerAsBlack: playerId }],
    status: { $in: ["active", "waiting"] },
  })
    .populate("playerAsWhite", "username avatar rating")
    .populate("playerAsBlack", "username avatar rating")
    .sort({ updatedAt: -1 });

  return games.map((game) => formatGameResponse(game, playerId));
};

/**
 * Get completed game history for a player
 */
export const getGameHistory = async (playerId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const games = await Game.find({
    $or: [{ playerAsWhite: playerId }, { playerAsBlack: playerId }],
    status: "completed",
  })
    .populate("playerAsWhite", "username avatar rating")
    .populate("playerAsBlack", "username avatar rating")
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Game.countDocuments({
    $or: [{ playerAsWhite: playerId }, { playerAsBlack: playerId }],
    status: "completed",
  });

  return {
    games: games.map((game) => formatGameResponse(game, playerId)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ─── Game Finalization ───────────────────────────────────────────────────────

/**
 * Finalize a game — set result, calculate Elo, update player stats
 */
const finalizeGame = async (game, result, reason) => {
  // Fetch both players for Elo calculation
  const [whitePlayer, blackPlayer] = await Promise.all([
    User.findById(game.playerAsWhite),
    User.findById(game.playerAsBlack),
  ]);

  if (!whitePlayer || !blackPlayer) {
    throw new Error("Could not find game players");
  }

  // Calculate Elo changes
  const eloResult = calculateElo({
    whiteRating: whitePlayer.rating,
    blackRating: blackPlayer.rating,
    whiteGamesPlayed: whitePlayer.gamesPlayed,
    blackGamesPlayed: blackPlayer.gamesPlayed,
    result,
  });

  // Update game document
  game.status = "completed";
  game.result = result;
  game.resultReason = reason;
  game.ratingChange = {
    white: eloResult.whiteRatingChange,
    black: eloResult.blackRatingChange,
  };
  game.drawOfferedBy = null;
  game.gameChats = []; // Clear temporary game chats

  await game.save();

  // Update both players' stats atomically
  const whiteStatUpdate = {
    $inc: { gamesPlayed: 1 },
    $pull: { onGoingGames: game._id },
    $push: { gameHistory: game._id },
    $set: { rating: eloResult.whiteNewRating },
  };

  const blackStatUpdate = {
    $inc: { gamesPlayed: 1 },
    $pull: { onGoingGames: game._id },
    $push: { gameHistory: game._id },
    $set: { rating: eloResult.blackNewRating },
  };

  if (result === "white") {
    whiteStatUpdate.$inc.wins = 1;
    blackStatUpdate.$inc.losses = 1;
  } else if (result === "black") {
    whiteStatUpdate.$inc.losses = 1;
    blackStatUpdate.$inc.wins = 1;
  } else {
    whiteStatUpdate.$inc.draws = 1;
    blackStatUpdate.$inc.draws = 1;
  }

  await Promise.all([
    User.findByIdAndUpdate(game.playerAsWhite, whiteStatUpdate),
    User.findByIdAndUpdate(game.playerAsBlack, blackStatUpdate),
  ]);

  return {
    gameOver: true,
    result,
    reason,
    ratingChange: {
      white: eloResult.whiteRatingChange,
      black: eloResult.blackRatingChange,
    },
    newRatings: {
      white: eloResult.whiteNewRating,
      black: eloResult.blackNewRating,
    },
  };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Format a game document for API response
 */
const formatGameResponse = (game, playerId) => {
  const isWhite = game.playerAsWhite?._id
    ? game.playerAsWhite._id.toString() === playerId.toString()
    : game.playerAsWhite?.toString() === playerId.toString();

  return {
    gameId: game._id,
    status: game.status,
    gameType: game.gameType,
    fen: game.fen,
    pgn: game.pgn,
    moves: game.moves,
    currentTurn: game.currentTurn,
    result: game.result,
    resultReason: game.resultReason,
    maxTimePerMoveHours: game.maxTimePerMoveHours,
    remainingTimeMs: getRemainingTime(game),
    drawOfferedBy: game.drawOfferedBy,
    ratingChange: game.ratingChange,
    inviteCode: game.inviteCode,
    myColor: isWhite ? "white" : "black",
    white: game.playerAsWhite,
    black: game.playerAsBlack,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
  };
};
