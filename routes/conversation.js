import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authMiddleware } from "../utils/jwt.auth.js";
import {
  requireConversationMember,
  requireConversationAdmin,
  requireConversationCreator,
  requirePlatformAdmin,
} from "../utils/conversationAuth.js";

// Controllers
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

import {
  send,
  getConversationMessages,
  removeMessage,
} from "../controller/message.js";

import {
  createReport,
  listPendingReports,
  handleResolveReport,
} from "../controller/report.js";

const router = Router();

// All chat routes require authentication
router.use(authMiddleware);

// ─── Conversation Management ─────────────────────────────────────────────────

// Create a 1-on-1 conversation
router.post("/direct", asyncHandler(createDirect));

// Create a group conversation
router.post("/group", asyncHandler(createGroup));

// List my conversations
router.get("/my", asyncHandler(myConversations));

// Join a group via invite code (no membership required — that's the point)
router.post("/join/:inviteCode", asyncHandler(joinByInvite));

// ─── Admin Moderation (Platform Admin) ───────────────────────────────────────
// These must come BEFORE the :conversationId routes to avoid conflicts

// List pending reports (platform admin only)
router.get(
  "/admin/reports",
  asyncHandler(requirePlatformAdmin),
  asyncHandler(listPendingReports),
);

// Resolve/reject a report (platform admin only)
router.post(
  "/admin/reports/:reportId/resolve",
  asyncHandler(requirePlatformAdmin),
  asyncHandler(handleResolveReport),
);

// ─── Message Actions (no conversationId in path) ─────────────────────────────

// Delete a message (sender only)
router.delete("/messages/:messageId", asyncHandler(removeMessage));

// Report a message (any authenticated user who is a member of the conversation)
router.post("/messages/:messageId/report", asyncHandler(createReport));

// ─── Conversation Details & Actions (require conversationId) ─────────────────

// Get conversation details (member+)
router.get(
  "/:conversationId",
  asyncHandler(requireConversationMember),
  asyncHandler(getConversationDetails),
);

// Delete group (creator only)
router.delete(
  "/:conversationId",
  asyncHandler(requireConversationCreator),
  asyncHandler(deleteConversation),
);

// Leave conversation (any member)
router.post(
  "/:conversationId/leave",
  asyncHandler(requireConversationMember),
  asyncHandler(leave),
);

// ─── Member Management (group only, admin+) ──────────────────────────────────

// Add member
router.post(
  "/:conversationId/members/add",
  asyncHandler(requireConversationAdmin),
  asyncHandler(addMemberHandler),
);

// Remove member
router.post(
  "/:conversationId/members/remove",
  asyncHandler(requireConversationAdmin),
  asyncHandler(removeMemberHandler),
);

// Change member role
router.post(
  "/:conversationId/members/role",
  asyncHandler(requireConversationAdmin),
  asyncHandler(changeRoleHandler),
);

// ─── Invite Codes (group only, admin+) ───────────────────────────────────────

// Generate invite code
router.post(
  "/:conversationId/invite",
  asyncHandler(requireConversationAdmin),
  asyncHandler(generateInvite),
);

// ─── Messages ────────────────────────────────────────────────────────────────

// Send a message (member+)
router.post(
  "/:conversationId/messages",
  asyncHandler(requireConversationMember),
  asyncHandler(send),
);

// Get messages (member+, paginated)
router.get(
  "/:conversationId/messages",
  asyncHandler(requireConversationMember),
  asyncHandler(getConversationMessages),
);

export default router;
