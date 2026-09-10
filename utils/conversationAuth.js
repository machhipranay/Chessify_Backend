/**
 * Role-Based Authorization Middleware for Conversations
 *
 * Hierarchy:  creator (superAdmin) > admin > member
 *
 * These middleware functions check the requesting user's role
 * within a specific conversation before allowing access.
 *
 * Each middleware:
 *   1. Reads `conversationId` from req.params
 *   2. Looks up the user's role in the conversation's members array
 *   3. Sets `req.conversationRole` for downstream use
 *   4. Returns 403 if the user doesn't have the required role
 */

import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";

/**
 * Helper — find a user's role in a conversation
 *
 * @param {string} conversationId
 * @param {string} userId
 * @returns {{ conversation, memberEntry, role } | null}
 */
const findMemberRole = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return null;

  const memberEntry = conversation.members.find(
    (m) => m.user.toString() === userId.toString(),
  );

  if (!memberEntry) return null;

  return {
    conversation,
    memberEntry,
    role: memberEntry.role,
  };
};

/**
 * Require that the user is a member of the conversation (any role).
 * Roles allowed: creator, admin, member
 */
export const requireConversationMember = async (req, res, next) => {
  const { conversationId } = req.params;

  if (!conversationId) {
    return res.status(400).json({ success: false, error: "Conversation ID is required" });
  }

  const result = await findMemberRole(conversationId, req.userId);

  if (!result) {
    return res.status(403).json({
      success: false,
      error: "You are not a member of this conversation",
    });
  }

  req.conversation = result.conversation;
  req.conversationRole = result.role;
  next();
};

/**
 * Require that the user is an admin or creator of the conversation.
 * Roles allowed: creator, admin
 */
export const requireConversationAdmin = async (req, res, next) => {
  const { conversationId } = req.params;

  if (!conversationId) {
    return res.status(400).json({ success: false, error: "Conversation ID is required" });
  }

  const result = await findMemberRole(conversationId, req.userId);

  if (!result) {
    return res.status(403).json({
      success: false,
      error: "You are not a member of this conversation",
    });
  }

  if (result.role !== "creator" && result.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Only admins can perform this action",
    });
  }

  req.conversation = result.conversation;
  req.conversationRole = result.role;
  next();
};

/**
 * Require that the user is the creator of the conversation.
 * Roles allowed: creator only
 */
export const requireConversationCreator = async (req, res, next) => {
  const { conversationId } = req.params;

  if (!conversationId) {
    return res.status(400).json({ success: false, error: "Conversation ID is required" });
  }

  const result = await findMemberRole(conversationId, req.userId);

  if (!result) {
    return res.status(403).json({
      success: false,
      error: "You are not a member of this conversation",
    });
  }

  if (result.role !== "creator") {
    return res.status(403).json({
      success: false,
      error: "Only the group creator can perform this action",
    });
  }

  req.conversation = result.conversation;
  req.conversationRole = result.role;
  next();
};

/**
 * Require that the user is a platform admin (isAdmin: true on User model).
 * Used for report moderation, banning users, etc.
 */
export const requirePlatformAdmin = async (req, res, next) => {
  const user = await User.findById(req.userId).select("isAdmin");

  if (!user) {
    return res.status(404).json({ success: false, error: "User not found" });
  }

  if (!user.isAdmin) {
    return res.status(403).json({
      success: false,
      error: "Only platform administrators can perform this action",
    });
  }

  next();
};
