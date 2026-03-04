import mongoose , { Schema } from "mongoose";

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

    result: {
        type: String,
        enum: ["white", "black", "draw"],
        default: "draw",
    },

    moves: {
        type: [String],
        default: [],
    },

    changeInRating: {
        type: Number,
        default: 0,
    },
  },
  { timestamp: true },
);

export default mongoose.model("Game", gameSchema);