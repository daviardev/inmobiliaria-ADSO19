const router = require("express").Router();
const {
  crearLote,
  obtenerLotes,
  obtenerPlanosLote,
  crearPlano,
  obtenerTodosPlanos,
  actualizarPlano,
  eliminarPlano,
} = require("../controller/lotes.controller.js");
const { verifyToken, isAdmin } = require("../middleware/auth/middleware.js");

// Admin: Crear lote
router.post("/", verifyToken, isAdmin, crearLote);

// Público o autenticado: Ver lotes
router.get("/", obtenerLotes);

// Público: Obtener planos de un lote específico (solo activos)
router.get("/:lote_id/planos", obtenerPlanosLote);

// Admin: Gestión de planos
router.post("/planos", verifyToken, isAdmin, crearPlano);
router.get("/planos/all", verifyToken, isAdmin, obtenerTodosPlanos);
router.put("/planos/:id", verifyToken, isAdmin, actualizarPlano);
router.delete("/planos/:id", verifyToken, isAdmin, eliminarPlano);

module.exports = router;
