import mongoose, { Schema } from "mongoose";

const reportSchema = new Schema({
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
});

export default mongoose.model("Report", reportSchema);