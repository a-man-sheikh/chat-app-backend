const Joi = require("joi");

const createGroupSchema = Joi.object({
  name: Joi.string().required().min(1).max(100).messages({
    "string.empty": "Group name is required",
    "string.min": "Group name must be at least 1 character long",
    "string.max": "Group name cannot exceed 100 characters",
  }),
  description: Joi.string().max(500).optional().messages({
    "string.max": "Description cannot exceed 500 characters",
  }),
  participants: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "Participants must be an array",
  }),
  isPrivate: Joi.boolean().optional(),
  avatar: Joi.string().uri().optional().messages({
    "string.uri": "Avatar must be a valid URL",
  }),
});

const updateGroupSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional().messages({
    "string.min": "Group name must be at least 1 character long",
    "string.max": "Group name cannot exceed 100 characters",
  }),
  description: Joi.string().max(500).optional().messages({
    "string.max": "Description cannot exceed 500 characters",
  }),
  isPrivate: Joi.boolean().optional(),
  avatar: Joi.string().uri().optional().messages({
    "string.uri": "Avatar must be a valid URL",
  }),
});

const addParticipantSchema = Joi.object({
  groupId: Joi.string().required().messages({
    "string.empty": "Group ID is required",
  }),
  userId: Joi.string().required().messages({
    "string.empty": "User ID is required",
  }),
  role: Joi.string().valid("admin", "moderator", "member").optional().messages({
    "any.only": "Role must be admin, moderator, or member",
  }),
});

const removeParticipantSchema = Joi.object({
  groupId: Joi.string().required().messages({
    "string.empty": "Group ID is required",
  }),
  userId: Joi.string().required().messages({
    "string.empty": "User ID is required",
  }),
});

const sendGroupMessageSchema = Joi.object({
  groupId: Joi.string().required().messages({
    "string.empty": "Group ID is required",
  }),
  content: Joi.string().required().max(1000).messages({
    "string.empty": "Message content is required",
    "string.max": "Message content cannot exceed 1000 characters",
  }),
  messageType: Joi.string()
    .valid("text", "image", "file", "audio")
    .optional()
    .messages({
      "any.only": "Message type must be text, image, file, or audio",
    }),
  mediaUrl: Joi.string().uri().optional().messages({
    "string.uri": "Media URL must be a valid URL",
  }),
  replyTo: Joi.string().optional().messages({
    "string.base": "Reply to must be a valid message ID",
  }),
});

module.exports = {
  createGroupSchema,
  updateGroupSchema,
  addParticipantSchema,
  removeParticipantSchema,
  sendGroupMessageSchema,
}; 