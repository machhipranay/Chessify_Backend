import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";

// ─── Send Message ────────────────────────────────────────────────────────────

/**
 * Send a message in a conversation.
 * Updates the conversation's lastMessage reference.
 */
export const sendMessage = async (conversationId, senderId, content) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new Error("Conversation not found");

  // Verify sender is a member
  const isMember = conversation.members.some(
    (m) => m.user.toString() === senderId.toString(),
  );
  if (!isMember) throw new Error("You are not a member of this conversation");

  // Create the message
  const message = await Message.create({
    sender: senderId,
    content,
    conversation: conversationId,
  });

  // Update the conversation's lastMessage
  conversation.lastMessage = message._id;
  await conversation.save();

  // Return populated message
  const populated = await Message.findById(message._id)
    .populate("sender", "username avatar");

  return populated;
};

// ─── Get Messages ────────────────────────────────────────────────────────────

/**
 * Get paginated messages for a conversation.
 * Excludes soft-deleted messages.
 */
export const getMessages = async (conversationId, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;

  const messages = await Message.find({
    conversation: conversationId,
    isDeleted: false,
  })
    .populate("sender", "username avatar")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Message.countDocuments({
    conversation: conversationId,
    isDeleted: false,
  });

  return {
    messages: messages.reverse(), // Return in chronological order
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ─── Delete Message ──────────────────────────────────────────────────────────

/**
 * Soft-delete a message (sender can delete their own messages).
 */
export const deleteMessage = async (messageId, userId) => {
  const message = await Message.findById(messageId);
  if (!message) throw new Error("Message not found");

  if (message.sender.toString() !== userId.toString()) {
    throw new Error("You can only delete your own messages");
  }

  if (message.isDeleted) {
    throw new Error("Message is already deleted");
  }

  message.isDeleted = true;
  await message.save();

  return { message: "Message deleted successfully" };
};
