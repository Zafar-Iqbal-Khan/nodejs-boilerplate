const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/authurize");
const {
  loginotp,
  login,
  register,
  verifyRegistrationOtp,
  registerFromCC,
  verifyRegesterOtp,
  loginEmailAndPassword,
  addUserByAdmin,
  addMechanicProfile,
} = require("../controller/Auth");
const {
  userLoginValidator,
  loginOtpValidator,
  verifyRegistrationOtpValidator,
  userRegistrationValidator,
  userLoginEmailValidator,
} = require("../validators/auth");
const { runValidation } = require("../validators");
require("dotenv").config();

//

// singup or register user-------------------------------------------------------------->
router.post("/register", userRegistrationValidator, runValidation, register);

// verify registration otp-------------------------------------------->
router.post(
  "/verify-otp",
  verifyRegistrationOtpValidator,
  runValidation,
  verifyRegesterOtp
);

// Get OTP for login to mobile-------------------------------------->
router.get("/login-otp", loginOtpValidator, runValidation, loginotp);

// login with email and password------------------------------------>
router.post(
  "/login-with-email",
  userLoginEmailValidator,
  runValidation,
  loginEmailAndPassword
);

// Login -------------------------------------------------------------------->
router.post("/login", userLoginValidator, runValidation, login);

// add user by customer care
router.post("/register-by-customer-care", authenticate, registerFromCC);

// add user by admin
router.post("/register-by-admin", authenticate, addUserByAdmin);

// add mechanic profile
router.post("/add-mechanic-profile", authenticate, addMechanicProfile);

module.exports = router;
