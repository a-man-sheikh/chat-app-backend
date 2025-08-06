const {
  createGroup,
  updateGroup,
  deleteGroup,
  getGroup,
  getUserGroups,
  addParticipant,
  removeParticipant,
  getGroupMessages,
  sendGroupMessage,
} = require("../controllers/groupController");
const {
  createGroupSchema,
  updateGroupSchema,
  addParticipantSchema,
  removeParticipantSchema,
  sendGroupMessageSchema,
} = require("../validations/groupValidation");
const validate = require("../middleware/validate");
const { authenticateToken } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();

// Group management routes
router.post(
  "/create",
  authenticateToken,
  validate(createGroupSchema),
  createGroup
);

router.put(
  "/:groupId",
  authenticateToken,
  validate(updateGroupSchema),
  updateGroup
);

router.delete("/:groupId", authenticateToken, deleteGroup);

router.get("/:groupId", authenticateToken, getGroup);

router.get("/user/groups", authenticateToken, getUserGroups);

// Participant management routes
router.post(
  "/participant/add",
  authenticateToken,
  validate(addParticipantSchema),
  addParticipant
);

router.post(
  "/participant/remove",
  authenticateToken,
  validate(removeParticipantSchema),
  removeParticipant
);

// Group messaging routes
router.get(
  "/:groupId/messages",
  authenticateToken,
  getGroupMessages
);

router.post(
  "/message/send",
  authenticateToken,
  validate(sendGroupMessageSchema),
  sendGroupMessage
);

module.exports = router; 