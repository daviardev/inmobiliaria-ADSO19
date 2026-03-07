const e = require("express");
const router = e.Router();

const {
  getProyecto,
  getProyectoDetalle,
  crearProyecto,
} = require("../controller/proyecto.controller.js");
const { verifyToken, isAdmin } = require("../middleware/auth/middleware.js");

router.get("/", getProyecto);
router.get("/detalle", getProyectoDetalle);
router.post("/", verifyToken, isAdmin, crearProyecto);

module.exports = router;
