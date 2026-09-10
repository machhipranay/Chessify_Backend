/**
 * ═══════════════════════════════════════════════════════════════
 *  GAME ROUTES — /api/game
 * ═══════════════════════════════════════════════════════════════
 *
 *  Handles all chess game operations:
 *  - Game creation (invite friend or random matchmaking)
 *  - Joining games via invite code
 *  - Making moves (validated by chess.js)
 *  - Game actions (resign, draw offer/response)
 *  - In-game chat (temporary, cleared after game ends)
 *  - Challenge management (matchmaking accept/decline/cancel)
 *  - Game history and active games listing
 *
 *  Auth: ALL routes require JWT authentication via httpOnly cookies.
 *        The router.use(authMiddleware) at the top applies to every route.
 *
 *  Time Control: Correspondence chess — per-move time limits (1h to 14 days).
 *  Timeouts are checked lazily on each API call, not via background timers.
 *
 *  Note: Static routes (/my/active, /challenges) MUST be defined before
 *        parameterized routes (/:gameId) to prevent Express path conflicts.
 *
 * ═══════════════════════════════════════════════════════════════
 */

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

// Apply JWT auth to ALL game routes — no public endpoints
router.use(authMiddleware);

// ─── Game Management ─────────────────────────────────────────────────────────

// POST /api/game/create
// Create a new chess game
// Body: { gameType: "invite" | "matchmaking", maxTimePerMoveHours?: 1-336 }
//
// "invite"      → creates a waiting game with an 8-char invite code to share
// "matchmaking" → finds a random opponent within ±150 Elo and sends a challenge
router.post("/create", asyncHandler(createGame));

// POST /api/game/join/:inviteCode
// Join an existing game using its 8-character invite code
// Params: { inviteCode: "A1B2C3D4" }
//
// - Colors (white/black) are assigned randomly (50/50 probability)
// - Invite code is consumed after use (can't be reused)
// - Cannot join your own game
router.post("/join/:inviteCode", asyncHandler(joinByInvite));

// GET /api/game/my/active
// List all active and waiting games for the logged-in user
// Returns game state, opponent info, remaining time, etc.
router.get("/my/active", asyncHandler(myActiveGames));

// GET /api/game/my/history?page=1&limit=20
// List completed games for the logged-in user (paginated)
// Query: { page?: number, limit?: number }
router.get("/my/history", asyncHandler(myGameHistory));

// ─── Challenges / Matchmaking ────────────────────────────────────────────────

// GET /api/game/challenges
// List all pending challenges — both sent by you and received from others
// Returns: { received: [...], sent: [...] }
router.get("/challenges", asyncHandler(listChallenges));

// POST /api/game/challenge/:challengeId/respond
// Accept or decline a matchmaking challenge
// Params: { challengeId }
// Body: { accept: true | false }
//
// On accept: a game is created, colors assigned randomly, both players notified
// On decline: challenge is marked as declined
// Only the challenged player can respond
router.post("/challenge/:challengeId/respond", asyncHandler(challengeRespond));

// POST /api/game/challenge/:challengeId/cancel
// Cancel a pending challenge you sent
// Params: { challengeId }
// Only the original challenger can cancel
router.post("/challenge/:challengeId/cancel", asyncHandler(challengeCancel));

// ─── Game Actions (require :gameId in URL) ───────────────────────────────────
// IMPORTANT: These parameterized routes must come AFTER static routes above

// GET /api/game/:gameId
// Get the current state of a specific game
// Params: { gameId }
//
// Returns: FEN, PGN, moves, current turn, remaining time, draw offers, etc.
// Side effect: Lazily checks if the opponent has timed out. If they have,
//              the game is automatically ended with a timeout result.
router.get("/:gameId", asyncHandler(getGame));

// POST /api/game/:gameId/move
// Make a chess move in an active game
// Params: { gameId }
// Body: { from: "e2", to: "e4", promotion?: "q" }
//
// Flow:
// 1. Checks if opponent timed out (lazy timeout)
// 2. Verifies it's the requesting player's turn
// 3. Validates the move using chess.js engine
// 4. Updates FEN, PGN, and moves array
// 5. Checks for game-over (checkmate, stalemate, draw conditions)
// 6. If game continues: switches turn and resets opponent's move timer
// 7. If game over: calculates Elo changes and updates both players' ratings
router.post("/:gameId/move", asyncHandler(makeMove));

// POST /api/game/:gameId/resign
// Resign from the game — opponent wins automatically
// Params: { gameId }
//
// Triggers Elo recalculation and updates both players' stats
router.post("/:gameId/resign", asyncHandler(resign));

// POST /api/game/:gameId/draw/offer
// Offer a draw to the opponent
// Params: { gameId }
//
// Rules:
// - Only one pending draw offer allowed at a time
// - Draw offer is automatically cleared if a move is made
// - Checks for timeout before processing
router.post("/:gameId/draw/offer", asyncHandler(drawOffer));

// POST /api/game/:gameId/draw/respond
// Accept or decline an opponent's draw offer
// Params: { gameId }
// Body: { accept: true | false }
//
// On accept: game ends as draw, Elo recalculated (usually ±0)
// On decline: draw offer is cleared, game continues normally
router.post("/:gameId/draw/respond", asyncHandler(drawResponse));

// ─── In-Game Chat ────────────────────────────────────────────────────────────
// Temporary chat between the two players in a game
// Messages are stored in the game document and cleared when the game ends

// GET /api/game/:gameId/chat
// Get all chat messages for a specific game
// Params: { gameId }
// Only players in this game can read the chat
router.get("/:gameId/chat", asyncHandler(getChat));

// POST /api/game/:gameId/chat
// Send a chat message in a game
// Params: { gameId }
// Body: { message: "Good luck!" } — max 200 chars
// Only players in this game can send messages
router.post("/:gameId/chat", asyncHandler(sendChat));

export default router;
