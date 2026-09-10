import Joi from "joi";

// ObjectId validation helper (24-char hex string)
const objectId = Joi.string().hex().length(24);

// ─── Conversation Schemas ────────────────────────────────────────────────────

// Create a group conversation
export const createGroupSchema = Joi.object({
  groupName: Joi.string()
    .min(3)
    .max(50)
    .trim()
    .required()
    .messages({
      "string.min": "Group name must be at least 3 characters",
      "string.max": "Group name cannot exceed 50 characters",
      "any.required": "Group name is required",
    }),

  members: Joi.array()
    .items(objectId)
    .optional()
    .messages({
      "string.hex": "Each member ID must be a valid user ID",
      "string.length": "Each member ID must be a valid user ID",
    }),
});

// Create a 1-on-1 direct conversation
export const create1on1Schema = Joi.object({
  userId: objectId
    .required()
    .messages({
      "any.required": "User ID of the person to chat with is required",
    }),
});

// ─── Message Schemas ─────────────────────────────────────────────────────────

// Send a message
export const sendMessageSchema = Joi.object({
  content: Joi.string()
    .min(1)
    .max(2000)
    .trim()
    .required()
    .messages({
      "string.min": "Message cannot be empty",
      "string.max": "Message cannot exceed 2000 characters",
      "any.required": "Message content is required",
    }),
});

// ─── Report Schemas ──────────────────────────────────────────────────────────

// Report a message
export const reportMessageSchema = Joi.object({
  reportReason: Joi.string()
    .valid("spam", "abuse", "hate", "violence", "sexual", "other")
    .required()
    .messages({
      "any.only": "Report reason must be one of: spam, abuse, hate, violence, sexual, other",
      "any.required": "Report reason is required",
    }),

  description: Joi.string()
    .max(500)
    .trim()
    .optional()
    .allow("")
    .messages({
      "string.max": "Description cannot exceed 500 characters",
    }),
});

// ─── Member Management Schemas ───────────────────────────────────────────────

// Add a member to the group
export const addMemberSchema = Joi.object({
  userId: objectId
    .required()
    .messages({
      "any.required": "User ID is required",
    }),
});

// Remove a member from the group
export const removeMemberSchema = Joi.object({
  userId: objectId
    .required()
    .messages({
      "any.required": "User ID is required",
    }),
});

// Change a member's role
export const changeRoleSchema = Joi.object({
  userId: objectId
    .required()
    .messages({
      "any.required": "User ID is required",
    }),

  role: Joi.string()
    .valid("admin", "member")
    .required()
    .messages({
      "any.only": "Role must be either 'admin' or 'member'",
      "any.required": "Role is required",
    }),
});

// ─── Admin Moderation Schemas ────────────────────────────────────────────────

// Resolve or reject a report
export const resolveReportSchema = Joi.object({
  action: Joi.string()
    .valid("resolve", "reject")
    .required()
    .messages({
      "any.only": "Action must be either 'resolve' or 'reject'",
      "any.required": "Action is required",
    }),
});
