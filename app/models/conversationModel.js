const mongoose = require("mongoose");
const { generateEncryptionKey } = require("../utils/encryption");

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    encryptionKey: {
      type: String,
      required: true,
      select: false, // Don't include in queries by default
    },
    conversationId: {
      type: String,
      required: true,
      unique: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ conversationId: 1 });
conversationSchema.index({ lastMessageAt: -1 });

// Pre-save middleware to generate conversation ID if not provided
conversationSchema.pre("save", function (next) {
  if (!this.conversationId) {
    const sortedParticipants = this.participants
      .map((p) => p.toString())
      .sort();
    this.conversationId = sortedParticipants.join("_");
  }
  next();
});

// Method to get conversation by participants
conversationSchema.statics.findByParticipants = function (participantIds) {
  const sortedIds = participantIds.map((id) => id.toString()).sort();
  const conversationId = sortedIds.join("_");
  return this.findOne({ conversationId });
};

// Method to get or create conversation
conversationSchema.statics.getOrCreate = async function (
  participantIds,
  encryptionKey
) {
  const sortedIds = participantIds.map((id) => id.toString()).sort();
  const conversationId = sortedIds.join("_");

  let conversation = await this.findOne({ conversationId });

  if (!conversation) {
    // Create new conversation with encryption key
    conversation = new this({
      participants: participantIds,
      encryptionKey: encryptionKey || generateEncryptionKey(),
      conversationId,
    });
    await conversation.save();
  } else if (!conversation.encryptionKey) {
    // Fix existing conversation that doesn't have encryption key
    conversation.encryptionKey = encryptionKey || generateEncryptionKey();
    await conversation.save();
  }

  return conversation;
};

module.exports = mongoose.model("Conversation", conversationSchema);
