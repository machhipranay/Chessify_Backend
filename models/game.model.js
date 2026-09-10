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

    winner: {
      type: String,
      enum: ["white", "black", "draw", "onGoing"],
    },

    moves: {
      type: [String],
      default: [],
    },

    changeInRating: {
      type: Number,
      default: 0,
    },

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
        },
      ],
      default: [],
    },
  },
  { timestamp: true },
);

export default mongoose.model("Game", gameSchema);