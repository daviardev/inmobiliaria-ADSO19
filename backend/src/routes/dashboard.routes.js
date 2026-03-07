const router = require("express").Router();
const { getDashboard } = require("../controller/dashboard.controller.js");
const { verifyToken } = require("../middleware/auth/middleware.js");

router.get("/", verifyToken, getDashboard);

module.exports = router;
