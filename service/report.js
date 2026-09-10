import Report from "../models/report.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";

// ─── Report a Message ────────────────────────────────────────────────────────

/**
 * Report a message as inappropriate.
 *
 * Validates that:
 * - The message exists and isn't already deleted
 * - The reporter is a member of the conversation
 * - The reporter hasn't already reported this message
 * - The reporter isn't reporting their own message
 */
export const reportMessage = async (reporterId, messageId, reportReason, description) => {
  // Find the message
  const message = await Message.findById(messageId);
  if (!message) throw new Error("Message not found");
  if (message.isDeleted) throw new Error("This message has already been deleted");

  // Can't report your own message
  if (message.sender.toString() === reporterId.toString()) {
    throw new Error("You cannot report your own message");
  }

  // Verify reporter is a member of the conversation
  const conversation = await Conversation.findById(message.conversation);
  if (!conversation) throw new Error("Conversation not found");

  const isMember = conversation.members.some(
    (m) => m.user.toString() === reporterId.toString(),
  );
  if (!isMember) throw new Error("You are not a member of this conversation");

  // Check for duplicate report
  const existingReport = await Report.findOne({
    reporter: reporterId,
    messageId,
    status: "pending",
  });
  if (existingReport) throw new Error("You have already reported this message");

  // Create the report
  const report = await Report.create({
    reporter: reporterId,
    messageId,
    conversation: message.conversation,
    reportReason,
    description: description || undefined,
  });

  return report;
};

// ─── Get Pending Reports ─────────────────────────────────────────────────────

/**
 * Get all pending reports for platform admins to review.
 * Paginated, sorted by newest first.
 */
export const getPendingReports = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const reports = await Report.find({ status: "pending" })
    .populate("reporter", "username avatar")
    .populate({
      path: "messageId",
      select: "sender content createdAt isDeleted",
      populate: { path: "sender", select: "username avatar" },
    })
    .populate("conversation", "groupName isGroup")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Report.countDocuments({ status: "pending" });

  return {
    reports,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ─── Resolve Report ──────────────────────────────────────────────────────────

/**
 * Resolve or reject a report.
 *
 * If "resolve" (message was inappropriate):
 *   1. Soft-delete the reported message
 *   2. Permanently ban the message sender
 *   3. Mark report as "resolved"
 *
 * If "reject" (message was not inappropriate):
 *   1. Mark report as "rejected"
 */
export const resolveReport = async (reportId, adminId, action) => {
  const report = await Report.findById(reportId);
  if (!report) throw new Error("Report not found");
  if (report.status !== "pending") throw new Error("Report has already been handled");

  if (action === "resolve") {
    // Get the reported message
    const message = await Message.findById(report.messageId);
    if (!message) throw new Error("Reported message not found");

    // 1. Soft-delete the message
    message.isDeleted = true;
    await message.save();

    // 2. Permanently ban the sender
    const sender = await User.findById(message.sender);
    if (sender) {
      sender.isBanned = true;
      await sender.save();
    }

    // 3. Mark report as resolved
    report.status = "resolved";
    report.resolvedBy = adminId;
    await report.save();

    return {
      message: "Report resolved — message deleted and sender banned",
      bannedUser: sender ? sender.username : "unknown",
    };
  }

  if (action === "reject") {
    report.status = "rejected";
    report.resolvedBy = adminId;
    await report.save();

    return { message: "Report rejected — no action taken" };
  }

  throw new Error("Invalid action. Use 'resolve' or 'reject'");
};
