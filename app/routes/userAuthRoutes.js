const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  register,
  login,
  refreshToken,
  logout,
  logoutAllDevices,
  findUser,
  getAllUsers,
  getUserById,
} = require("../controllers/userAuthController");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

// Protected routes
router.post("/logout-all-devices", authenticateToken, logoutAllDevices);
router.get("/users", authenticateToken, getAllUsers);
router.get("/users/:userId", authenticateToken, getUserById);
router.get("/find/:email", authenticateToken, findUser);

module.exports = router;
