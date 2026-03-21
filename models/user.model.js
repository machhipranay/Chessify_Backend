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

    isVerifiedEmail : {
      type: Boolean,
      default: false
    },

    password: {
      type: String,
      required: true,
    },

    about: {
      type: String,
      default: "",
    },

    avatar: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
    },

    rating: {
      type: Number,
      default: 500,
    },

    titles: {
      type: [String],
      default: [],
    },

    isAdmin: {
      type: Boolean,
      default: false,
    },

    onGoingGames: {
      type: [Schema.Types.ObjectId],
      ref: "Game",
      default: [],
    },

    isBanned: {
      type: Boolean,
      default: false,
    },

    country: {
      type: String,
      enum: [
        "India",
        "USA",
        "UK",
        "Germany",
        "France",
        "Russia",
        "China",
        "Japan",
        "Other",
      ],
      default: "Other",
    },

    followers: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },

    friends: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },

    status: {
      type: String,
      options: ["None", "Gold", "Platinum", "Diamond"],
      default: "None",
    },

    refreshToken: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);