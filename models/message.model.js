import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    // Soft delete flag — used by moderation to remove inappropriate messages
    // while preserving the report audit trail
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Index for fetching messages in a conversation (sorted by time)
messageSchema.index({ conversation: 1, createdAt: -1 });

export default mongoose.model("Message", messageSchema);