import Joi from "joi";

export const userEditProfileValidation = Joi.object({
  username: Joi.string()
    .min(6)
    .max(30)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({
      "string.pattern.base":
        "Username can only contain letters, numbers, and underscores"
    }),
    
  email: Joi.string()
    .email()
    .trim(),

  about: Joi.string()
    .max(500)
    .allow("")
    .trim(),

  avatar: Joi.string()
    .uri(),

  country: Joi.string().valid(
    "India",
    "USA",
    "UK",
    "Germany",
    "France",
    "Russia",
    "China",
    "Japan",
    "Other"
  )
});