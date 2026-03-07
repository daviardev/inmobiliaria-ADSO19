const db = require("../config/db.js");

// Información general del proyecto
const getProyecto = (req, res) => {
  const query = `
    SELECT 
      id,
      nombre,
      descripcion,
      ubicacion,
      imagen,
      DATE_FORMAT(fecha_creacion, '%Y-%m-%d') as fecha_creacion
    FROM proyectos
    LIMIT 1
  `;

  db.query(query, (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Error al obtener el proyecto", details: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    res.json(results[0]);
  });
};

// Detalles del proyecto con lotes y etapas
const getProyectoDetalle = (req, res) => {
  const query = `
    SELECT 
      p.id as proyecto_id,
      p.nombre,
      p.descripcion,
      p.ubicacion,
      COUNT(DISTINCT l.id) as total_lotes,
      COUNT(CASE WHEN l.estado = 'disponible' THEN 1 END) as lotes_disponibles,
      COUNT(CASE WHEN l.estado = 'vendido' THEN 1 END) as lotes_vendidos,
      COUNT(DISTINCT e.id) as total_etapas
    FROM proyectos p
    LEFT JOIN lotes l ON l.proyecto_id = p.id
    LEFT JOIN etapas e ON e.proyecto_id = p.id
    LIMIT 1
  `;

  db.query(query, (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({
          error: "Error al obtener detalles del proyecto",
          details: err.message,
        });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    res.json(results[0]);
  });
};

// Crear proyecto (solo admin)
const crearProyecto = (req, res) => {
  const { nombre, descripcion, ubicacion, imagen } = req.body;

  if (!nombre || !descripcion || !ubicacion) {
    return res.status(400).json({
      message: "Nombre, descripción y ubicación son requeridos",
    });
  }

  const query = `
    INSERT INTO proyectos (nombre, descripcion, ubicacion, imagen)
    VALUES (?, ?, ?, ?)
  `;

  db.query(query, [nombre, descripcion, ubicacion, imagen], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: "Error al crear el proyecto",
        details: err.message,
      });
    }

    res.status(201).json({
      message: "Proyecto creado exitosamente",
      proyecto_id: result.insertId,
    });
  });
};

module.exports = { getProyecto, getProyectoDetalle, crearProyecto };
