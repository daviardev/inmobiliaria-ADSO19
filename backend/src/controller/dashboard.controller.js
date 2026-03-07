const db = require("../config/db.js");

const getDashboard = (req, res) => {
  const usuarioId = req.user.id;

  // Query para resumen de métricas
  const queryResumen = `
    SELECT 
      COUNT(c.id) as total_compras,
      COALESCE(SUM(c.valor_total), 0) as total_invertido,
      COALESCE(SUM(c.valor_total - c.saldo_pendiente), 0) as total_pagado,
      COALESCE(SUM(c.saldo_pendiente), 0) as total_pendiente
    FROM compra c
    WHERE c.usuario_id = ?
  `;

  // Query para última compra
  const queryUltimaCompra = `
    SELECT 
      c.id,
      c.fecha_compra,
      c.valor_total,
      c.saldo_pendiente,
      CASE 
        WHEN c.saldo_pendiente = 0 THEN 'pagado'
        WHEN c.saldo_pendiente < c.valor_total THEN 'en_proceso'
        ELSE 'pendiente'
      END as estado,
      l.numero_lote as lote_nombre
    FROM compra c
    INNER JOIN lotes l ON c.lote_id = l.id
    WHERE c.usuario_id = ?
    ORDER BY c.fecha_compra DESC
    LIMIT 1
  `;

  // Query para últimos 3 pagos
  const queryUltimosPagos = `
    SELECT 
      p.monto,
      p.fecha_pago,
      p.comprobante
    FROM pagos p
    INNER JOIN compra c ON p.compra_id = c.id
    WHERE c.usuario_id = ?
    ORDER BY p.fecha_pago DESC
    LIMIT 3
  `;

  // Ejecutar las 3 queries
  db.query(queryResumen, [usuarioId], (err, resumenResults) => {
    if (err) {
      console.error("Error en queryResumen:", err);
      return res
        .status(500)
        .json({ error: "Error al obtener resumen", details: err.message });
    }

    db.query(queryUltimaCompra, [usuarioId], (err, compraResults) => {
      if (err) {
        console.error("Error en queryUltimaCompra:", err);
        return res
          .status(500)
          .json({
            error: "Error al obtener última compra",
            details: err.message,
          });
      }

      db.query(queryUltimosPagos, [usuarioId], (err, pagosResults) => {
        if (err) {
          console.error("Error en queryUltimosPagos:", err);
          return res
            .status(500)
            .json({ error: "Error al obtener pagos", details: err.message });
        }

        const resumen = resumenResults[0];
        const ultimaCompra = compraResults[0] || null;
        const ultimosPagos = pagosResults || [];

        res.json({
          resumen: {
            total_compras: resumen.total_compras,
            total_invertido: resumen.total_invertido,
            total_pagado: resumen.total_pagado,
            total_pendiente: resumen.total_pendiente,
          },
          ultima_compra: ultimaCompra,
          ultimos_pagos: ultimosPagos,
        });
      });
    });
  });
};

module.exports = { getDashboard };
