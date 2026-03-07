const db = require("../config/db.js");

const getEtapa = (req, res) => {
  const query = `select * from etapas;`;

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({
        error: "Error al obtener las etapas",
        details: err.message,
      });
    }
    res.json(results);
  });
};

const crearEtapa = (req, res) => {
  const { nombre_etapa, descripcion } = req.body;

  if (!nombre_etapa)
    return res.status(400).json({ message: "Nombre de etapa es requerido" });

  const query = `
    INSERT INTO etapas (nombre_etapa, descripcion)
    VALUES (?, ?)
  `;

  db.query(query, [nombre_etapa, descripcion], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: "Error al crear la etapa",
        details: err.message,
      });
    }
    res.status(201).json({
      message: "Etapa creada exitosamente",
      etapa_id: result.insertId,
    });
  });
};

module.exports = { getEtapa, crearEtapa };
