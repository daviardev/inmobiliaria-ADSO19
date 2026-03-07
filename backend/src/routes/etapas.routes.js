const e = require("express");
const router = e.Router();

const { getEtapa, crearEtapa } = require("../controller/etapas.controller.js");
const { verifyToken, isAdmin } = require("../middleware/auth/middleware.js");

router.get("/", getEtapa);
router.post("/", verifyToken, isAdmin, crearEtapa);

module.exports = router;
