const router = require("express").Router();
const {
  crearCompra,
  obtenerTodasCompras,
  buscarComprasPorCliente,
  descargarFactura,
} = require("../controller/compra.controller.js");
const { verifyToken, isAdmin } = require("../middleware/auth/middleware.js");

// Admin: Las rutas más específicas primero
router.get("/admin/todas", verifyToken, isAdmin, obtenerTodasCompras);
router.get("/admin/buscar", verifyToken, isAdmin, buscarComprasPorCliente);

// Cliente: Descargar factura
router.get("/:compra_id/factura", verifyToken, descargarFactura);

// Cliente: Crear compra
router.post("/", verifyToken, crearCompra);

module.exports = router;
