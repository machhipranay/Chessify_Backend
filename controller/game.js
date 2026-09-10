import { responceHandler } from "../utils/responceHandler.js";
import {
  createInviteGame,
  joinGameByInvite,
  processMove,
  offerDraw,
  respondToDraw,
  resignGame,
  getGameState,
  sendChatMessage,
  getChatMessages,
  getActiveGames,
  getGameHistory,
} from "../service/game.js";
import {
  findAndChallenge,
  respondToChallenge,
  getPendingChallenges,
  cancelChallenge,
} from "../service/matchmaking.js";
import {
  createGameSchema,
  moveSchema,
  chatMessageSchema,
  challengeResponseSchema,
} from "../validation/game.js";

// ─── Game Creation ───────────────────────────────────────────────────────────

/**
 * POST /api/game/create
 * Create a new game (invite or matchmaking)
 *
 * Body: { gameType: "invite" | "matchmaking", maxTimePerMoveHours?: number }
 */
export const createGame = async (req, res) => {
  const { error } = createGameSchema.validate(req.body);
  if (error) return responceHandler(res, 400, error.details[0].message);

  const { gameType, maxTimePerMoveHours } = req.body;
  const playerId = req.userId;

  if (gameType === "invite") {
    const result = await createInviteGame(playerId, maxTimePerMoveHours);
    return responceHandler(res, 201, "Game created. Share the invite code with your friend.", result);
  }

  if (gameType === "matchmaking") {
    const challenge = await findAndChallenge(playerId, maxTimePerMoveHours);
    return responceHandler(res, 201, "Challenge sent to a random opponent. Waiting for their response.", challenge);
  }

  return responceHandler(res, 400, "Invalid game type");
};

// ─── Join Game by Invite ─────────────────────────────────────────────────────

/**
 * POST /api/game/join/:inviteCode
 * Join a game using an invite code
 */
export const joinByInvite = async (req, res) => {
  const { inviteCode } = req.params;

  if (!inviteCode || inviteCode.length !== 8) {
    return responceHandler(res, 400, "Invalid invite code format");
  }

  const game = await joinGameByInvite(inviteCode.toUpperCase(), req.userId);
  return responceHandler(res, 200, "Joined game successfully. Game is now active!", game);
};

// ─── Make a Move ─────────────────────────────────────────────────────────────

/**
 * POST /api/game/:gameId/move
 * Make a chess move
 *
 * Body: { from: "e2", to: "e4", promotion?: "q" }
 */
export const makeMove = async (req, res) => {
  const { error } = moveSchema.validate(req.body);
  if (error) return responceHandler(res, 400, error.details[0].message);

  const { gameId } = req.params;
  const result = await processMove(gameId, req.userId, req.body);

  if (result.gameOver) {
    return responceHandler(res, 200, `Game over — ${result.reason}`, result);
  }

  return responceHandler(res, 200, "Move made successfully", result);
};

// ─── Get Game State ──────────────────────────────────────────────────────────

/**
 * GET /api/game/:gameId
 * Get current game state (checks timeout lazily)
 */
export const getGame = async (req, res) => {
  const { gameId } = req.params;
  const game = await getGameState(gameId, req.userId);
  return responceHandler(res, 200, "Game state retrieved", game);
};

// ─── Resign ──────────────────────────────────────────────────────────────────

/**
 * POST /api/game/:gameId/resign
 * Resign the current game
 */
export const resign = async (req, res) => {
  const { gameId } = req.params;
  const result = await resignGame(gameId, req.userId);
  return responceHandler(res, 200, "You resigned. Game over.", result);
};

// ─── Draw Offer ──────────────────────────────────────────────────────────────

/**
 * POST /api/game/:gameId/draw/offer
 * Offer a draw to the opponent
 */
export const drawOffer = async (req, res) => {
  const { gameId } = req.params;
  const result = await offerDraw(gameId, req.userId);

  if (result.gameOver) {
    return responceHandler(res, 200, "Game over — timeout", result);
  }

  return responceHandler(res, 200, "Draw offer sent", result);
};

/**
 * POST /api/game/:gameId/draw/respond
 * Accept or decline a draw offer
 *
 * Body: { accept: true | false }
 */
export const drawResponse = async (req, res) => {
  const { error } = challengeResponseSchema.validate(req.body);
  if (error) return responceHandler(res, 400, error.details[0].message);

  const { gameId } = req.params;
  const { accept } = req.body;
  const result = await respondToDraw(gameId, req.userId, accept);

  if (result.gameOver) {
    return responceHandler(res, 200, "Game over — draw agreed", result);
  }

  return responceHandler(res, 200, result.message, result);
};

// ─── Chat ────────────────────────────────────────────────────────────────────

/**
 * POST /api/game/:gameId/chat
 * Send a chat message in a game
 */
export const sendChat = async (req, res) => {
  const { error } = chatMessageSchema.validate(req.body);
  if (error) return responceHandler(res, 400, error.details[0].message);

  const { gameId } = req.params;
  const result = await sendChatMessage(gameId, req.userId, req.body.message);
  return responceHandler(res, 201, "Message sent", result);
};

/**
 * GET /api/game/:gameId/chat
 * Get all chat messages for a game
 */
export const getChat = async (req, res) => {
  const { gameId } = req.params;
  const messages = await getChatMessages(gameId, req.userId);
  return responceHandler(res, 200, "Chat messages retrieved", messages);
};

// ─── My Games ────────────────────────────────────────────────────────────────

/**
 * GET /api/game/my/active
 * Get all active/waiting games for the logged-in user
 */
export const myActiveGames = async (req, res) => {
  const games = await getActiveGames(req.userId);
  return responceHandler(res, 200, "Active games retrieved", games);
};

/**
 * GET /api/game/my/history
 * Get completed game history for the logged-in user
 *
 * Query: ?page=1&limit=20
 */
export const myGameHistory = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const result = await getGameHistory(req.userId, page, limit);
  return responceHandler(res, 200, "Game history retrieved", result);
};

// ─── Matchmaking / Challenges ────────────────────────────────────────────────

/**
 * GET /api/game/challenges
 * List all pending challenges (sent and received)
 */
export const listChallenges = async (req, res) => {
  const challenges = await getPendingChallenges(req.userId);
  return responceHandler(res, 200, "Challenges retrieved", challenges);
};

/**
 * POST /api/game/challenge/:challengeId/respond
 * Accept or decline a challenge
 *
 * Body: { accept: true | false }
 */
export const challengeRespond = async (req, res) => {
  const { error } = challengeResponseSchema.validate(req.body);
  if (error) return responceHandler(res, 400, error.details[0].message);

  const { challengeId } = req.params;
  const { accept } = req.body;
  const result = await respondToChallenge(challengeId, req.userId, accept);

  if (accept) {
    return responceHandler(res, 200, result.message, result);
  }

  return responceHandler(res, 200, result.message);
};

/**
 * POST /api/game/challenge/:challengeId/cancel
 * Cancel a pending challenge (only the challenger can cancel)
 */
export const challengeCancel = async (req, res) => {
  const { challengeId } = req.params;
  const result = await cancelChallenge(challengeId, req.userId);
  return responceHandler(res, 200, result.message);
};
