import Joi from "joi";

// Validate game creation request
export const createGameSchema = Joi.object({
  gameType: Joi.string()
    .valid("invite", "matchmaking")
    .required()
    .messages({
      "any.required": "Game type is required (invite or matchmaking)",
    }),

  maxTimePerMoveHours: Joi.number()
    .integer()
    .min(1)
    .max(336) // 14 days
    .default(24)
    .messages({
      "number.min": "Time per move must be at least 1 hour",
      "number.max": "Time per move cannot exceed 14 days (336 hours)",
    }),
});

// Validate a chess move
export const moveSchema = Joi.object({
  from: Joi.string()
    .pattern(/^[a-h][1-8]$/)
    .required()
    .messages({
      "string.pattern.base": "From square must be in format like e2, d4, etc.",
      "any.required": "From square is required",
    }),

  to: Joi.string()
    .pattern(/^[a-h][1-8]$/)
    .required()
    .messages({
      "string.pattern.base": "To square must be in format like e4, d5, etc.",
      "any.required": "To square is required",
    }),

  promotion: Joi.string()
    .valid("q", "r", "b", "n")
    .optional()
    .messages({
      "any.only": "Promotion piece must be q (queen), r (rook), b (bishop), or n (knight)",
    }),
});

// Validate a chat message
export const chatMessageSchema = Joi.object({
  message: Joi.string()
    .min(1)
    .max(200)
    .trim()
    .required()
    .messages({
      "string.min": "Message cannot be empty",
      "string.max": "Message cannot exceed 200 characters",
      "any.required": "Message is required",
    }),
});

// Validate invite code when joining a game
export const joinByInviteSchema = Joi.object({
  inviteCode: Joi.string()
    .alphanum()
    .length(8)
    .required()
    .messages({
      "string.alphanum": "Invite code must be alphanumeric",
      "string.length": "Invite code must be 8 characters",
      "any.required": "Invite code is required",
    }),
});

// Validate challenge response (accept/decline)
export const challengeResponseSchema = Joi.object({
  accept: Joi.boolean()
    .required()
    .messages({
      "any.required": "Accept field is required (true or false)",
    }),
});
