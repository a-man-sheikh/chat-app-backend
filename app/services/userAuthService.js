const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwtUtils");

const registerService = async (payload) => {
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

  // Generate JWT token
  const token = generateToken({ userId: savedUser._id });

  // Remove password from response
  const userResponse = {
    _id: savedUser._id,
    name: savedUser.name,
    email: savedUser.email,
    isVerified: savedUser.isVerified,
    createdAt: savedUser.createdAt,
    token,
  };

  return {
    success: true,
    message: "User registered successfully",
    data: userResponse,
  };
};

const loginService = async (payload) => {
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

  // Generate JWT token
  const token = generateToken({ userId: user._id });

  // Remove password from response
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    token,
  };

  return {
    success: true,
    message: "Login successful",
    data: userResponse,
  };
};

module.exports = { registerService, loginService };
