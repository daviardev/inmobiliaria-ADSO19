const db = require("../config/db.js");

const crearPqrs = (req, res) => {
  const usuarioId = req.user.id;

  const { tipo, asunto, descripcion } = req.body;

  if (!tipo || !asunto || !descripcion)
    return res
      .status(400)
      .json({ message: "Todos los campos son obligatorios" });

  const query =
    "INSERT INTO pqrs (usuario_id, tipo, asunto, descripcion) VALUES (?, ?, ?, ?)";

  db.query(query, [usuarioId, tipo, asunto, descripcion], (err, result) => {
    if (err) {
      console.error("Error al crear PQRS:", err);
      return res
        .status(500)
        .json({ message: "Error al crear la PQRS", details: err.message });
    }

    res.json({ message: "PQRS creada exitosamente", pqrsId: result.insertId });
  });
};

const obtenerPqrs = (req, res) => {
  const usuarioId = req.user.id;

  const query = `
        SELECT id, tipo, asunto, descripcion, respuesta
        FROM pqrs
        WHERE usuario_id = ?
        ORDER BY id DESC
    `;

  db.query(query, [usuarioId], (err, results) => {
    if (err) {
      console.error("Error al obtener PQRS:", err);
      return res
        .status(500)
        .json({ message: "Error al obtener las PQRS", details: err.message });
    }
    res.json(results);
  });
};

// Admin: Ver todas las PQRS
const obtenerTodasPqrs = (req, res) => {
  const query = `
    SELECT 
      p.id,
      p.tipo,
      p.asunto,
      p.descripcion,
      p.respuesta,
      u.nombre_usuario,
      u.correo
    FROM pqrs p
    INNER JOIN usuarios u ON p.usuario_id = u.id
    ORDER BY p.id DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener todas las PQRS:", err);
      return res
        .status(500)
        .json({ message: "Error al obtener las PQRS", details: err.message });
    }
    res.json(results);
  });
};

// Admin: Responder PQRS
const responderPqrs = (req, res) => {
  const { id } = req.params;
  const { respuesta } = req.body;

  if (!respuesta)
    return res.status(400).json({ message: "La respuesta es obligatoria" });

  const query = "UPDATE pqrs SET respuesta = ? WHERE id = ?";

  db.query(query, [respuesta, id], (err, result) => {
    if (err)
      return res.status(500).json({ message: "Error al responder la PQRS" });

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "PQRS no encontrada" });

    res.json({ message: "PQRS respondida exitosamente" });
  });
};

module.exports = { crearPqrs, obtenerPqrs, obtenerTodasPqrs, responderPqrs };
