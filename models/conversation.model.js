import mongoose, { Schema } from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    members: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      required: true,
    },

    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },

    isGroup: {
      type: Boolean,
      default: false,
    },

    groupAdmin: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    groupName: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Conversation", conversationSchema);