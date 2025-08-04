const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Conversation = require("../models/conversationModel");
const {
  generateEncryptionKey,
  encryptMessage,
  decryptMessage,
} = require("../utils/encryption");

const sendMessageService = async (payload, senderId) => {
  const { receiver, content, messageType, mediaUrl, replyTo } = payload;

  // Check if receiver exists
  const receiverExists = await User.findById(receiver);
  if (!receiverExists) {
    throw new Error("Receiver not found");
  }

  // Check if replying to a valid message
  if (replyTo) {
    const replyMessage = await Message.findById(replyTo);
    if (!replyMessage) {
      throw new Error("Reply message not found");
    }
  }

  // Get or create conversation with encryption key
  const conversation = await Conversation.getOrCreate(
    [senderId, receiver],
    generateEncryptionKey()
  );

  // Get encryption key for conversation
  const conversationWithKey = await Conversation.findById(
    conversation._id
  ).select("+encryptionKey");
  const encryptionKey = conversationWithKey.encryptionKey;

  // Encrypt message content
  const encryptedContent = encryptMessage(content, encryptionKey);

  // Create new message
  const newMessage = new Message({
    sender: senderId,
    receiver,
    content, // Keep plain text for search (optional)
    encryptedContent: encryptedContent,
    messageType: messageType || "text",
    mediaUrl,
    replyTo,
    conversationId: conversation.conversationId,
  });

  const savedMessage = await newMessage.save();

  // Update conversation
  conversation.lastMessage = savedMessage._id;
  conversation.lastMessageAt = new Date();
  await conversation.save();

  // Populate sender and receiver details
  await savedMessage.populate([
    { path: "sender", select: "_id name email" },
    { path: "receiver", select: "_id name email" },
    { path: "replyTo", select: "content sender" },
  ]);

  return {
    success: true,
    message: "Message sent successfully",
    data: savedMessage,
  };
};

const getMessagesService = async (payload, userId) => {
  const { receiver, page = 1, limit = 20 } = payload;

  // Check if receiver exists
  const receiverExists = await User.findById(receiver);
  if (!receiverExists) {
    throw new Error("Receiver not found");
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  // Get conversation for encryption key
  const conversation = await Conversation.findByParticipants([
    userId,
    receiver,
  ]);
  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const conversationWithKey = await Conversation.findById(
    conversation._id
  ).select("+encryptionKey");
  const encryptionKey = conversationWithKey.encryptionKey;

  // Get messages between the two users
  const messages = await Message.find({
    $or: [
      { sender: userId, receiver },
      { sender: receiver, receiver: userId },
    ],
    isDeleted: false,
  })
    .select("+encryptedContent") // Include encrypted content
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate([
      { path: "sender", select: "_id name email" },
      { path: "receiver", select: "_id name email" },
      { path: "replyTo", select: "content sender" },
    ]);

  // Decrypt messages
  const decryptedMessages = messages.map((message) => {
    try {
      const decryptedContent = decryptMessage(
        message.encryptedContent,
        encryptionKey
      );
      return {
        ...message.toObject(),
        content: decryptedContent,
        encryptedContent: undefined, // Remove from response
      };
    } catch (error) {
      console.error("Failed to decrypt message:", error);
      return {
        ...message.toObject(),
        content: "[Encrypted message - unable to decrypt]",
        encryptedContent: undefined,
      };
    }
  });

  // Get total count for pagination
  const totalMessages = await Message.countDocuments({
    $or: [
      { sender: userId, receiver },
      { sender: receiver, receiver: userId },
    ],
    isDeleted: false,
  });

  const totalPages = Math.ceil(totalMessages / limitNum);

  return {
    success: true,
    message: "Messages retrieved successfully",
    data: {
      messages: decryptedMessages.reverse(), // Show oldest first
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalMessages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    },
  };
};

const markAsReadService = async (payload, userId) => {
  const { messageId } = payload;

  const message = await Message.findById(messageId);
  if (!message) {
    throw new Error("Message not found");
  }

  // Only receiver can mark message as read
  if (message.receiver.toString() !== userId) {
    throw new Error("You can only mark messages sent to you as read");
  }

  if (!message.isRead) {
    message.isRead = true;
    message.readAt = new Date();
    await message.save();
  }

  return {
    success: true,
    message: "Message marked as read",
    data: message,
  };
};

const deleteMessageService = async (payload, userId) => {
  const { messageId } = payload;

  const message = await Message.findById(messageId);
  if (!message) {
    throw new Error("Message not found");
  }

  // Only sender can delete their own message
  if (message.sender.toString() !== userId) {
    throw new Error("You can only delete your own messages");
  }

  // Soft delete
  message.isDeleted = true;
  message.deletedAt = new Date();
  await message.save();

  return {
    success: true,
    message: "Message deleted successfully",
    data: null,
  };
};

const getConversationsService = async (payload, userId) => {
  const { page = 1, limit = 20 } = payload;
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  // Get all unique conversations for the user
  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [{ sender: userId }, { receiver: userId }],
        isDeleted: false,
      },
    },
    {
      $addFields: {
        conversationId: {
          $cond: {
            if: { $eq: ["$sender", userId] },
            then: {
              $concat: [userId.toString(), "_", { $toString: "$receiver" }],
            },
            else: {
              $concat: [{ $toString: "$sender" }, "_", userId.toString()],
            },
          },
        },
        otherUser: {
          $cond: {
            if: { $eq: ["$sender", userId] },
            then: "$receiver",
            else: "$sender",
          },
        },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: "$conversationId",
        lastMessage: { $first: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$receiver", userId] },
                  { $eq: ["$isRead", false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $sort: { "lastMessage.createdAt": -1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limitNum,
    },
  ]);

  // Populate user details for each conversation
  const populatedConversations = await Message.populate(conversations, [
    {
      path: "lastMessage.sender",
      select: "_id name email",
    },
    {
      path: "lastMessage.receiver",
      select: "_id name email",
    },
    {
      path: "otherUser",
      select: "_id name email",
    },
  ]);

  // Get total conversations count
  const totalConversations = await Message.aggregate([
    {
      $match: {
        $or: [{ sender: userId }, { receiver: userId }],
        isDeleted: false,
      },
    },
    {
      $addFields: {
        conversationId: {
          $cond: {
            if: { $eq: ["$sender", userId] },
            then: {
              $concat: [userId.toString(), "_", { $toString: "$receiver" }],
            },
            else: {
              $concat: [{ $toString: "$sender" }, "_", userId.toString()],
            },
          },
        },
      },
    },
    {
      $group: {
        _id: "$conversationId",
      },
    },
    {
      $count: "total",
    },
  ]);

  const totalCount = totalConversations[0]?.total || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    success: true,
    message: "Conversations retrieved successfully",
    data: {
      conversations: populatedConversations,
      pagination: {
        currentPage: page,
        totalPages,
        totalConversations: totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
  };
};

const getUnreadCountService = async (userId) => {
  const unreadCount = await Message.countDocuments({
    receiver: userId,
    isRead: false,
    isDeleted: false,
  });

  return {
    success: true,
    message: "Unread count retrieved successfully",
    data: { unreadCount },
  };
};

module.exports = {
  sendMessageService,
  getMessagesService,
  markAsReadService,
  deleteMessageService,
  getConversationsService,
  getUnreadCountService,
};
