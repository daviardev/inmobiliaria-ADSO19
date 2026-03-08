const db = require("../config/db");

const misCompras = (req, res) => {
  const usuarioId = req.user.id;

  const query = `
    SELECT 
      c.id,
      c.fecha_compra,
      c.valor_total,
      c.saldo_pendiente,
      c.numero_cuotas,
      c.cuotas_pagadas,
      c.porcentaje_enganche,
      c.valor_cuota,
      c.plano_id,
      l.id as lote_id,
      l.numero_lote,
      l.estado as estado_lote,
      l.descripcion,
      l.area_m2,
      l.habitaciones,
      l.banos,
      l.area_construida,
      l.etapa_id,
      l.image_url,
      lp.nombre as plano_nombre,
      lp.image_url as plano_image_url
    FROM compra c
    JOIN lotes l ON l.id = c.lote_id
    LEFT JOIN lote_planos lp ON lp.id = c.plano_id
    WHERE c.usuario_id = ?
    ORDER BY c.fecha_compra DESC
  `;

  db.query(query, [usuarioId], (err, results) => {
    if (err) {
      console.error("Error al obtener compras:", err);
      return res.status(500).json({
        error: "Error al obtener compras",
      });
    }

    if (results.length === 0) {
      return res.status(200).json({
        message: "Aún no tienes compras registradas",
        compras: [],
      });
    }

    res.status(200).json({
      total_compras: results.length,
      compras: results,
    });
  });
};

module.exports = { misCompras };
