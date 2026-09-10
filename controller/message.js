import { responceHandler } from "../utils/responceHandler.js";
import {
  sendMessage,
  getMessages,
  deleteMessage,
} from "../service/message.js";
import { sendMessageSchema } from "../validation/conversation.js";

// ─── Send Message ────────────────────────────────────────────────────────────

/**
 * POST /api/chat/:conversationId/messages
 * Send a message in a conversation (member+ — checked by middleware)
 *
 * Body: { content: "..." }
 */
export const send = async (req, res) => {
  const { error } = sendMessageSchema.validate(req.body);
  if (error) return responceHandler(res, 400, error.details[0].message);

  const message = await sendMessage(
    req.params.conversationId,
    req.userId,
    req.body.content,
  );
  return responceHandler(res, 201, "Message sent", message);
};

// ─── Get Messages ────────────────────────────────────────────────────────────

/**
 * GET /api/chat/:conversationId/messages
 * Get paginated messages for a conversation (member+ — checked by middleware)
 *
 * Query: ?page=1&limit=50
 */
export const getConversationMessages = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;

  const result = await getMessages(req.params.conversationId, page, limit);
  return responceHandler(res, 200, "Messages retrieved", result);
};

// ─── Delete Message ──────────────────────────────────────────────────────────

/**
 * DELETE /api/chat/messages/:messageId
 * Soft-delete a message (sender only)
 */
export const removeMessage = async (req, res) => {
  const result = await deleteMessage(req.params.messageId, req.userId);
  return responceHandler(res, 200, result.message);
};
