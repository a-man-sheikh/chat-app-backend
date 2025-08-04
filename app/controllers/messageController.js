const {
  sendMessageService,
  getMessagesService,
  markAsReadService,
  deleteMessageService,
  getConversationsService,
  getUnreadCountService,
} = require("../services/messageService");
const { successResponse } = require("../utils/responseHandler");
const asyncHandler = require("../middleware/asyncHandler");

const sendMessage = asyncHandler(async (req, res) => {
  const payload = req.body;
  const senderId = req.user._id; // This will come from auth middleware

  const result = await sendMessageService(payload, senderId);

  if (result.success) {
    return successResponse(res, 201, result.message, result.data);
  } else {
    throw new Error(result.message);
  }
});

const getMessages = asyncHandler(async (req, res) => {
  const payload = req.query; // For GET requests, use query params
  const userId = req.user._id;

  const result = await getMessagesService(payload, userId);

  if (result.success) {
    return successResponse(res, 200, result.message, result.data);
  } else {
    throw new Error(result.message);
  }
});

const markAsRead = asyncHandler(async (req, res) => {
  const payload = req.body;
  const userId = req.user._id;

  const result = await markAsReadService(payload, userId);

  if (result.success) {
    return successResponse(res, 200, result.message, result.data);
  } else {
    throw new Error(result.message);
  }
});

const deleteMessage = asyncHandler(async (req, res) => {
  const payload = req.body;
  const userId = req.user._id;

  const result = await deleteMessageService(payload, userId);

  if (result.success) {
    return successResponse(res, 200, result.message, result.data);
  } else {
    throw new Error(result.message);
  }
});

const getConversations = asyncHandler(async (req, res) => {
  const payload = req.query;
  const userId = req.user._id;

  const result = await getConversationsService(payload, userId);

  if (result.success) {
    return successResponse(res, 200, result.message, result.data);
  } else {
    throw new Error(result.message);
  }
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await getUnreadCountService(userId);

  if (result.success) {
    return successResponse(res, 200, result.message, result.data);
  } else {
    throw new Error(result.message);
  }
});

module.exports = {
  sendMessage,
  getMessages,
  markAsRead,
  deleteMessage,
  getConversations,
  getUnreadCount,
};
