const db = require("../config/db");

// Actualizar perfil del usuario
const updatePerfil = (req, res) => {
  const usuarioId = req.user.id;
  const { nombre_usuario, correo } = req.body;

  // Validaciones
  if (!nombre_usuario || !correo) {
    return res.status(400).json({
      error: "nombre_usuario y correo son obligatorios",
    });
  }

  // Validar email
  if (!correo.includes("@")) {
    return res.status(400).json({
      error: "Correo electrónico inválido",
    });
  }

  // Verificar que el correo no esté en uso por otro usuario
  const checkQuery = `SELECT id FROM usuarios WHERE correo = ? AND id != ?`;
  db.query(checkQuery, [correo, usuarioId], (err, results) => {
    if (err) {
      console.error("Error al verificar correo:", err);
      return res.status(500).json({
        error: "Error al actualizar perfil",
      });
    }

    if (results.length > 0) {
      return res.status(400).json({
        error: "Este correo ya está en uso",
      });
    }

    // Actualizar el usuario
    const updateQuery = `
      UPDATE usuarios 
      SET nombre_usuario = ?, correo = ?
      WHERE id = ?
    `;

    db.query(updateQuery, [nombre_usuario, correo, usuarioId], (err) => {
      if (err) {
        console.error("Error al actualizar usuario:", err);
        return res.status(500).json({
          error: "Error al actualizar perfil",
        });
      }

      res.status(200).json({
        message: "Perfil actualizado correctamente",
        usuario: {
          id: usuarioId,
          nombre_usuario,
          correo,
        },
      });
    });
  });
};

module.exports = { updatePerfil };
