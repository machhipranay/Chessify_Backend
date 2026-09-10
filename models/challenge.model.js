import mongoose, { Schema } from "mongoose";

const challengeSchema = new Schema(
  {
    // Who sent the challenge
    challenger: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Who must accept/decline
    challenged: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Challenge lifecycle
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "expired", "cancelled"],
      default: "pending",
    },

    // How this challenge was created
    gameType: {
      type: String,
      enum: ["invite", "matchmaking"],
      default: "matchmaking",
    },

    // Time control for the game if accepted
    maxTimePerMoveHours: {
      type: Number,
      default: 24,
      min: 1,
      max: 336,
    },

    // Linked game (set when challenge is accepted and game is created)
    game: {
      type: Schema.Types.ObjectId,
      ref: "Game",
      default: null,
    },

    // Auto-expire after this time
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

// Index for fast lookups of a user's pending challenges
challengeSchema.index({ challenged: 1, status: 1 });
challengeSchema.index({ challenger: 1, status: 1 });

// TTL index — MongoDB will automatically delete expired challenges after 24h past expiry
challengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model("Challenge", challengeSchema);
