const {
  registerService,
  loginService,
} = require("../services/userAuthService");
const { successResponse } = require("../utils/responseHandler");
const asyncHandler = require("../middleware/asyncHandler");

const register = asyncHandler(async (req, res) => {
  const payload = req.body;

  // Call service
  const result = await registerService(payload);

  if (result.success) {
    return successResponse(
      res,
      201,
      "User registered successfully",
      result.data
    );
  } else {
    // This should not happen as service should throw errors
    // But keeping it as a fallback
    throw new Error(result.message);
  }
});

const login = asyncHandler(async (req, res) => {
  const payload = req.body;

  // Call service
  const result = await loginService(payload);

  if (result.success) {
    return successResponse(res, 200, "Login successful", result.data);
  } else {
    throw new Error(result.message);
  }
});

module.exports = { register, login };
