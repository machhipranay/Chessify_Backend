import mongoose, { Schema } from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    // Role-aware member list
    members: {
      type: [
        {
          user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          role: {
            type: String,
            enum: ["creator", "admin", "member"],
            default: "member",
          },
        },
      ],
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

    groupName: {
      type: String,
      default: "",
    },

    // Invite code for groups (null for 1-on-1 chats)
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
    },

    // When the invite code expires
    inviteCodeExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Index for fast lookups of a user's conversations
conversationSchema.index({ "members.user": 1 });

// Index for invite code lookups
conversationSchema.index({ inviteCode: 1 }, { unique: true, sparse: true });

export default mongoose.model("Conversation", conversationSchema);