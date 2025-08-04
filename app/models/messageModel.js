const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    encryptedContent: {
      type: String,
      required: true,
      select: false, // Don't include in queries by default
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file", "audio"],
      default: "text",
    },
    mediaUrl: {
      type: String,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    conversationId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: 1 });

// Virtual for conversation ID (unique identifier for a chat between two users)
// Note: We're using a real field instead of virtual since conversationId is stored in DB
messageSchema.virtual("conversationKey").get(function () {
  const users = [this.sender.toString(), this.receiver.toString()].sort();
  return users.join("_");
});

// Ensure virtual fields are serialized
messageSchema.set("toJSON", { virtuals: true });
messageSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Message", messageSchema);
