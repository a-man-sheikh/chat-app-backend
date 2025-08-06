const Joi = require("joi");

// Validation for sending a message
const sendMessageSchema = Joi.object({
  receiver: Joi.string().required().messages({
    "string.empty": "Receiver ID is required",
    "any.required": "Receiver ID is required"
  }),
  content: Joi.string().trim().min(1).max(1000).required().messages({
    "string.empty": "Message content is required",
    "string.min": "Message content must be at least 1 character long",
    "string.max": "Message content cannot exceed 1000 characters",
    "any.required": "Message content is required"
  }),
  messageType: Joi.string().valid("text", "image", "file", "audio").default("text").messages({
    "any.only": "Message type must be one of: text, image, file, audio"
  }),
  mediaUrl: Joi.string().uri().optional().allow(null, "").messages({
    "string.uri": "Media URL must be a valid URL"
  })
});

// Validation for marking message as read
const markMessageAsReadSchema = Joi.object({
  messageId: Joi.string().required().messages({
    "string.empty": "Message ID is required",
    "any.required": "Message ID is required"
  })
});

// Validation for deleting a message
const deleteMessageSchema = Joi.object({
  messageId: Joi.string().required().messages({
    "string.empty": "Message ID is required",
    "any.required": "Message ID is required"
  })
});

// Validation for marking all messages as read
const markAllMessagesAsReadSchema = Joi.object({
  receiver: Joi.string().required().messages({
    "string.empty": "Receiver ID is required",
    "any.required": "Receiver ID is required"
  })
});

// Validation for search query
const searchMessagesSchema = Joi.object({
  q: Joi.string().trim().min(1).required().messages({
    "string.empty": "Search query is required",
    "string.min": "Search query must be at least 1 character long",
    "any.required": "Search query is required"
  }),
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1"
  }),
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100"
  })
});

// Validation for pagination parameters
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1"
  }),
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100"
  })
});

// Validation for conversation messages
const conversationMessagesSchema = Joi.object({
  receiver: Joi.string().required().messages({
    "string.empty": "Receiver ID is required",
    "any.required": "Receiver ID is required"
  }),
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1"
  }),
  limit: Joi.number().integer().min(1).max(100).default(50).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100"
  })
});

module.exports = {
  sendMessageSchema,
  markMessageAsReadSchema,
  deleteMessageSchema,
  markAllMessagesAsReadSchema,
  searchMessagesSchema,
  paginationSchema,
  conversationMessagesSchema
}; 