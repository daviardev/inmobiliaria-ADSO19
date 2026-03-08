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

// Obtener planos de un lote específico
const obtenerPlanosLote = (req, res) => {
  const loteId = req.params.lote_id;

  if (!loteId) {
    return res.status(400).json({ error: "lote_id es requerido" });
  }

  const query = `
    SELECT 
      id,
      lote_id,
      nombre,
      image_url,
      descripcion,
      activo
    FROM lote_planos
    WHERE lote_id = ? AND activo = 1
    ORDER BY id ASC
  `;

  db.query(query, [loteId], (err, results) => {
    if (err) {
      console.error("Error al obtener planos:", err);
      return res
        .status(500)
        .json({ message: "Error al obtener planos", details: err.message });
    }

    res.json({
      lote_id: loteId,
      total_planos: results.length,
      planos: results,
    });
  });
};

// Admin: Crear plano para un lote
const crearPlano = (req, res) => {
  const { lote_id, nombre, image_url, descripcion } = req.body;

  if (!lote_id || !nombre || !image_url) {
    return res.status(400).json({
      message: "lote_id, nombre e image_url son obligatorios",
    });
  }

  // Verificar que el lote existe
  const checkLoteQuery = "SELECT id FROM lotes WHERE id = ?";
  db.query(checkLoteQuery, [lote_id], (err, results) => {
    if (err) {
      console.error("Error al verificar lote:", err);
      return res.status(500).json({
        message: "Error al verificar el lote",
        details: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "El lote no existe" });
    }

    // Insertar el plano
    const insertQuery = `
      INSERT INTO lote_planos (lote_id, nombre, image_url, descripcion, activo)
      VALUES (?, ?, ?, ?, 1)
    `;

    db.query(
      insertQuery,
      [lote_id, nombre, image_url, descripcion || null],
      (err, result) => {
        if (err) {
          console.error("Error al crear plano:", err);
          return res.status(500).json({
            message: "Error al crear el plano",
            details: err.message,
          });
        }

        res.status(201).json({
          message: "Plano creado exitosamente",
          plano_id: result.insertId,
        });
      }
    );
  });
};

// Admin: Obtener todos los planos (incluye inactivos)
const obtenerTodosPlanos = (req, res) => {
  const query = `
    SELECT 
      lp.id,
      lp.lote_id,
      lp.nombre,
      lp.image_url,
      lp.descripcion,
      lp.activo,
      lp.created_at,
      l.numero_lote,
      l.estado as estado_lote
    FROM lote_planos lp
    INNER JOIN lotes l ON lp.lote_id = l.id
    ORDER BY lp.lote_id ASC, lp.id ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener planos:", err);
      return res.status(500).json({
        message: "Error al obtener planos",
        details: err.message,
      });
    }

    res.json({
      total_planos: results.length,
      planos: results,
    });
  });
};

// Admin: Actualizar plano
const actualizarPlano = (req, res) => {
  const { id } = req.params;
  const { nombre, image_url, descripcion, activo } = req.body;

  if (!id) {
    return res.status(400).json({ message: "ID del plano es requerido" });
  }

  // Construir query dinámicamente
  const updates = [];
  const values = [];

  if (nombre !== undefined) {
    updates.push("nombre = ?");
    values.push(nombre);
  }
  if (image_url !== undefined) {
    updates.push("image_url = ?");
    values.push(image_url);
  }
  if (descripcion !== undefined) {
    updates.push("descripcion = ?");
    values.push(descripcion);
  }
  if (activo !== undefined) {
    updates.push("activo = ?");
    values.push(activo ? 1 : 0);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: "No hay campos para actualizar" });
  }

  values.push(id);
  const query = `UPDATE lote_planos SET ${updates.join(", ")} WHERE id = ?`;

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error al actualizar plano:", err);
      return res.status(500).json({
        message: "Error al actualizar el plano",
        details: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Plano no encontrado" });
    }

    res.json({
      message: "Plano actualizado exitosamente",
      plano_id: id,
    });
  });
};

// Admin: Eliminar (desactivar) plano
const eliminarPlano = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "ID del plano es requerido" });
  }

  const query = "UPDATE lote_planos SET activo = 0 WHERE id = ?";

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error al eliminar plano:", err);
      return res.status(500).json({
        message: "Error al eliminar el plano",
        details: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Plano no encontrado" });
    }

    res.json({
      message: "Plano desactivado exitosamente",
      plano_id: id,
    });
  });
};

module.exports = {
  crearLote,
  obtenerLotes,
  obtenerPlanosLote,
  crearPlano,
  obtenerTodosPlanos,
  actualizarPlano,
  eliminarPlano,
};
