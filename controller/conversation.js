import { responceHandler } from "../utils/responceHandler.js";
import {
  createDirectConversation,
  createGroupConversation,
  getConversation,
  getUserConversations,
  addMember,
  removeMember,
  changeRole,
  generateInviteCode,
  joinByInviteCode,
  leaveConversation,
  deleteGroup,
} from "../service/conversation.js";
import {
  createGroupSchema,
  create1on1Schema,
  addMemberSchema,
  removeMemberSchema,
  changeRoleSchema,
} from "../validation/conversation.js";

// ─── Create Direct Conversation ──────────────────────────────────────────────

/**
 * POST /api/chat/direct
 * Create a 1-on-1 conversation with another user
 *
 * Body: { userId: "..." }
 */
export const createDirect = async (req, res) => {
  const { error } = create1on1Schema.validate(req.body);
  if (error) return responceHandler(res, 400, error.details[0].message);

  const result = await createDirectConversation(req.userId, req.body.userId);

  if (result.alreadyExists) {
    return responceHandler(res, 200, "Conversation already exists", result.conversation);
  }

  return responceHandler(res, 201, "Direct conversation created", result.conversation);
};

// ─── Create Group Conversation ───────────────────────────────────────────────

/**
 * POST /api/chat/group
 * Create a group conversation
 *
 * Body: { groupName: "...", members?: ["userId1", "userId2"] }
 */
export const createGroup = async (req, res) => {
  const { error } = createGroupSchema.validate(req.body);
  if (error) return responceHandler(res, 400, error.details[0].message);

  const { groupName, members } = req.body;
  const conversation = await createGroupConversation(req.userId, groupName, members || []);
  return responceHandler(res, 201, "Group created successfully", conversation);
};

// ─── Get My Conversations ────────────────────────────────────────────────────

/**
 * GET /api/chat/my
 * List all conversations for the logged-in user
 */
export const myConversations = async (req, res) => {
  const conversations = await getUserConversations(req.userId);
  return responceHandler(res, 200, "Conversations retrieved", conversations);
};

// ─── Get Conversation Details ────────────────────────────────────────────────

/**
 * GET /api/chat/:conversationId
 * Get full conversation details (requires membership — checked by middleware)
 */
export const getConversationDetails = async (req, res) => {
  const conversation = await getConversation(req.params.conversationId);
  return responceHandler(res, 200, "Conversation details retrieved", conversation);
};

// ─── Delete Group ────────────────────────────────────────────────────────────

/**
 * DELETE /api/chat/:conversationId
 * Delete a group (creator only — checked by middleware)
 */
export const deleteConversation = async (req, res) => {
  const result = await deleteGroup(req.params.conversationId);
  return responceHandler(res, 200, result.message);
};

// ─── Leave Conversation ──────────────────────────────────────────────────────

/**
 * POST /api/chat/:conversationId/leave
 * Leave a conversation (any member except creator)
 */
export const leave = async (req, res) => {
  const result = await leaveConversation(req.params.conversationId, req.userId);
  return responceHandler(res, 200, result.message);
};

// ─── Add Member ──────────────────────────────────────────────────────────────

/**
 * POST /api/chat/:conversationId/members/add
 * Add a member to a group (admin+ — checked by middleware)
 *
 * Body: { userId: "..." }
 */
export const addMemberHandler = async (req, res) => {
  const { error } = addMemberSchema.validate(req.body);
  if (error) return responceHandler(res, 400, error.details[0].message);

  const conversation = await addMember(req.params.conversationId, req.body.userId);
  return responceHandler(res, 200, "Member added successfully", conversation);
};

// ─── Remove Member ───────────────────────────────────────────────────────────

/**
 * POST /api/chat/:conversationId/members/remove
 * Remove a member from a group (admin+ — role checks in service layer)
 *
 * Body: { userId: "..." }
 */
export const removeMemberHandler = async (req, res) => {
  const { error } = removeMemberSchema.validate(req.body);
  if (error) return responceHandler(res, 400, error.details[0].message);

  const result = await removeMember(
    req.params.conversationId,
    req.body.userId,
    req.userId,
    req.conversationRole,
  );
  return responceHandler(res, 200, result.message);
};

// ─── Change Role ─────────────────────────────────────────────────────────────

/**
 * POST /api/chat/:conversationId/members/role
 * Change a member's role (admin+ — role checks in service layer)
 *
 * Body: { userId: "...", role: "admin" | "member" }
 */
export const changeRoleHandler = async (req, res) => {
  const { error } = changeRoleSchema.validate(req.body);
  if (error) return responceHandler(res, 400, error.details[0].message);

  const result = await changeRole(
    req.params.conversationId,
    req.body.userId,
    req.body.role,
    req.userId,
    req.conversationRole,
  );
  return responceHandler(res, 200, result.message);
};

// ─── Generate Invite Code ────────────────────────────────────────────────────

/**
 * POST /api/chat/:conversationId/invite
 * Generate a new invite code (admin+ — checked by middleware)
 */
export const generateInvite = async (req, res) => {
  const result = await generateInviteCode(req.params.conversationId);
  return responceHandler(res, 201, "Invite code generated", result);
};

// ─── Join by Invite Code ─────────────────────────────────────────────────────

/**
 * POST /api/chat/join/:inviteCode
 * Join a group via invite code (any authenticated user)
 */
export const joinByInvite = async (req, res) => {
  const conversation = await joinByInviteCode(req.params.inviteCode, req.userId);
  return responceHandler(res, 200, "Joined group successfully", conversation);
};
