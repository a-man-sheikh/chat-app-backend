const {
  createGroupService,
  updateGroupService,
  deleteGroupService,
  getGroupService,
  getUserGroupsService,
  addParticipantService,
  removeParticipantService,
  getGroupMessagesService,
  sendGroupMessageService,
} = require("../services/groupService");
const { successResponse } = require("../utils/responseHandler");
const asyncHandler = require("../middleware/asyncHandler");

const createGroup = asyncHandler(async (req, res) => {
  const payload = req.body;
  const adminId = req.user._id;

  console.log('Group controller - createGroup:', { payload, adminId, user: req.user });

  const result = await createGroupService(payload, adminId);

  if (result.success) {
    return successResponse(res, 201, result.message, result.data);
  } else {
    throw new Error(result.message);
  }
});

const updateGroup = asyncHandler(async (req, res) => {
  const payload = req.body;
  const userId = req.user._id;
  const groupId = req.params.groupId;

  const result = await updateGroupService(groupId, payload, userId);

  if (result.success) {
    return successResponse(res, 200, result.message, result.data);
  } else {
    throw new Error(result.message);
  }
});

const deleteGroup = asyncHandler(async (req, res) => {
  const groupId = req.params.groupId;
  const userId = req.user._id;

  const result = await deleteGroupService(groupId, userId);

  if (result.success) {
    return successResponse(res, 200, result.message, result.data);
  } else {
    throw new Error(result.message);
  }
});

const getGroup = asyncHandler(async (req, res) => {
  const groupId = req.params.groupId;
  const userId = req.user._id;

  console.log('Group controller - getGroup:', { groupId, userId, user: req.user });

  const result = await getGroupService(groupId, userId);

  if (result.success) {
    return successResponse(res, 200, result.message, result.data);
  } else {
    throw new Error(result.message);
  }
});

const getUserGroups = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  console.log('Group controller - getUserGroups:', { userId, user: req.user });

  const result = await getUserGroupsService(userId);

  if (result.success) {
    return successResponse(res, 200, result.message, result.data);
  } else {
    throw new Error(result.message);
  }
});

const addParticipant = asyncHandler(async (req, res) => {
  const { groupId, userId: participantId, role } = req.body;
  const adminId = req.user._id;

  const result = await addParticipantService(groupId, participantId, role, adminId);

  if (result.success) {
    return successResponse(res, 200, result.message, result.data);
  } else {
    throw new Error(result.message);
  }
});

const removeParticipant = asyncHandler(async (req, res) => {
  const { groupId, userId: participantId } = req.body;
  const adminId = req.user._id;

  const result = await removeParticipantService(groupId, participantId, adminId);

  if (result.success) {
    return successResponse(res, 200, result.message, result.data);
  } else {
    throw new Error(result.message);
  }
});

const getGroupMessages = asyncHandler(async (req, res) => {
  const groupId = req.params.groupId;
  const userId = req.user._id;
  const { page = 1, limit = 50 } = req.query;

  const result = await getGroupMessagesService(groupId, userId, { page, limit });

  if (result.success) {
    return successResponse(res, 200, result.message, result.data);
  } else {
    throw new Error(result.message);
  }
});

const sendGroupMessage = asyncHandler(async (req, res) => {
  const payload = req.body;
  const senderId = req.user._id;

  const result = await sendGroupMessageService(payload, senderId);

  if (result.success) {
    return successResponse(res, 201, result.message, result.data);
  } else {
    throw new Error(result.message);
  }
});

module.exports = {
  createGroup,
  updateGroup,
  deleteGroup,
  getGroup,
  getUserGroups,
  addParticipant,
  removeParticipant,
  getGroupMessages,
  sendGroupMessage,
}; 