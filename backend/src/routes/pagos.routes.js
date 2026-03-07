const e = require("express");

const router = e.Router();

const {
  registrarPago,
  historialPagos,
  enviarComprobantePago,
  descargarComprobante,
} = require("../controller/pagos.controller.js");
const { verifyToken } = require("../middleware/auth/middleware.js");

router.post("/", verifyToken, registrarPago);
router.get("/historial/:compra_id", verifyToken, historialPagos);
router.post("/enviar-comprobante", verifyToken, enviarComprobantePago);
router.get("/:pago_id/comprobante", verifyToken, descargarComprobante);

module.exports = router;
