import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },

    email: {
      type: String,
    },

    password: {
      type: String,
      required: true,
    },

    isAdmin: {
      type: Boolean,
      default: false,
    },

    isBanned: {
      type: Boolean,
      default: false,
    },

    rating: {
      type: Number,
      default: 500,
    },

    package: {
      type: String,
      options: ["None", "Gold", "Platinum", "Diamond"],
      default: "None",
    },
  },
  { timestamp: true },
);

export default mongoose.model("User", userSchema);
