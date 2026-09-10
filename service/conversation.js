import { v4 as uuidv4 } from "uuid";
import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";

/**
 * Generate a short, unique 8-character invite code
 */
const generateCode = () => {
  return uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();
};

// ─── Create Direct (1-on-1) Conversation ─────────────────────────────────────

/**
 * Create a 1-on-1 conversation between two users.
 * If one already exists, return the existing conversation.
 */
export const createDirectConversation = async (userId, otherUserId) => {
  if (userId.toString() === otherUserId.toString()) {
    throw new Error("You cannot start a conversation with yourself");
  }

  // Check if the other user exists
  const otherUser = await User.findById(otherUserId);
  if (!otherUser) throw new Error("User not found");

  // Check if a 1-on-1 conversation already exists between these two users
  const existing = await Conversation.findOne({
    isGroup: false,
    $and: [
      { "members.user": userId },
      { "members.user": otherUserId },
    ],
    // Ensure it's exactly 2 members (a true 1-on-1)
    "members.1": { $exists: true },
    "members.2": { $exists: false },
  });

  if (existing) {
    const populated = await Conversation.findById(existing._id)
      .populate("members.user", "username avatar rating")
      .populate("lastMessage");
    return { conversation: populated, alreadyExists: true };
  }

  // Create new 1-on-1 conversation
  const conversation = await Conversation.create({
    members: [
      { user: userId, role: "member" },
      { user: otherUserId, role: "member" },
    ],
    isGroup: false,
  });

  const populated = await Conversation.findById(conversation._id)
    .populate("members.user", "username avatar rating");

  return { conversation: populated, alreadyExists: false };
};

// ─── Create Group Conversation ───────────────────────────────────────────────

/**
 * Create a group conversation.
 * The creator gets the "creator" role (superAdmin).
 * Additional members get the "member" role.
 */
export const createGroupConversation = async (creatorId, groupName, memberIds = []) => {
  // Build the members array — creator first
  const members = [{ user: creatorId, role: "creator" }];

  // Add additional members (deduplicated, excluding creator)
  const uniqueMembers = [...new Set(memberIds.map((id) => id.toString()))];

  for (const memberId of uniqueMembers) {
    if (memberId === creatorId.toString()) continue; // Skip if creator is in the list

    const user = await User.findById(memberId);
    if (!user) throw new Error(`User with ID ${memberId} not found`);

    members.push({ user: memberId, role: "member" });
  }

  const conversation = await Conversation.create({
    members,
    isGroup: true,
    groupName,
  });

  const populated = await Conversation.findById(conversation._id)
    .populate("members.user", "username avatar rating");

  return populated;
};

// ─── Get Conversation ────────────────────────────────────────────────────────

/**
 * Get a conversation's full details (members, roles, etc.)
 */
export const getConversation = async (conversationId) => {
  const conversation = await Conversation.findById(conversationId)
    .populate("members.user", "username avatar rating")
    .populate("lastMessage");

  if (!conversation) throw new Error("Conversation not found");

  return conversation;
};

// ─── Get User's Conversations ────────────────────────────────────────────────

/**
 * List all conversations a user is part of
 */
export const getUserConversations = async (userId) => {
  const conversations = await Conversation.find({
    "members.user": userId,
  })
    .populate("members.user", "username avatar rating")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

  return conversations;
};

// ─── Add Member ──────────────────────────────────────────────────────────────

/**
 * Add a member to a group conversation.
 * Only works for groups. The new member gets "member" role.
 */
export const addMember = async (conversationId, userIdToAdd) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new Error("Conversation not found");
  if (!conversation.isGroup) throw new Error("Cannot add members to a direct conversation");

  // Check if the user exists
  const user = await User.findById(userIdToAdd);
  if (!user) throw new Error("User not found");

  // Check if the user is already a member
  const isMember = conversation.members.some(
    (m) => m.user.toString() === userIdToAdd.toString(),
  );
  if (isMember) throw new Error("User is already a member of this group");

  conversation.members.push({ user: userIdToAdd, role: "member" });
  await conversation.save();

  const populated = await Conversation.findById(conversationId)
    .populate("members.user", "username avatar rating");

  return populated;
};

// ─── Remove Member ───────────────────────────────────────────────────────────

/**
 * Remove a member from a group conversation.
 *
 * Rules:
 * - No one can remove the creator
 * - Only the creator can remove admins
 * - Admins can remove regular members
 */
export const removeMember = async (conversationId, userIdToRemove, requesterId, requesterRole) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new Error("Conversation not found");
  if (!conversation.isGroup) throw new Error("Cannot remove members from a direct conversation");

  // Find the target member
  const targetMember = conversation.members.find(
    (m) => m.user.toString() === userIdToRemove.toString(),
  );
  if (!targetMember) throw new Error("User is not a member of this group");

  // Rule: No one can remove the creator
  if (targetMember.role === "creator") {
    throw new Error("The group creator cannot be removed");
  }

  // Rule: Only the creator can remove admins
  if (targetMember.role === "admin" && requesterRole !== "creator") {
    throw new Error("Only the group creator can remove admins");
  }

  // Remove the member
  conversation.members = conversation.members.filter(
    (m) => m.user.toString() !== userIdToRemove.toString(),
  );
  await conversation.save();

  return { message: "Member removed successfully" };
};

// ─── Change Role ─────────────────────────────────────────────────────────────

/**
 * Change a member's role in a group conversation.
 *
 * Rules:
 * - Cannot change the creator's role
 * - Only the creator can promote/demote admins
 * - Admins can promote members to admin
 */
export const changeRole = async (conversationId, targetUserId, newRole, requesterId, requesterRole) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new Error("Conversation not found");
  if (!conversation.isGroup) throw new Error("Cannot change roles in a direct conversation");

  // Find the target member
  const targetMember = conversation.members.find(
    (m) => m.user.toString() === targetUserId.toString(),
  );
  if (!targetMember) throw new Error("User is not a member of this group");

  // Rule: Cannot change the creator's role
  if (targetMember.role === "creator") {
    throw new Error("The creator's role cannot be changed");
  }

  // Rule: Only the creator can demote admins to member
  if (targetMember.role === "admin" && newRole === "member" && requesterRole !== "creator") {
    throw new Error("Only the group creator can demote admins");
  }

  // Rule: Setting role to "creator" is never allowed
  if (newRole === "creator") {
    throw new Error("Cannot assign creator role");
  }

  targetMember.role = newRole;
  await conversation.save();

  return { message: `Role changed to ${newRole} successfully` };
};

// ─── Generate Invite Code ────────────────────────────────────────────────────

/**
 * Generate a new invite code for a group conversation.
 * The code expires after 24 hours.
 */
export const generateInviteCode = async (conversationId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new Error("Conversation not found");
  if (!conversation.isGroup) throw new Error("Invite codes are only for group conversations");

  const inviteCode = generateCode();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  conversation.inviteCode = inviteCode;
  conversation.inviteCodeExpiresAt = expiresAt;
  await conversation.save();

  return {
    inviteCode,
    expiresAt,
  };
};

// ─── Join by Invite Code ─────────────────────────────────────────────────────

/**
 * Join a group conversation using an invite code.
 */
export const joinByInviteCode = async (inviteCode, userId) => {
  const conversation = await Conversation.findOne({
    inviteCode: inviteCode.toUpperCase(),
  });

  if (!conversation) throw new Error("Invalid invite code");

  // Check if the code has expired
  if (conversation.inviteCodeExpiresAt && new Date() > new Date(conversation.inviteCodeExpiresAt)) {
    // Clear the expired code
    conversation.inviteCode = null;
    conversation.inviteCodeExpiresAt = null;
    await conversation.save();
    throw new Error("This invite code has expired");
  }

  // Check if the user is already a member
  const isMember = conversation.members.some(
    (m) => m.user.toString() === userId.toString(),
  );
  if (isMember) throw new Error("You are already a member of this group");

  // Add the user as a member
  conversation.members.push({ user: userId, role: "member" });
  await conversation.save();

  const populated = await Conversation.findById(conversation._id)
    .populate("members.user", "username avatar rating");

  return populated;
};

// ─── Leave Conversation ──────────────────────────────────────────────────────

/**
 * Leave a conversation voluntarily.
 *
 * Rules:
 * - The creator cannot leave (must delete the group instead)
 * - For 1-on-1 chats, leaving effectively removes the user
 */
export const leaveConversation = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new Error("Conversation not found");

  const member = conversation.members.find(
    (m) => m.user.toString() === userId.toString(),
  );
  if (!member) throw new Error("You are not a member of this conversation");

  // Creator cannot leave — must delete the group
  if (member.role === "creator") {
    throw new Error("The group creator cannot leave. Delete the group instead.");
  }

  conversation.members = conversation.members.filter(
    (m) => m.user.toString() !== userId.toString(),
  );
  await conversation.save();

  return { message: "You have left the conversation" };
};

// ─── Delete Group ────────────────────────────────────────────────────────────

/**
 * Delete a group conversation (creator only).
 * This removes the conversation document entirely.
 */
export const deleteGroup = async (conversationId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new Error("Conversation not found");
  if (!conversation.isGroup) throw new Error("Cannot delete a direct conversation");

  await Conversation.findByIdAndDelete(conversationId);

  return { message: "Group deleted successfully" };
};
