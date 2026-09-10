/**
 * ═══════════════════════════════════════════════════════════════
 *  CHAT ROUTES — /api/chat
 * ═══════════════════════════════════════════════════════════════
 *
 *  Handles all messaging and conversation operations:
 *  - 1-on-1 direct conversations
 *  - Group conversations with role-based access control
 *  - Message sending, reading (paginated), and soft-deletion
 *  - Member management (add, remove, role changes)
 *  - Invite code generation and group joining
 *  - Message reporting and platform admin moderation
 *
 *  Auth: ALL routes require JWT authentication via httpOnly cookies.
 *
 *  Role Hierarchy (for groups):
 *    creator (superAdmin) → admin → member
 *
 *    - creator: full control, can never be removed or demoted
 *    - admin:   can add/remove members, promote to admin, generate invite codes
 *    - member:  can only send/read messages and leave the group
 *
 *  Role Middleware:
 *    - requireConversationMember  → any role (creator, admin, member)
 *    - requireConversationAdmin   → admin or creator only
 *    - requireConversationCreator → creator only
 *    - requirePlatformAdmin       → isAdmin: true on User model (site-wide)
 *
 *  Route Ordering:
 *    Static routes (/my, /admin/reports, /messages/:id) are defined BEFORE
 *    parameterized routes (/:conversationId) to prevent Express path conflicts.
 *
 * ═══════════════════════════════════════════════════════════════
 */

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authMiddleware } from "../utils/jwt.auth.js";
import {
  requireConversationMember,
  requireConversationAdmin,
  requireConversationCreator,
  requirePlatformAdmin,
} from "../utils/conversationAuth.js";

// Conversation management controllers
import {
  createDirect,
  createGroup,
  myConversations,
  getConversationDetails,
  deleteConversation,
  leave,
  addMemberHandler,
  removeMemberHandler,
  changeRoleHandler,
  generateInvite,
  joinByInvite,
} from "../controller/conversation.js";

// Message controllers
import {
  send,
  getConversationMessages,
  removeMessage,
} from "../controller/message.js";

// Report / moderation controllers
import {
  createReport,
  listPendingReports,
  handleResolveReport,
} from "../controller/report.js";

const router = Router();

// Apply JWT auth to ALL chat routes — no public endpoints
router.use(authMiddleware);

// ─── Conversation Management (Any Authenticated User) ────────────────────────

// POST /api/chat/direct
// Create a 1-on-1 direct conversation with another user
// Body: { userId: "ObjectId" }
//
// - If a 1-on-1 conversation already exists between the two users, returns it
// - Both users get "member" role (no hierarchy in DMs)
// - Cannot create a conversation with yourself
router.post("/direct", asyncHandler(createDirect));

// POST /api/chat/group
// Create a new group conversation
// Body: { groupName: "Chess Club" (3-50 chars), members?: ["userId1", "userId2"] }
//
// - The creator automatically gets "creator" role (superAdmin)
// - Additional members get "member" role by default
// - Members array is optional — you can add members later
router.post("/group", asyncHandler(createGroup));

// GET /api/chat/my
// List all conversations the logged-in user is part of
// Returns both direct and group conversations, sorted by most recently updated
router.get("/my", asyncHandler(myConversations));

// POST /api/chat/join/:inviteCode
// Join a group conversation using an 8-character invite code
// Params: { inviteCode: "A1B2C3D4" }
//
// - No existing membership required (that's the purpose of invite codes)
// - Invite code must not be expired (24h expiry)
// - User joins as "member" role
// - Cannot join if already a member
router.post("/join/:inviteCode", asyncHandler(joinByInvite));

// ─── Platform Admin Moderation ───────────────────────────────────────────────
// These routes are for site-wide admins (isAdmin: true on User model)
// IMPORTANT: Defined BEFORE /:conversationId routes to avoid Express conflicts

// GET /api/chat/admin/reports?page=1&limit=20
// List all pending message reports for admin review
// Query: { page?: number, limit?: number }
// Access: Platform admin only (isAdmin: true)
//
// Returns reports with populated message content, sender info, and conversation
router.get(
  "/admin/reports",
  asyncHandler(requirePlatformAdmin),
  asyncHandler(listPendingReports),
);

// POST /api/chat/admin/reports/:reportId/resolve
// Resolve or reject a message report
// Params: { reportId }
// Body: { action: "resolve" | "reject" }
// Access: Platform admin only (isAdmin: true)
//
// "resolve" = message was inappropriate:
//   1. Soft-deletes the reported message (isDeleted = true)
//   2. Permanently bans the message sender (isBanned = true)
//   3. Records which admin resolved it for audit trail
//
// "reject" = message was not inappropriate:
//   1. Marks report as rejected, no other action taken
router.post(
  "/admin/reports/:reportId/resolve",
  asyncHandler(requirePlatformAdmin),
  asyncHandler(handleResolveReport),
);

// ─── Message Actions (No conversationId in path) ─────────────────────────────

// DELETE /api/chat/messages/:messageId
// Soft-delete a message (sets isDeleted = true)
// Params: { messageId }
// Access: Message sender only — you can only delete your own messages
//
// Soft-deleted messages are excluded from GET messages responses
// but remain in the database for report audit trail
router.delete("/messages/:messageId", asyncHandler(removeMessage));

// POST /api/chat/messages/:messageId/report
// Report a message as inappropriate
// Params: { messageId }
// Body: { reportReason: "spam|abuse|hate|violence|sexual|other", description?: "..." }
// Access: Any conversation member
//
// Rules:
// - Cannot report your own message
// - Cannot report the same message twice (while pending)
// - Cannot report already-deleted messages
// - Reporter must be a member of the message's conversation
router.post("/messages/:messageId/report", asyncHandler(createReport));

// ─── Conversation Details & Actions (require :conversationId) ────────────────
// IMPORTANT: These parameterized routes must come AFTER static routes above

// GET /api/chat/:conversationId
// Get full conversation details including member list, roles, and last message
// Params: { conversationId }
// Access: Any conversation member (member, admin, or creator)
router.get(
  "/:conversationId",
  asyncHandler(requireConversationMember),
  asyncHandler(getConversationDetails),
);

// DELETE /api/chat/:conversationId
// Delete a group conversation permanently
// Params: { conversationId }
// Access: Creator only
//
// - Only group conversations can be deleted (not direct 1-on-1)
// - Removes the entire conversation document from the database
router.delete(
  "/:conversationId",
  asyncHandler(requireConversationCreator),
  asyncHandler(deleteConversation),
);

// POST /api/chat/:conversationId/leave
// Leave a conversation voluntarily
// Params: { conversationId }
// Access: Any member (but creator CANNOT leave — must delete the group instead)
router.post(
  "/:conversationId/leave",
  asyncHandler(requireConversationMember),
  asyncHandler(leave),
);

// ─── Member Management (Group Only, Admin+) ──────────────────────────────────
// These routes only work for group conversations (not 1-on-1 direct chats)

// POST /api/chat/:conversationId/members/add
// Add a new member to the group
// Params: { conversationId }
// Body: { userId: "ObjectId" }
// Access: Admin or creator
//
// - New member gets "member" role by default
// - Cannot add someone who is already a member
// - Target user must exist in the database
router.post(
  "/:conversationId/members/add",
  asyncHandler(requireConversationAdmin),
  asyncHandler(addMemberHandler),
);

// POST /api/chat/:conversationId/members/remove
// Remove a member from the group
// Params: { conversationId }
// Body: { userId: "ObjectId" }
// Access: Admin or creator (with restrictions)
//
// Role-based restrictions:
// - Creator can NEVER be removed by anyone
// - Admins can only be removed by the creator
// - Regular members can be removed by any admin or the creator
router.post(
  "/:conversationId/members/remove",
  asyncHandler(requireConversationAdmin),
  asyncHandler(removeMemberHandler),
);

// POST /api/chat/:conversationId/members/role
// Change a member's role (promote or demote)
// Params: { conversationId }
// Body: { userId: "ObjectId", role: "admin" | "member" }
// Access: Admin or creator (with restrictions)
//
// Role-based restrictions:
// - Creator's role can NEVER be changed
// - "creator" role can NEVER be assigned to anyone
// - Admins can promote members to admin
// - Only the creator can demote admins back to member
router.post(
  "/:conversationId/members/role",
  asyncHandler(requireConversationAdmin),
  asyncHandler(changeRoleHandler),
);

// ─── Invite Codes (Group Only, Admin+) ───────────────────────────────────────

// POST /api/chat/:conversationId/invite
// Generate a new invite code for the group
// Params: { conversationId }
// Access: Admin or creator
//
// - Generates an 8-character alphanumeric code (e.g., "X9Y8Z7W6")
// - Code expires after 24 hours
// - Generating a new code replaces any existing invite code
// - Only works for group conversations (not 1-on-1)
router.post(
  "/:conversationId/invite",
  asyncHandler(requireConversationAdmin),
  asyncHandler(generateInvite),
);

// ─── Messages ────────────────────────────────────────────────────────────────

// POST /api/chat/:conversationId/messages
// Send a message in a conversation
// Params: { conversationId }
// Body: { content: "Hello everyone!" } — 1 to 2000 characters
// Access: Any conversation member (member, admin, or creator)
//
// - Updates the conversation's lastMessage reference
// - Returns the message with populated sender info
router.post(
  "/:conversationId/messages",
  asyncHandler(requireConversationMember),
  asyncHandler(send),
);

// GET /api/chat/:conversationId/messages?page=1&limit=50
// Get paginated messages for a conversation
// Params: { conversationId }
// Query: { page?: number (default 1), limit?: number (default 50) }
// Access: Any conversation member (member, admin, or creator)
//
// - Returns messages in chronological order (oldest first within the page)
// - Soft-deleted messages (isDeleted = true) are excluded
// - Includes pagination metadata: { page, limit, total, totalPages }
router.get(
  "/:conversationId/messages",
  asyncHandler(requireConversationMember),
  asyncHandler(getConversationMessages),
);

export default router;
