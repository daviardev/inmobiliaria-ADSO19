const db = require("../config/db.js");

// Admin: Crear lote
const crearLote = (req, res) => {
  const {
    numero_lote,
    area_m2,
    precio,
    descripcion,
    etapa_id,
    habitaciones,
    banos,
    area_construida,
    image_url,
  } = req.body;

  if (!numero_lote || !area_m2 || !precio)
    return res
      .status(400)
      .json({ message: "numero_lote, area_m2 y precio son obligatorios" });

  const query = `
    INSERT INTO lotes (
      numero_lote, 
      area_m2, 
      precio, 
      descripcion, 
      estado, 
      etapa_id,
      habitaciones, 
      banos, 
      area_construida, 
      image_url
    )
    VALUES (?, ?, ?, ?, 'disponible', ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [
      numero_lote,
      area_m2,
      precio,
      descripcion || null,
      etapa_id || null,
      habitaciones || null,
      banos || null,
      area_construida || null,
      image_url || null,
    ],
    (err, result) => {
      if (err) {
        console.error("Error al crear lote:", err);
        return res
          .status(500)
          .json({ message: "Error al crear el lote", details: err.message });
      }

      res.status(201).json({
        message: "Lote creado exitosamente",
        lote_id: result.insertId,
      });
    }
  );
};

// Obtener todos los lotes
const obtenerLotes = (req, res) => {
  const query = `
    SELECT 
      l.id,
      l.numero_lote,
      l.area_m2,
      l.precio,
      l.descripcion,
      l.estado,
      l.etapa_id,
      l.habitaciones,
      l.banos,
      l.area_construida,
      l.image_url,
      u.nombre_usuario as propietario
    FROM lotes l
    LEFT JOIN usuarios u ON l.usuario_id = u.id
    ORDER BY l.id DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener lotes:", err);
      return res
        .status(500)
        .json({ message: "Error al obtener lotes", details: err.message });
    }

    res.json({ total_lotes: results.length, lotes: results });
  });
};

module.exports = { crearLote, obtenerLotes };
