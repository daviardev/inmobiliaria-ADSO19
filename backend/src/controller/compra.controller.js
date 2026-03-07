const db = require("../config/db.js");
const PDFDocument = require("pdfkit");

const descargarFactura = (req, res) => {
  const usuarioId = req.user.id;
  const compraId = req.params.compra_id;

  console.log(
    `[FACTURA] Descargando factura - Usuario: ${usuarioId}, Compra: ${compraId}`
  );

  // Query para obtener información de la compra con lote
  const query = `
    SELECT 
      c.id,
      c.fecha_compra,
      c.valor_total,
      c.saldo_pendiente,
      u.nombre_usuario,
      u.correo,
      l.numero_lote,
      l.descripcion as lote_descripcion,
      l.area_m2,
      l.habitaciones,
      l.banos,
      l.etapa_id,
      l.precio
    FROM compra c
    INNER JOIN usuarios u ON c.usuario_id = u.id
    INNER JOIN lotes l ON c.lote_id = l.id
    WHERE c.id = ? AND c.usuario_id = ?
  `;

  db.query(query, [compraId, usuarioId], (err, results) => {
    if (err) {
      console.error("[FACTURA] Error en query:", err);
      return res
        .status(500)
        .json({ message: "Error al obtener datos de la compra" });
    }

    if (!results || results.length === 0) {
      console.log("[FACTURA] Compra no encontrada");
      return res.status(404).json({ message: "Compra no encontrada" });
    }

    const compra = results[0];
    console.log("[FACTURA] Compra encontrada:", compra.id);

    // Obtener el total pagado
    const pagoQuery = `SELECT SUM(monto) as total_pagado FROM pagos WHERE compra_id = ?`;

    db.query(pagoQuery, [compraId], (err, pagoResults) => {
      if (err) {
        console.error("[FACTURA] Error obteniendo pagos:", err);
        return res.status(500).json({ message: "Error al generar factura" });
      }

      const totalPagado = pagoResults[0]?.total_pagado || 0;
      console.log("[FACTURA] Total pagado:", totalPagado);

      try {
        // Crear el PDF
        const doc = new PDFDocument();

        // Encabezado
        doc.fontSize(20).font("Helvetica-Bold").text("FACTURA");
        doc
          .fontSize(10)
          .font("Helvetica")
          .text("Altos del Roble", { underline: true });
        doc.text("Proyecto Inmobiliario", { underline: false });

        // Separador
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Información de la factura
        doc
          .fontSize(10)
          .text(`Factura #: INV-${String(compra.id).padStart(5, "0")}`);
        doc.text(
          `Fecha: ${new Date(compra.fecha_compra).toLocaleDateString("es-CO")}`
        );
        doc.text(`Cliente: ${compra.nombre_usuario}`);
        doc.text(`Email: ${compra.correo}`);
        doc.moveDown();

        // Detalles del lote
        doc.fontSize(12).font("Helvetica-Bold").text("DETALLES DEL LOTE");
        doc.fontSize(10).font("Helvetica");
        doc.text(`Lote: ${compra.numero_lote}`);
        doc.text(`Descripción: ${compra.lote_descripcion}`);
        doc.text(`Área: ${compra.area_m2} m²`);
        doc.text(`Habitaciones: ${compra.habitaciones || "N/A"}`);
        doc.text(`Baños: ${compra.banos || "N/A"}`);
        doc.text(
          `Etapa: ${compra.etapa_id ? `Etapa ${compra.etapa_id}` : "General"}`
        );
        doc.moveDown();

        // Resumen financiero
        doc.fontSize(12).font("Helvetica-Bold").text("RESUMEN FINANCIERO");
        doc.fontSize(10).font("Helvetica");
        doc.text(
          `Valor Total: ${new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
          }).format(compra.valor_total)}`
        );
        doc.text(
          `Total Pagado: ${new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
          }).format(totalPagado)}`
        );
        doc.text(
          `Saldo Pendiente: ${new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
          }).format(compra.saldo_pendiente)}`
        );
        doc.moveDown();

        // Pie de página
        doc
          .fontSize(8)
          .text("Este documento es válido como comprobante de compra.", {
            align: "center",
          });
        doc.text("Altos del Roble © 2025", { align: "center" });

        // Enviar el PDF
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="Factura-${String(compra.id).padStart(5, "0")}.pdf"`
        );
        doc.pipe(res);
        doc.end();

        console.log("[FACTURA] Descarga iniciada exitosamente");
      } catch (err) {
        console.error("[FACTURA] Error generando PDF:", err);
        return res.status(500).json({ message: "Error generando el PDF" });
      }
    });
  });
};

const crearCompra = (req, res) => {
  const usuarioId = req.user.id;
  const { lote_id, valor_inicial } = req.body;

  // Validaciones básicas
  if (!lote_id) {
    return res.status(400).json({ error: "lote_id es requerido" });
  }

  const pagoInicial = valor_inicial ? Number(valor_inicial) : 0;

  if (pagoInicial < 0) {
    return res
      .status(400)
      .json({ error: "El valor inicial no puede ser negativo" });
  }

  // Verificar que el lote existe y está disponible
  const checkLote = `SELECT * FROM lotes WHERE id = ? AND estado = 'disponible'`;

  db.query(checkLote, [lote_id], (err, results) => {
    if (err) {
      console.error("Error al verificar el lote:", err);
      return res.status(500).json({ error: "Error al verificar el lote" });
    }

    if (results.length === 0) {
      return res.status(400).json({ error: "Lote no disponible" });
    }

    const lote = results[0];
    const precio = Number(lote.precio);

    if (pagoInicial > precio) {
      return res.status(400).json({
        error: "El valor inicial no puede ser mayor al precio del lote",
      });
    }

    const saldoPendiente = precio - pagoInicial;

    // Iniciar transacción
    db.beginTransaction((err) => {
      if (err) {
        console.error("Error al iniciar transacción:", err);
        return res.status(500).json({ error: "Error al procesar la compra" });
      }

      // 1. Crear la compra
      const insertCompra = `
        INSERT INTO compra (fecha_compra, valor_total, saldo_pendiente, usuario_id, lote_id)
        VALUES (CURRENT_DATE(), ?, ?, ?, ?)
      `;

      db.query(
        insertCompra,
        [precio, saldoPendiente, usuarioId, lote_id],
        (err, results) => {
          if (err) {
            return db.rollback(() => {
              console.error("Error al crear compra:", err);
              res.status(500).json({
                error: "Error al crear la compra",
                details: err.message,
              });
            });
          }

          const compraId = results.insertId;

          // 2. Actualizar el lote (estado y usuario_id)
          const updateLote = `UPDATE lotes SET estado = 'reservado', usuario_id = ? WHERE id = ?`;

          db.query(updateLote, [usuarioId, lote_id], (err) => {
            if (err) {
              return db.rollback(() => {
                console.error("Error al actualizar lote:", err);
                res.status(500).json({
                  error: "Error al actualizar el lote",
                  details: err.message,
                });
              });
            }

            // 3. Si hay pago inicial, registrarlo
            if (pagoInicial > 0) {
              const insertPago = `
              INSERT INTO pagos (monto, fecha_pago, comprobante, compra_id)
              VALUES (?, CURRENT_DATE(), 'Pago inicial', ?)
            `;

              db.query(insertPago, [pagoInicial, compraId], (err) => {
                if (err) {
                  return db.rollback(() => {
                    console.error("Error al registrar pago inicial:", err);
                    res.status(500).json({
                      error: "Error al registrar pago inicial",
                      details: err.message,
                    });
                  });
                }

                // Commit de la transacción
                db.commit((err) => {
                  if (err) {
                    return db.rollback(() => {
                      console.error("Error al confirmar transacción:", err);
                      res
                        .status(500)
                        .json({ error: "Error al confirmar la compra" });
                    });
                  }

                  res.status(201).json({
                    message: "Compra creada exitosamente",
                    compra_id: compraId,
                    valor_total: precio,
                    pago_inicial: pagoInicial,
                    saldo_pendiente: saldoPendiente,
                  });
                });
              });
            } else {
              // No hay pago inicial, solo commit
              db.commit((err) => {
                if (err) {
                  return db.rollback(() => {
                    console.error("Error al confirmar transacción:", err);
                    res
                      .status(500)
                      .json({ error: "Error al confirmar la compra" });
                  });
                }

                res.status(201).json({
                  message: "Compra creada exitosamente",
                  compra_id: compraId,
                  valor_total: precio,
                  pago_inicial: 0,
                  saldo_pendiente: precio,
                });
              });
            }
          });
        }
      );
    });
  });
};

// Admin: Ver todas las compras
const obtenerTodasCompras = (req, res) => {
  const query = `
    SELECT 
      c.id,
      c.fecha_compra,
      c.valor_total,
      c.saldo_pendiente,
      u.id as usuario_id,
      u.nombre_usuario,
      u.correo,
      l.numero_lote,
      l.area_m2
    FROM compra c
    INNER JOIN usuarios u ON c.usuario_id = u.id
    INNER JOIN lotes l ON c.lote_id = l.id
    ORDER BY c.fecha_compra DESC
  `;

  db.query(query, (err, results) => {
    if (err)
      return res.status(500).json({ error: "Error al obtener las compras" });

    res.json({ total_compras: results.length, compras: results });
  });
};

// Admin: Buscar compras por ID o nombre de cliente
const buscarComprasPorCliente = (req, res) => {
  const { busqueda } = req.query;

  if (!busqueda)
    return res.status(400).json({ message: "Parámetro de búsqueda requerido" });

  const query = `
    SELECT 
      c.id,
      c.fecha_compra,
      c.valor_total,
      c.saldo_pendiente,
      u.id as usuario_id,
      u.nombre_usuario,
      u.correo,
      l.numero_lote,
      l.area_m2
    FROM compra c
    INNER JOIN usuarios u ON c.usuario_id = u.id
    INNER JOIN lotes l ON c.lote_id = l.id
    WHERE u.id = ? OR u.nombre_usuario LIKE ? OR u.correo LIKE ?
    ORDER BY c.fecha_compra DESC
  `;

  const searchPattern = `%${busqueda}%`;

  db.query(query, [busqueda, searchPattern, searchPattern], (err, results) => {
    if (err) return res.status(500).json({ error: "Error al buscar compras" });

    res.json({ total_compras: results.length, compras: results });
  });
};

module.exports = {
  crearCompra,
  obtenerTodasCompras,
  buscarComprasPorCliente,
  descargarFactura,
};
