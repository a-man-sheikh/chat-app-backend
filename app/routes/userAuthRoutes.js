const { register, login } = require("../controllers/userAuthController");
const {
  registerSchema,
  loginSchema,
} = require("../validations/userValidation");
const validate = require("../middleware/validate");
const express = require("express");
const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

module.exports = router;
