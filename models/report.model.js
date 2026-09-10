import mongoose, { Schema } from "mongoose";

const reportSchema = new Schema(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    messageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },

    // Reference to the conversation for easier admin lookup
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    reportReason: {
      type: String,
      enum: ["spam", "abuse", "hate", "violence", "sexual", "other"],
      required: true,
    },

    description: {
      type: String,
    },

    status: {
      type: String,
      enum: ["pending", "resolved", "rejected"],
      default: "pending",
    },

    // Which platform admin handled this report
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Index for fetching pending reports
reportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Report", reportSchema);