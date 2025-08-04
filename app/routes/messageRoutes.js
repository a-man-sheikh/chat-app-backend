const {
  sendMessage,
  getMessages,
  markAsRead,
  deleteMessage,
  getConversations,
  getUnreadCount,
} = require("../controllers/messageController");
const {
  sendMessageSchema,
  getMessagesSchema,
  markAsReadSchema,
  deleteMessageSchema,
  getConversationsSchema,
} = require("../validations/messageValidation");
const validate = require("../middleware/validate");
const express = require("express");
const router = express.Router();

// Note: These routes will need authentication middleware
// For now, we'll create a temporary auth middleware for testing

// Temporary auth middleware for testing (replace with real JWT auth later)
const tempAuthMiddleware = (req, res, next) => {
  // For testing, we'll use a user ID from query params
  // In production, this should come from JWT token
  const userId = req.query.userId || req.body.userId;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "User ID required for testing",
    });
  }

  // Mock user object
  req.user = { _id: userId };
  next();
};

// Message routes
router.post(
  "/send",
  tempAuthMiddleware,
  validate(sendMessageSchema),
  sendMessage
);
router.get(
  "/conversation",
  tempAuthMiddleware,
  validate(getMessagesSchema),
  getMessages
);
router.put("/read", tempAuthMiddleware, validate(markAsReadSchema), markAsRead);
router.delete(
  "/delete",
  tempAuthMiddleware,
  validate(deleteMessageSchema),
  deleteMessage
);
router.get(
  "/conversations",
  tempAuthMiddleware,
  validate(getConversationsSchema),
  getConversations
);
router.get("/unread-count", tempAuthMiddleware, getUnreadCount);

module.exports = router;
