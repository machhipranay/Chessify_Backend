import { Router } from "express";
import {
  createGame,
  joinByInvite,
  makeMove,
  getGame,
  resign,
  drawOffer,
  drawResponse,
  sendChat,
  getChat,
  myActiveGames,
  myGameHistory,
  listChallenges,
  challengeRespond,
  challengeCancel,
} from "../controller/game.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authMiddleware } from "../utils/jwt.auth.js";

const router = Router();

// All game routes require authentication
router.use(authMiddleware);

// ─── Game Management ─────────────────────────────────────────────────────────

// Create a game (invite or matchmaking)
router.post("/create", asyncHandler(createGame));

// Join a game via invite code
router.post("/join/:inviteCode", asyncHandler(joinByInvite));

// Get player's active games
router.get("/my/active", asyncHandler(myActiveGames));

// Get player's game history (paginated)
router.get("/my/history", asyncHandler(myGameHistory));

// ─── Challenges / Matchmaking ────────────────────────────────────────────────

// List pending challenges (sent & received)
router.get("/challenges", asyncHandler(listChallenges));

// Respond to a challenge (accept/decline)
router.post("/challenge/:challengeId/respond", asyncHandler(challengeRespond));

// Cancel a challenge
router.post("/challenge/:challengeId/cancel", asyncHandler(challengeCancel));

// ─── Game Actions (require gameId) ───────────────────────────────────────────

// Get game state
router.get("/:gameId", asyncHandler(getGame));

// Make a move
router.post("/:gameId/move", asyncHandler(makeMove));

// Resign
router.post("/:gameId/resign", asyncHandler(resign));

// Offer a draw
router.post("/:gameId/draw/offer", asyncHandler(drawOffer));

// Respond to a draw offer
router.post("/:gameId/draw/respond", asyncHandler(drawResponse));

// ─── In-Game Chat ────────────────────────────────────────────────────────────

// Get chat messages
router.get("/:gameId/chat", asyncHandler(getChat));

// Send a chat message
router.post("/:gameId/chat", asyncHandler(sendChat));

export default router;
