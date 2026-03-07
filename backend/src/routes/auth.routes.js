const e = require("express");
const router = e.Router();

const {
  register,
  login,
  recoverPassword,
  resetPassword,
  getCurrentUser,
} = require("../controller/auth.controller.js");

const { verifyToken } = require("../middleware/auth/middleware.js");

router.post("/register", register);
router.post("/login", login);
router.post("/recover-password", recoverPassword);
router.post("/reset-password", resetPassword);
router.get("/me", verifyToken, getCurrentUser);

module.exports = router;
