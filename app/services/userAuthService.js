const User = require("../models/userModel");
const RefreshToken = require("../models/refreshTokenModel");
const bcrypt = require("bcryptjs");

const { generateAccessToken, generateRefreshToken, generateRandomToken } = require("../utils/jwtUtils");

/**
 * Save refresh token to database
 */
const saveRefreshToken = async (userId, refreshToken, deviceInfo) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  const tokenDoc = new RefreshToken({
    userId,
    token: refreshToken,
    expiresAt,
    deviceInfo,
  });

  return await tokenDoc.save();
};

/**
 * Revoke refresh token
 */
const revokeRefreshToken = async (token) => {
  return await RefreshToken.findOneAndUpdate(
    { token },
    { isRevoked: true },
    { new: true }
  );
};

/**
 * Revoke all refresh tokens for a user
 */
const revokeAllUserTokens = async (userId) => {
  return await RefreshToken.updateMany(
    { userId },
    { isRevoked: true }
  );
};

const registerService = async (payload, deviceInfo = {}) => {
  const { email, password, name } = payload;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    throw new Error("User already exists with this email");
  }

  // Hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create new user
  const newUser = new User({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    isVerified: false,
  });

  // Save user to database
  const savedUser = await newUser.save();

  // Generate tokens
  const accessToken = generateAccessToken({ userId: savedUser._id });
  const refreshToken = generateRandomToken();

  // Save refresh token
  await saveRefreshToken(savedUser._id, refreshToken, deviceInfo);

  // Remove password from response
  const userResponse = {
    _id: savedUser._id,
    name: savedUser.name,
    email: savedUser.email,
    isVerified: savedUser.isVerified,
    createdAt: savedUser.createdAt,
    accessToken,
    refreshToken,
  };

  return {
    success: true,
    message: "User registered successfully",
    data: userResponse,
  };
};

const loginService = async (payload, deviceInfo = {}) => {
  const { email, password } = payload;

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Generate tokens
  const accessToken = generateAccessToken({ userId: user._id });
  const refreshToken = generateRandomToken();

  // Save refresh token
  await saveRefreshToken(user._id, refreshToken, deviceInfo);

  // Remove password from response
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    accessToken,
    refreshToken,
  };

  return {
    success: true,
    message: "Login successful",
    data: userResponse,
  };
};

const refreshTokenService = async (refreshToken) => {
  // Find the refresh token in database
  const tokenDoc = await RefreshToken.findOne({ 
    token: refreshToken, 
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  });

  if (!tokenDoc) {
    throw new Error("Invalid or expired refresh token");
  }

  // Get user
  const user = await User.findById(tokenDoc.userId).select("-password");
  
  if (!user) {
    throw new Error("User not found");
  }

  // Generate new tokens
  const newAccessToken = generateAccessToken({ userId: user._id });
  const newRefreshToken = generateRandomToken();

  // Revoke old refresh token
  await revokeRefreshToken(refreshToken);

  // Save new refresh token
  await saveRefreshToken(user._id, newRefreshToken, tokenDoc.deviceInfo);

  return {
    success: true,
    message: "Tokens refreshed successfully",
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      }
    },
  };
};

const logoutService = async (refreshToken) => {
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  return {
    success: true,
    message: "Logged out successfully",
  };
};

const logoutAllDevicesService = async (userId) => {
  await revokeAllUserTokens(userId);

  return {
    success: true,
    message: "Logged out from all devices successfully",
  };
};

const findUserService = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select("-password");

  if (!user) {
    throw new Error("User not found");
  }

  return {
    success: true,
    message: "User found successfully",
    data: user,
  };
};

const getAllUsersService = async (currentUserId) => {
  const users = await User.find({ _id: { $ne: currentUserId } })
    .select("_id name email")
    .sort({ name: 1 });

  return {
    success: true,
    message: "Users retrieved successfully",
    data: users,
  };
};

const getUserByIdService = async (userId) => {
  const user = await User.findById(userId).select("_id name email");

  if (!user) {
    throw new Error("User not found");
  }

  return {
    success: true,
    message: "User found successfully",
    data: user,
  };
};

module.exports = { 
  registerService, 
  loginService, 
  refreshTokenService,
  logoutService,
  logoutAllDevicesService,
  findUserService, 
  getAllUsersService, 
  getUserByIdService 
};
