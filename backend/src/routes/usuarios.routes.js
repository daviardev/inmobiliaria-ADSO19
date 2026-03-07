const express = require("express");
const { updatePerfil } = require("../controller/usuarios.controller");
const { verifyToken } = require("../middleware/auth/middleware");

const router = express.Router();

// Actualizar perfil (protegido - requiere autenticación)
router.put("/perfil", verifyToken, updatePerfil);

module.exports = router;
