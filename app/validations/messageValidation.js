const Joi = require("joi");

// Send message validation schema
const sendMessageSchema = Joi.object({
  receiver: Joi.string().required().messages({
    "string.empty": "Receiver ID is required",
    "any.required": "Receiver ID is required",
  }),

  content: Joi.string().min(1).max(1000).required().messages({
    "string.empty": "Message content is required",
    "string.min": "Message cannot be empty",
    "string.max": "Message cannot exceed 1000 characters",
    "any.required": "Message content is required",
  }),

  messageType: Joi.string()
    .valid("text", "image", "file", "audio")
    .default("text")
    .messages({
      "any.only": "Message type must be text, image, file, or audio",
    }),

  mediaUrl: Joi.string().uri().optional().messages({
    "string.uri": "Media URL must be a valid URL",
  }),

  replyTo: Joi.string().optional().messages({
    "string.empty": "Reply message ID must be valid",
  }),
});

// Get messages validation schema
const getMessagesSchema = Joi.object({
  receiver: Joi.string().required().messages({
    "string.empty": "Receiver ID is required",
    "any.required": "Receiver ID is required",
  }),

  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1",
  }),

  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
  }),
});

// Mark message as read validation schema
const markAsReadSchema = Joi.object({
  messageId: Joi.string().required().messages({
    "string.empty": "Message ID is required",
    "any.required": "Message ID is required",
  }),
});

// Delete message validation schema
const deleteMessageSchema = Joi.object({
  messageId: Joi.string().required().messages({
    "string.empty": "Message ID is required",
    "any.required": "Message ID is required",
  }),
});

// Get conversations validation schema
const getConversationsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1",
  }),

  limit: Joi.number().integer().min(1).max(50).default(20).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 50",
  }),
});

module.exports = {
  sendMessageSchema,
  getMessagesSchema,
  markAsReadSchema,
  deleteMessageSchema,
  getConversationsSchema,
};
