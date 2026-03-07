const router = require("express").Router();
const {
  crearLote,
  obtenerLotes,
} = require("../controller/lotes.controller.js");
const { verifyToken, isAdmin } = require("../middleware/auth/middleware.js");

// Admin: Crear lote
router.post("/", verifyToken, isAdmin, crearLote);

// Público o autenticado: Ver lotes
router.get("/", obtenerLotes);

module.exports = router;
