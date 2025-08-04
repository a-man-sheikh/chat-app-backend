const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Message = require("../models/messageModel");
const Conversation = require("../models/conversationModel");
const { encryptMessage, decryptMessage } = require("../utils/encryption");

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socket
    this.userSockets = new Map(); // socketId -> userId
  }

  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://127.0.0.1:5500",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        // For Postman WebSocket testing, accept userId and userName directly
        if (socket.handshake.auth.userId && socket.handshake.auth.userName) {
          const user = await User.findById(socket.handshake.auth.userId);
          if (!user) {
            return next(new Error("Authentication error: User not found"));
          }
          socket.userId = user._id.toString();
          socket.user = user;
          return next();
        }

        // For JWT token authentication (production)
        const token =
          socket.handshake.auth.token || socket.handshake.headers.authorization;

        if (!token) {
          return next(
            new Error("Authentication error: Token or userId required")
          );
        }

        // Verify JWT token
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "your-secret-key"
        );
        const user = await User.findById(decoded.userId);

        if (!user) {
          return next(new Error("Authentication error: User not found"));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        next(new Error("Authentication error: " + error.message));
      }
    });
  }

  setupEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`User connected: ${socket.userId}`);

      // Store user connection
      this.connectedUsers.set(socket.userId, socket);
      this.userSockets.set(socket.id, socket.userId);

      // Join user's personal room
      socket.join(`user_${socket.userId}`);

      // Handle real-time message sending
      socket.on("send_message", async (data) => {
        try {
          const {
            receiver,
            content,
            messageType = "text",
            mediaUrl,
            replyTo,
          } = data;

          // Get or create conversation
          const conversation = await Conversation.getOrCreate(
            [socket.userId, receiver],
            null // Will be generated if new conversation
          );

          // Get encryption key for conversation
          const conversationWithKey = await Conversation.findById(
            conversation._id
          ).select("+encryptionKey");
          const encryptionKey = conversationWithKey.encryptionKey;

          // Encrypt message content
          const encryptedContent = encryptMessage(content, encryptionKey);

          // Create message
          const message = new Message({
            sender: socket.userId,
            receiver: receiver,
            content: content, // Keep plain text for search (optional)
            encryptedContent: encryptedContent,
            messageType,
            mediaUrl,
            replyTo,
            conversationId: conversation.conversationId,
          });

          await message.save();

          // Populate sender and receiver details
          await message.populate([
            { path: "sender", select: "_id name email" },
            { path: "receiver", select: "_id name email" },
            { path: "replyTo", select: "content sender" },
          ]);

          // Update conversation
          conversation.lastMessage = message._id;
          conversation.lastMessageAt = new Date();
          await conversation.save();

          // Emit to sender
          socket.emit("message_sent", {
            success: true,
            message: "Message sent successfully",
            data: message,
          });

          // Emit to receiver if online
          const receiverSocket = this.connectedUsers.get(receiver);
          if (receiverSocket) {
            receiverSocket.emit("message", {
              success: true,
              message: "New message received",
              data: message,
            });
          }
        } catch (error) {
          console.error("Error sending message:", error);
          socket.emit("message_error", {
            success: false,
            message: "Failed to send message",
            error: error.message,
          });
        }
      });

      // Handle typing indicators
      socket.on("typing_start", (data) => {
        const { receiver } = data;
        const receiverSocket = this.connectedUsers.get(receiver);
        if (receiverSocket) {
          receiverSocket.emit("typing_start", {
            userId: socket.userId,
            userName: socket.user.name,
            receiver: receiver,
          });
        }
      });

      socket.on("typing_stop", (data) => {
        const { receiver } = data;
        const receiverSocket = this.connectedUsers.get(receiver);
        if (receiverSocket) {
          receiverSocket.emit("typing_stop", {
            userId: socket.userId,
            userName: socket.user.name,
            receiver: receiver,
          });
        }
      });

      // Handle message read status
      socket.on("mark_read", async (data) => {
        try {
          const { messageId } = data;

          const message = await Message.findById(messageId);
          if (!message) {
            throw new Error("Message not found");
          }

          if (message.receiver.toString() !== socket.userId) {
            throw new Error("You can only mark messages sent to you as read");
          }

          if (!message.isRead) {
            message.isRead = true;
            message.readAt = new Date();
            await message.save();

            // Notify sender that message was read
            const senderSocket = this.connectedUsers.get(
              message.sender.toString()
            );
            if (senderSocket) {
              senderSocket.emit("message_read", {
                messageId: message._id,
                readAt: message.readAt,
              });
            }
          }

          socket.emit("read_confirmed", {
            success: true,
            messageId: message._id,
          });
        } catch (error) {
          socket.emit("read_error", {
            success: false,
            message: "Failed to mark message as read",
            error: error.message,
          });
        }
      });

      // Handle online status
      socket.on("set_online_status", (data) => {
        const { isOnline } = data;
        // Broadcast online status to all connected users
        socket.broadcast.emit("user_status_change", {
          userId: socket.userId,
          userName: socket.user.name,
          isOnline,
        });
      });

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.userId}`);

        // Remove from connected users
        this.connectedUsers.delete(socket.userId);
        this.userSockets.delete(socket.id);

        // Broadcast offline status
        socket.broadcast.emit("user_status_change", {
          userId: socket.userId,
          userName: socket.user.name,
          isOnline: false,
        });
      });
    });
  }

  // Method to get online users
  getOnlineUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  // Method to check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  // Method to send message to specific user
  sendToUser(userId, event, data) {
    const userSocket = this.connectedUsers.get(userId);
    if (userSocket) {
      userSocket.emit(event, data);
    }
  }

  // Method to broadcast to all users
  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }

  // Method to broadcast to all except sender
  broadcastToOthers(senderId, event, data) {
    this.io.except(`user_${senderId}`).emit(event, data);
  }
}

module.exports = new SocketService();
