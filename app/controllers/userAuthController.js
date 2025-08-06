const userAuthService = require("../services/userAuthService");
const asyncHandler = require("../middleware/asyncHandler");
const { validateRegistration, validateLogin } = require("../validations/userValidation");

/**
 * Get device information from request
 */
const getDeviceInfo = (req) => {
  return {
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip || req.connection.remoteAddress || '',
  };
};

const register = asyncHandler(async (req, res) => {
  const { error } = validateRegistration(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      error: error.details[0].message,
    });
  }

  const deviceInfo = getDeviceInfo(req);
  const result = await userAuthService.registerService(req.body, deviceInfo);

  res.status(201).json(result);
});

const login = asyncHandler(async (req, res) => {
  const { error } = validateLogin(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      error: error.details[0].message,
    });
  }

  const deviceInfo = getDeviceInfo(req);
  const result = await userAuthService.loginService(req.body, deviceInfo);

  res.status(200).json(result);
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: "Refresh token is required",
    });
  }

  const result = await userAuthService.refreshTokenService(refreshToken);

  res.status(200).json(result);
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const result = await userAuthService.logoutService(refreshToken);

  res.status(200).json(result);
});

const logoutAllDevices = asyncHandler(async (req, res) => {
  const result = await userAuthService.logoutAllDevicesService(req.user._id);

  res.status(200).json(result);
});

const findUser = asyncHandler(async (req, res) => {
  const { email } = req.params;
  const result = await userAuthService.findUserService(email);

  res.status(200).json(result);
});

const getAllUsers = asyncHandler(async (req, res) => {
  const result = await userAuthService.getAllUsersService(req.user._id);

  res.status(200).json(result);
});

const getUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const result = await userAuthService.getUserByIdService(userId);

  res.status(200).json(result);
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  logoutAllDevices,
  findUser,
  getAllUsers,
  getUserById,
};
