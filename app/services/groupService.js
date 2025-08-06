const Group = require("../models/groupModel");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const { generateEncryptionKey } = require("../utils/encryption");
const socketService = require("./socketService");

const createGroupService = async (payload, adminId) => {
  try {
    console.log('Creating group with payload:', payload, 'adminId:', adminId);
    
    const { name, description, participants = [], isPrivate = false, avatar } = payload;

    // Validate admin exists
    const admin = await User.findById(adminId);
    if (!admin) {
      console.log('Admin user not found:', adminId);
      return { success: false, message: "Admin user not found" };
    }

    console.log('Admin found:', admin.name);

    // Generate encryption key for group
    const encryptionKey = generateEncryptionKey();

    // Create group with admin as first participant
    const group = new Group({
      name,
      description,
      admin: adminId,
      isPrivate,
      avatar,
      encryptionKey,
      participants: [
        {
          user: adminId,
          role: "admin",
          joinedAt: new Date(),
          isActive: true,
        },
      ],
    });

    console.log('Group created with participants:', group.participants);

    // Add other participants
    for (const participantId of participants) {
      const user = await User.findById(participantId);
      if (user) {
        group.addParticipant(participantId, "member");
        console.log('Added participant:', user.name);
      }
    }

    await group.save();
    console.log('Group saved with ID:', group._id);

    // Populate participants details
    await group.populate([
      { path: "admin", select: "_id name email" },
      { path: "participants.user", select: "_id name email" },
    ]);

    console.log('Final group data:', {
      id: group._id,
      name: group.name,
      admin: group.admin,
      participants: group.participants
    });

    return {
      success: true,
      message: "Group created successfully",
      data: group,
    };
  } catch (error) {
    console.error('Error in createGroupService:', error);
    return { success: false, message: error.message };
  }
};

const updateGroupService = async (groupId, payload, userId) => {
  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return { success: false, message: "Group not found" };
    }

    // Check if user is admin
    if (!group.isAdmin(userId)) {
      return { success: false, message: "Only admins can update group" };
    }

    // Update allowed fields
    const allowedUpdates = ["name", "description", "avatar", "isPrivate"];
    for (const field of allowedUpdates) {
      if (payload[field] !== undefined) {
        group[field] = payload[field];
      }
    }

    await group.save();

    // Populate participants details
    await group.populate([
      { path: "admin", select: "_id name email" },
      { path: "participants.user", select: "_id name email" },
    ]);

    return {
      success: true,
      message: "Group updated successfully",
      data: group,
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const deleteGroupService = async (groupId, userId) => {
  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return { success: false, message: "Group not found" };
    }

    // Check if user is admin
    if (!group.isAdmin(userId)) {
      return { success: false, message: "Only admins can delete group" };
    }

    // Soft delete group
    group.isActive = false;
    await group.save();

    return {
      success: true,
      message: "Group deleted successfully",
      data: { groupId },
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const getGroupService = async (groupId, userId) => {
  try {
    console.log('Getting group service for groupId:', groupId, 'userId:', userId);
    
    const group = await Group.findById(groupId)
      .populate([
        { path: "admin", select: "_id name email" },
        { path: "participants.user", select: "_id name email" },
        { path: "lastMessage", select: "content sender createdAt" },
      ]);

    if (!group || !group.isActive) {
      console.log('Group not found or not active');
      return { success: false, message: "Group not found" };
    }

    console.log('Group found:', {
      id: group._id,
      name: group.name,
      admin: group.admin,
      participants: group.participants,
      isActive: group.isActive
    });

    // Check if user is participant
    const isParticipant = group.isParticipant(userId);
    console.log('Is user participant:', isParticipant, 'for userId:', userId);
    
    if (!isParticipant) {
      console.log('User is not a participant of this group');
      return { success: false, message: "You are not a member of this group" };
    }

    console.log('User is participant, returning group data');
    return {
      success: true,
      message: "Group details retrieved successfully",
      data: group,
    };
  } catch (error) {
    console.error('Error in getGroupService:', error);
    return { success: false, message: error.message };
  }
};

const getUserGroupsService = async (userId) => {
  try {
    console.log('Getting user groups for userId:', userId);
    
    // Find groups where user is either a participant OR the admin
    const groups = await Group.find({
      $or: [
        { "participants.user": userId, "participants.isActive": true },
        { admin: userId }
      ],
      isActive: true,
    })
      .populate([
        { path: "admin", select: "_id name email" },
        { path: "participants.user", select: "_id name email" },
        { path: "lastMessage", select: "content sender createdAt" },
      ])
      .sort({ lastMessageAt: -1 });

    console.log('Found groups for user:', groups.length);
    console.log('Groups:', groups.map(g => ({ id: g._id, name: g.name, admin: g.admin })));

    return {
      success: true,
      message: "User groups retrieved successfully",
      data: { groups },
    };
  } catch (error) {
    console.error('Error in getUserGroupsService:', error);
    return { success: false, message: error.message };
  }
};

const addParticipantService = async (groupId, participantId, role, adminId) => {
  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return { success: false, message: "Group not found" };
    }

    // Check if user is admin
    if (!group.isAdmin(adminId)) {
      return { success: false, message: "Only admins can add participants" };
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return { success: false, message: "Participant user not found" };
    }

    // Add participant
    group.addParticipant(participantId, role || "member");
    await group.save();

    // Populate participants details
    await group.populate([
      { path: "admin", select: "_id name email" },
      { path: "participants.user", select: "_id name email" },
    ]);

    return {
      success: true,
      message: "Participant added successfully",
      data: group,
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const removeParticipantService = async (groupId, participantId, adminId) => {
  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return { success: false, message: "Group not found" };
    }

    // Check if user is admin
    if (!group.isAdmin(adminId)) {
      return { success: false, message: "Only admins can remove participants" };
    }

    // Check if trying to remove admin
    if (group.admin.toString() === participantId) {
      return { success: false, message: "Cannot remove group admin" };
    }

    // Remove participant
    group.removeParticipant(participantId);
    await group.save();

    // Populate participants details
    await group.populate([
      { path: "admin", select: "_id name email" },
      { path: "participants.user", select: "_id name email" },
    ]);

    return {
      success: true,
      message: "Participant removed successfully",
      data: group,
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const getGroupMessagesService = async (groupId, userId, options) => {
  try {
    console.log('Getting group messages for groupId:', groupId, 'userId:', userId);
    
    const group = await Group.findById(groupId)
      .populate([
        { path: "admin", select: "_id name email" },
        { path: "participants.user", select: "_id name email" },
      ]);
      
    if (!group || !group.isActive) {
      console.log('Group not found or not active:', groupId);
      return { success: false, message: "Group not found" };
    }

    // Check if user is participant
    const isParticipant = group.isParticipant(userId);
    console.log('Is user participant:', isParticipant, 'for userId:', userId);
    
    if (!isParticipant) {
      console.log('User is not a participant of this group');
      return { success: false, message: "You are not a member of this group" };
    }

    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      group: groupId,
      messageScope: "group",
      isDeleted: false,
    })
      .populate([
        { path: "sender", select: "_id name email" },
        { path: "replyTo", select: "content sender" },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({
      group: groupId,
      messageScope: "group",
      isDeleted: false,
    });

    console.log('Found messages:', messages.length, 'total:', total);

    return {
      success: true,
      message: "Group messages retrieved successfully",
      data: {
        messages: messages.reverse(), // Show oldest first
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    console.error('Error in getGroupMessagesService:', error);
    return { success: false, message: error.message };
  }
};

const sendGroupMessageService = async (payload, senderId) => {
  try {
    const { groupId, content, messageType = "text", mediaUrl, replyTo } = payload;

    console.log('Sending group message:', { groupId, senderId, content });

    // First get the group with encryption key
    const group = await Group.findById(groupId).select("+encryptionKey");
    if (!group || !group.isActive) {
      console.log('Group not found or not active:', groupId);
      return { success: false, message: "Group not found" };
    }

    // Then get the populated group for membership check
    const populatedGroup = await Group.findById(groupId)
      .populate([
        { path: "admin", select: "_id name email" },
        { path: "participants.user", select: "_id name email" },
      ]);

    if (!populatedGroup) {
      console.log('Populated group not found:', groupId);
      return { success: false, message: "Group not found" };
    }

    // Check if user is participant using populated group
    const isParticipant = populatedGroup.isParticipant(senderId);
    console.log('Is user participant:', isParticipant, 'for senderId:', senderId);
    
    if (!isParticipant) {
      console.log('User is not a participant of this group');
      return { success: false, message: "You are not a member of this group" };
    }

    // Encrypt message content using the group with encryption key
    const encryptedContent = require("../utils/encryption").encryptMessage(
      content,
      group.encryptionKey
    );

    // Create message
    const message = new Message({
      sender: senderId,
      group: groupId,
      content,
      encryptedContent,
      messageType,
      mediaUrl,
      replyTo,
      groupId: groupId,
      messageScope: "group",
    });

    await message.save();
    console.log('Message saved:', message._id);

    // Populate sender details
    await message.populate([
      { path: "sender", select: "_id name email" },
      { path: "replyTo", select: "content sender" },
    ]);

    // Update group's last message
    group.lastMessage = message._id;
    group.lastMessageAt = new Date();
    await group.save();

    // Emit to all group participants via WebSocket
    const participants = populatedGroup.participants
      .filter((p) => p.isActive)
      .map((p) => {
        const participantUserId = p.user._id || p.user;
        return participantUserId.toString();
      });

    console.log('Sending to participants:', participants);

    participants.forEach((participantId) => {
      if (participantId !== senderId.toString()) {
        socketService.sendToUser(participantId, "group_message", {
          success: true,
          message: "New group message received",
          data: message,
        });
      }
    });

    return {
      success: true,
      message: "Group message sent successfully",
      data: message,
    };
  } catch (error) {
    console.error('Error in sendGroupMessageService:', error);
    return { success: false, message: error.message };
  }
};

module.exports = {
  createGroupService,
  updateGroupService,
  deleteGroupService,
  getGroupService,
  getUserGroupsService,
  addParticipantService,
  removeParticipantService,
  getGroupMessagesService,
  sendGroupMessageService,
}; 