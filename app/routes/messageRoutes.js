const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const {
  sendMessageSchema,
  markMessageAsReadSchema,
  deleteMessageSchema,
  markAllMessagesAsReadSchema,
  searchMessagesSchema,
  paginationSchema,
  conversationMessagesSchema
} = require("../validations/messageValidation");
const {
  getConversations,
  getConversationMessages,
  sendMessage,
  markMessageAsRead,
  deleteMessage,
  getUnreadCount,
  searchMessages,
  markAllMessagesAsRead,
  getMessageStats
} = require("../controllers/messageController");

// Message routes with validation
router.get("/conversations", authenticateToken, validate(paginationSchema, "query"), getConversations);
router.get("/conversation", authenticateToken, validate(conversationMessagesSchema, "query"), getConversationMessages);
router.post("/send", authenticateToken, validate(sendMessageSchema), sendMessage);
router.put("/read", authenticateToken, validate(markMessageAsReadSchema), markMessageAsRead);
router.delete("/delete", authenticateToken, validate(deleteMessageSchema), deleteMessage);
router.get("/unread-count", authenticateToken, getUnreadCount);
router.get("/search", authenticateToken, validate(searchMessagesSchema, "query"), searchMessages);
router.put("/mark-all-read", authenticateToken, validate(markAllMessagesAsReadSchema), markAllMessagesAsRead);
router.get("/stats", authenticateToken, getMessageStats);

module.exports = router; 