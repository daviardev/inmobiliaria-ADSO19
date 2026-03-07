const e = require("express");
const router = e.Router();

const {
  crearPqrs,
  obtenerPqrs,
  obtenerTodasPqrs,
  responderPqrs,
} = require("../controller/pqrs.controller");

const { verifyToken, isAdmin } = require("../middleware/auth/middleware.js");

// Cliente: Crear y ver sus propias PQRS
router.post("/", verifyToken, crearPqrs);
router.get("/", verifyToken, obtenerPqrs);

// Admin: Ver todas las PQRS y responder
router.get("/admin/todas", verifyToken, isAdmin, obtenerTodasPqrs);
router.put("/admin/:id/responder", verifyToken, isAdmin, responderPqrs);

module.exports = router;
