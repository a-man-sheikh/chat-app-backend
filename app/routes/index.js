const express = require("express");
const router = express.Router();

const userAuthRoutes = require("./userAuthRoutes");
const messageRoutes = require("./messageRoutes");

// Health check endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Chat App API is running",
    data: {
      version: "1.0.0",
      websocket_url: process.env.CLIENT_URL || "http://localhost:5000",
      endpoints: {
        auth: "/api/user",
        messages: "/api/message",
        websocket: "ws://localhost:5000",
      },
    },
  });
});

router.use("/user", userAuthRoutes);
router.use("/message", messageRoutes);

module.exports = router;
