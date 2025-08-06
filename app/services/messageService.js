const Message = require("../models/messageModel");
const Conversation = require("../models/conversationModel");
const User = require("../models/userModel");
const { encryptMessage, decryptMessage } = require("../utils/encryption");

/**
 * Get user conversations with pagination
 */
const getConversationsService = async (userId, page = 1, limit = 20) => {
  try {
    const skip = (page - 1) * limit;

    // Find conversations where user is either sender or receiver
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { receiver: userId }
          ],
          messageScope: "private",
          isDeleted: { $ne: true }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", userId] },
              "$receiver",
              "$sender"
            ]
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiver", userId] },
                    { $eq: ["$isRead", false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "otherUser"
        }
      },
      {
        $unwind: "$otherUser"
      },
      {
        $project: {
          otherUser: {
            _id: "$otherUser._id",
            name: "$otherUser.name",
            email: "$otherUser.email"
          },
          lastMessage: {
            _id: "$lastMessage._id",
            content: "$lastMessage.content",
            createdAt: "$lastMessage.createdAt",
            sender: "$lastMessage.sender"
          },
          unreadCount: 1
        }
      },
      {
        $sort: { "lastMessage.createdAt": -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // Get total count for pagination
    const totalCount = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { receiver: userId }
          ],
          messageScope: "private",
          isDeleted: { $ne: true }
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", userId] },
              "$receiver",
              "$sender"
            ]
          }
        }
      },
      {
        $count: "total"
      }
    ]);

    return {
      success: true,
      message: "Conversations retrieved successfully",
      data: {
        conversations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount.length > 0 ? totalCount[0].total : 0,
          pages: Math.ceil((totalCount.length > 0 ? totalCount[0].total : 0) / limit)
        }
      }
    };
  } catch (error) {
    throw new Error(`Failed to retrieve conversations: ${error.message}`);
  }
};

/**
 * Get conversation messages between two users
 */
const getConversationMessagesService = async (userId, receiverId, page = 1, limit = 50) => {
  try {
    const skip = (page - 1) * limit;

    // Find messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: receiverId },
        { sender: receiverId, receiver: userId }
      ],
      messageScope: "private",
      isDeleted: { $ne: true }
    })
    .populate("sender", "_id name email")
    .populate("receiver", "_id name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      {
        sender: receiverId,
        receiver: userId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    // Get total count for pagination
    const totalCount = await Message.countDocuments({
      $or: [
        { sender: userId, receiver: receiverId },
        { sender: receiverId, receiver: userId }
      ],
      messageScope: "private",
      isDeleted: { $ne: true }
    });

    return {
      success: true,
      message: "Messages retrieved successfully",
      data: {
        messages: messages.reverse(), // Show oldest first
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    };
  } catch (error) {
    throw new Error(`Failed to retrieve messages: ${error.message}`);
  }
};

/**
 * Send a new message
 */
const sendMessageService = async (senderId, receiverId, content, messageType = "text", mediaUrl = null) => {
  try {
    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      throw new Error("Receiver not found");
    }

    // Get or create conversation
    const conversation = await Conversation.getOrCreate(
      [senderId, receiverId],
      null // Let the model generate encryption key
    );

    // Get encryption key for conversation
    const conversationWithKey = await Conversation.findById(conversation._id).select("+encryptionKey");
    const encryptionKey = conversationWithKey.encryptionKey;

    // Encrypt message content
    const encryptedContent = encryptMessage(content, encryptionKey);

    // Create message
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content: content, // Keep plain text for search
      encryptedContent: encryptedContent,
      messageType,
      mediaUrl,
      conversationId: conversation.conversationId,
      messageScope: "private"
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Populate sender and receiver details
    await message.populate([
      { path: "sender", select: "_id name email" },
      { path: "receiver", select: "_id name email" }
    ]);

    return {
      success: true,
      message: "Message sent successfully",
      data: message
    };
  } catch (error) {
    throw new Error(`Failed to send message: ${error.message}`);
  }
};

/**
 * Mark message as read
 */
const markMessageAsReadService = async (userId, messageId) => {
  try {
    const message = await Message.findOneAndUpdate(
      {
        _id: messageId,
        receiver: userId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    ).populate("sender", "_id name email");

    if (!message) {
      throw new Error("Message not found or already read");
    }

    return {
      success: true,
      message: "Message marked as read",
      data: message
    };
  } catch (error) {
    throw new Error(`Failed to mark message as read: ${error.message}`);
  }
};

/**
 * Delete message (soft delete)
 */
const deleteMessageService = async (userId, messageId) => {
  try {
    const message = await Message.findOneAndUpdate(
      {
        _id: messageId,
        sender: userId,
        isDeleted: { $ne: true }
      },
      {
        isDeleted: true,
        deletedAt: new Date()
      },
      { new: true }
    );

    if (!message) {
      throw new Error("Message not found or you don't have permission to delete it");
    }

    return {
      success: true,
      message: "Message deleted successfully",
      data: message
    };
  } catch (error) {
    throw new Error(`Failed to delete message: ${error.message}`);
  }
};

/**
 * Get unread message count
 */
const getUnreadCountService = async (userId) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiver: userId,
      isRead: false,
      messageScope: "private",
      isDeleted: { $ne: true }
    });

    return {
      success: true,
      message: "Unread count retrieved successfully",
      data: {
        unreadCount
      }
    };
  } catch (error) {
    throw new Error(`Failed to retrieve unread count: ${error.message}`);
  }
};

/**
 * Search messages
 */
const searchMessagesService = async (userId, query, page = 1, limit = 20) => {
  try {
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ],
      content: { $regex: query, $options: "i" },
      messageScope: "private",
      isDeleted: { $ne: true }
    })
    .populate("sender", "_id name email")
    .populate("receiver", "_id name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const totalCount = await Message.countDocuments({
      $or: [
        { sender: userId },
        { receiver: userId }
      ],
      content: { $regex: query, $options: "i" },
      messageScope: "private",
      isDeleted: { $ne: true }
    });

    return {
      success: true,
      message: "Messages search completed",
      data: {
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    };
  } catch (error) {
    throw new Error(`Failed to search messages: ${error.message}`);
  }
};

module.exports = {
  getConversationsService,
  getConversationMessagesService,
  sendMessageService,
  markMessageAsReadService,
  deleteMessageService,
  getUnreadCountService,
  searchMessagesService
}; 