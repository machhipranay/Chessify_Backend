import mongoose, { Schema } from "mongoose";

const gameSchema = new Schema(
  {
    playerAsWhite: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    playerAsBlack: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Current board state in FEN notation
    fen: {
      type: String,
      default: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    },

    // Full game history in PGN notation
    pgn: {
      type: String,
      default: "",
    },

    // Individual moves list (e.g., ["e2e4", "e7e5"])
    moves: {
      type: [String],
      default: [],
    },

    // Game lifecycle status
    status: {
      type: String,
      enum: ["waiting", "active", "completed", "aborted"],
      default: "waiting",
    },

    // Game outcome
    result: {
      type: String,
      enum: ["white", "black", "draw", "ongoing"],
      default: "ongoing",
    },

    // Reason for the result
    resultReason: {
      type: String,
      enum: [
        "checkmate",
        "stalemate",
        "timeout",
        "resignation",
        "draw_agreement",
        "insufficient_material",
        "threefold_repetition",
        "fifty_move_rule",
        "aborted",
      ],
      default: null,
    },

    // How the game was created
    gameType: {
      type: String,
      enum: ["invite", "matchmaking"],
      default: "invite",
    },

    // Invite code for friend challenges (unique, sparse to allow nulls)
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
    },

    // Correspondence time control: hours allowed per move
    maxTimePerMoveHours: {
      type: Number,
      default: 24, // 1 day
      min: 1,
      max: 336, // 14 days
    },

    // Whose turn is it
    currentTurn: {
      type: String,
      enum: ["w", "b"],
      default: "w",
    },

    // When the current turn started (for timeout calculation)
    turnStartedAt: {
      type: Date,
      default: null,
    },

    // Player who offered a draw (null if no pending offer)
    drawOfferedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Per-player rating changes after game completion
    ratingChange: {
      white: {
        type: Number,
        default: 0,
      },
      black: {
        type: Number,
        default: 0,
      },
    },

    // Temporary in-game chat (cleared after game ends)
    gameChats: {
      type: [
        {
          sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
          },
          message: {
            type: String,
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

// Index for fast invite code lookups
gameSchema.index({ inviteCode: 1 }, { unique: true, sparse: true });

// Index for finding a player's active games
gameSchema.index({ playerAsWhite: 1, status: 1 });
gameSchema.index({ playerAsBlack: 1, status: 1 });

export default mongoose.model("Game", gameSchema);