const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["admin", "moderator", "member"],
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    avatar: {
      type: String,
      trim: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    encryptionKey: {
      type: String,
      required: true,
      select: false, // Don't include in queries by default
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
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
groupSchema.index({ participants: 1 });
groupSchema.index({ admin: 1 });
groupSchema.index({ lastMessageAt: -1 });

// Method to check if user is participant
groupSchema.methods.isParticipant = function (userId) {
  console.log('Checking if user is participant:', {
    userId: userId,
    adminId: this.admin,
    participants: this.participants.map(p => ({ user: p.user, isActive: p.isActive }))
  });
  
  // Check if user is admin (handle both populated and unpopulated admin field)
  const adminId = this.admin._id || this.admin;
  if (adminId.toString() === userId.toString()) {
    console.log('User is admin, returning true');
    return true;
  }
  
  // Check if user is in participants list (handle both populated and unpopulated user field)
  const isInParticipants = this.participants.some(
    (participant) => {
      const participantUserId = participant.user._id || participant.user;
      return participantUserId.toString() === userId.toString() && participant.isActive;
    }
  );
  
  console.log('User in participants list:', isInParticipants);
  return isInParticipants;
};

// Method to check if user is admin
groupSchema.methods.isAdmin = function (userId) {
  // Check if user is the main admin (handle both populated and unpopulated admin field)
  const adminId = this.admin._id || this.admin;
  if (adminId.toString() === userId.toString()) {
    return true;
  }
  
  // Check if user is an admin in participants list
  return this.participants.some(
    (participant) => {
      const participantUserId = participant.user._id || participant.user;
      return participantUserId.toString() === userId.toString() &&
             participant.role === "admin" &&
             participant.isActive;
    }
  );
};

// Method to add participant
groupSchema.methods.addParticipant = function (userId, role = "member") {
  const existingParticipant = this.participants.find(
    (p) => {
      const participantUserId = p.user._id || p.user;
      return participantUserId.toString() === userId.toString();
    }
  );

  if (existingParticipant) {
    existingParticipant.isActive = true;
    existingParticipant.role = role;
  } else {
    this.participants.push({
      user: userId,
      role: role,
      joinedAt: new Date(),
      isActive: true,
    });
  }
};

// Method to remove participant
groupSchema.methods.removeParticipant = function (userId) {
  const participant = this.participants.find(
    (p) => {
      const participantUserId = p.user._id || p.user;
      return participantUserId.toString() === userId.toString();
    }
  );
  if (participant) {
    participant.isActive = false;
  }
};

module.exports = mongoose.model("Group", groupSchema); 