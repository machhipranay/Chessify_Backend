import e from "express";
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

    avatar : {
      type: String,
      default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
    },

    about: {
      type : String,
      default: "",
    },

    isAdmin: {
      type: Boolean,
      default: false,
    },

    isBanned: {
      type: Boolean,
      default: false,
    },

    country :{
      type: String,
      enum: ["India", "USA", "UK", "Germany", "France", "Russia", "China", "Japan", "Other"],
      default: "India",
    },

    followers: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },

    rating: {
      type: Number,
      default: 500,
    },

    status: {
      type: String,
      options: ["None", "Gold", "Platinum", "Diamond"],
      default: "None",
    },
  },
  { timestamp: true },
);

export default mongoose.model("User", userSchema);