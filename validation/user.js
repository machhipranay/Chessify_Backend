import Joi from "joi";

export const userValidationSchema = Joi.object({
  username: Joi.string()
    .min(6)
    .max(30)
    .required(),

  email: Joi.string()
    .email()
    .optional(),

  password: Joi.string()
    .min(6)
    .max(128)
    .required(),

  about: Joi.string()
    .max(500)
    .allow("")
    .optional(),

  avatar: Joi.string()
    .uri()
    .optional(),

  rating: Joi.number()
    .min(0)
    .optional(),

  titles: Joi.array()
    .items(Joi.string())
    .optional(),

  isAdmin: Joi.boolean()
    .optional(),

  onGoingGames: Joi.array()
    .items(Joi.string().hex().length(24))
    .optional(),

  isBanned: Joi.boolean()
    .optional(),

  country: Joi.string()
    .valid("India", "USA", "UK", "Germany", "France", "Russia", "China", "Japan", "Other")
    .optional(),

  followers: Joi.array()
    .items(Joi.string().hex().length(24))
    .optional(),

  friends: Joi.array()
    .items(Joi.string().hex().length(24))
    .optional(),

  status: Joi.string()
    .valid("None", "Gold", "Platinum", "Diamond")
    .optional(),

  refreshToken: Joi.string()
    .allow("")
    .optional()
});