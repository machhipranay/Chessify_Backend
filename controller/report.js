import { responceHandler } from "../utils/responceHandler.js";
import {
  reportMessage,
  getPendingReports,
  resolveReport,
} from "../service/report.js";
import {
  reportMessageSchema,
  resolveReportSchema,
} from "../validation/conversation.js";

// ─── Report a Message ────────────────────────────────────────────────────────

/**
 * POST /api/chat/messages/:messageId/report
 * Report a message as inappropriate (any conversation member)
 *
 * Body: { reportReason: "...", description?: "..." }
 */
export const createReport = async (req, res) => {
  const { error } = reportMessageSchema.validate(req.body);
  if (error) return responceHandler(res, 400, error.details[0].message);

  const report = await reportMessage(
    req.userId,
    req.params.messageId,
    req.body.reportReason,
    req.body.description,
  );
  return responceHandler(res, 201, "Message reported successfully", report);
};

// ─── Get Pending Reports ─────────────────────────────────────────────────────

/**
 * GET /api/chat/admin/reports
 * List all pending reports (platform admin only — checked by middleware)
 *
 * Query: ?page=1&limit=20
 */
export const listPendingReports = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const result = await getPendingReports(page, limit);
  return responceHandler(res, 200, "Pending reports retrieved", result);
};

// ─── Resolve Report ──────────────────────────────────────────────────────────

/**
 * POST /api/chat/admin/reports/:reportId/resolve
 * Resolve or reject a report (platform admin only — checked by middleware)
 *
 * Body: { action: "resolve" | "reject" }
 *
 * resolve → soft-delete message + permanently ban sender
 * reject  → mark report as rejected, no action taken
 */
export const handleResolveReport = async (req, res) => {
  const { error } = resolveReportSchema.validate(req.body);
  if (error) return responceHandler(res, 400, error.details[0].message);

  const result = await resolveReport(
    req.params.reportId,
    req.userId,
    req.body.action,
  );
  return responceHandler(res, 200, result.message, result);
};
