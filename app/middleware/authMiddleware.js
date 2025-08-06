const { verifyAccessToken, verifyRefreshToken } = require("../utils/jwtUtils");
const User = require("../models/userModel");
const asyncHandler = require("./asyncHandler");

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user to request object
 */
const authenticateToken = asyncHandler(async (req, res, next) => {
  // Get token from header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required",
      error: "No token provided"
    });
  }

  try {
    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select("-password");
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
        error: "User not found"
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    // Check if token is expired
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token expired",
        error: "Access token has expired. Please use refresh token to get a new one.",
        code: "TOKEN_EXPIRED"
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid token",
      error: error.message
    });
  }
});

/**
 * Optional Authentication Middleware
 * Attaches user if token is provided, but doesn't require it
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select("-password");
      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Token is invalid, but we don't throw error for optional auth
      console.log("Optional auth failed:", error.message);
    }
  }
  
  next();
});

/**
 * Refresh Token Authentication Middleware
 * Verifies refresh token and attaches user to request object
 */
const authenticateRefreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token required",
      error: "No refresh token provided"
    });
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select("-password");
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
        error: "User not found"
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid refresh token",
      error: error.message
    });
  }
});

module.exports = {
  authenticateToken,
  optionalAuth,
  authenticateRefreshToken
}; 