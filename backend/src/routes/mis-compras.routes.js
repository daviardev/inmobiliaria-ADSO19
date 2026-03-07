const e = require("express");
const router = e.Router();

const { misCompras } = require("../controller/mis-compras.controller.js");
const { verifyToken } = require("../middleware/auth/middleware.js");

router.get("/", verifyToken, misCompras);

module.exports = router;
