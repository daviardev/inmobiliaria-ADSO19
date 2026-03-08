const db = require("../config/db.js");
const PDFDocument = require("pdfkit");

const calcularCuotaFija = (saldoFinanciado, tasaInteres, numeroCuotas) => {
  if (numeroCuotas === 1) return saldoFinanciado;

  const i = tasaInteres;
  const n = numeroCuotas;
  const cuota =
    (saldoFinanciado * (i * Math.pow(1 + i, n))) / (Math.pow(1 + i, n) - 1);

  return Math.round(cuota);
};

const generarCalendarioCuotas = (
  compraId,
  saldoFinanciado,
  tasaInteres,
  numeroCuotas,
  fechaInicio,
  callback
) => {
  if (numeroCuotas === 1) {
    return callback(null);
  }

  const cuotaFija = calcularCuotaFija(
    saldoFinanciado,
    tasaInteres,
    numeroCuotas
  );
  let saldoRestante = saldoFinanciado;
  const cuotas = [];

  for (let i = 1; i <= numeroCuotas; i++) {
    const montoInteres = Math.round(saldoRestante * tasaInteres);
    const montoCapital = cuotaFija - montoInteres;
    saldoRestante -= montoCapital;

    if (i === numeroCuotas) {
      saldoRestante = 0;
    }

    const fechaVencimiento = new Date(fechaInicio);
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i);

    cuotas.push([
      compraId,
      i,
      cuotaFija,
      montoCapital,
      montoInteres,
      saldoRestante,
      fechaVencimiento.toISOString().split("T")[0],
    ]);
  }

  const insertQuery = `
    INSERT INTO cuotas
    (compra_id, numero_cuota, valor_cuota, monto_capital, monto_interes, saldo_restante, fecha_vencimiento)
    VALUES ?
  `;

  db.query(insertQuery, [cuotas], callback);
};

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
      l.precio,
      lp.nombre as plano_nombre,
      lp.image_url as plano_image_url
    FROM compra c
    INNER JOIN usuarios u ON c.usuario_id = u.id
    INNER JOIN lotes l ON c.lote_id = l.id
    LEFT JOIN lote_planos lp ON c.plano_id = lp.id
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

    db.query(pagoQuery, [compraId], async (err, pagoResults) => {
      if (err) {
        console.error("[FACTURA] Error obteniendo pagos:", err);
        return res.status(500).json({ message: "Error al generar factura" });
      }

      const totalPagado = pagoResults[0]?.total_pagado || 0;
      console.log("[FACTURA] Total pagado:", totalPagado);

      try {
        let planoImageBuffer = null;
        if (compra.plano_image_url) {
          try {
            const imageResponse = await fetch(compra.plano_image_url);
            if (imageResponse.ok) {
              const arrayBuffer = await imageResponse.arrayBuffer();
              planoImageBuffer = Buffer.from(arrayBuffer);
            }
          } catch (imageError) {
            console.warn(
              "[FACTURA] No se pudo descargar imagen del plano:",
              imageError.message
            );
          }
        }

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
        doc.text(`Plano elegido: ${compra.plano_nombre || "No especificado"}`);
        doc.text(
          `Etapa: ${compra.etapa_id ? `Etapa ${compra.etapa_id}` : "General"}`
        );

        if (planoImageBuffer) {
          doc.moveDown();
          doc
            .fontSize(11)
            .font("Helvetica-Bold")
            .text("Vista referencial del plano");
          doc.moveDown(0.5);
          doc.image(planoImageBuffer, {
            fit: [220, 140],
            align: "left",
          });
        }

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
  const {
    lote_id,
    valor_inicial,
    porcentaje_enganche = 0,
    numero_cuotas = 1,
    plano_id = null,
  } = req.body;

  if (!lote_id) {
    return res.status(400).json({ error: "lote_id es requerido" });
  }

  if (!plano_id) {
    return res.status(400).json({
      error: "plano_id es requerido. Debes seleccionar un plano",
    });
  }

  if (!Number.isInteger(Number(plano_id)) || Number(plano_id) <= 0) {
    return res.status(400).json({ error: "plano_id inválido" });
  }

  const ENGANCHES_VALIDOS = [0, 10, 20, 30];
  const CUOTAS_VALIDAS = [1, 12, 24, 36, 60];

  if (!ENGANCHES_VALIDOS.includes(Number(porcentaje_enganche))) {
    return res.status(400).json({
      error: "Porcentaje de enganche inválido. Opciones: 0%, 10%, 20%, 30%",
    });
  }

  if (!CUOTAS_VALIDAS.includes(Number(numero_cuotas))) {
    return res.status(400).json({
      error: "Número de cuotas inválido. Opciones: 1, 12, 24, 36, 60",
    });
  }

  const pagoInicial = valor_inicial ? Number(valor_inicial) : 0;

  if (pagoInicial < 0) {
    return res
      .status(400)
      .json({ error: "El valor inicial no puede ser negativo" });
  }

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
    const valorEnganche = Math.round(
      precio * (Number(porcentaje_enganche) / 100)
    );
    const saldoFinanciado = precio - valorEnganche;

    if (porcentaje_enganche > 0 && pagoInicial < valorEnganche) {
      return res.status(400).json({
        error: `El pago inicial debe ser al menos ${valorEnganche.toLocaleString("es-CO")} (${porcentaje_enganche}% de enganche)`,
      });
    }

    if (pagoInicial > precio) {
      return res.status(400).json({
        error: "El valor inicial no puede ser mayor al precio del lote",
      });
    }

    const continuarConCompra = () => {
      const saldoPendiente = precio - pagoInicial;
      const tasaInteres = 0.01;
      const valorCuota =
        numero_cuotas > 1
          ? calcularCuotaFija(saldoFinanciado, tasaInteres, numero_cuotas)
          : 0;
      const fechaInicioPlan = new Date().toISOString().split("T")[0];

      db.beginTransaction((trxErr) => {
        if (trxErr) {
          console.error("Error al iniciar transacción:", trxErr);
          return res.status(500).json({ error: "Error al procesar la compra" });
        }

        const insertCompra = `
          INSERT INTO compra (
            fecha_compra, valor_total, saldo_pendiente, usuario_id, lote_id,
            porcentaje_enganche, valor_enganche, saldo_financiado,
            numero_cuotas, valor_cuota, tasa_interes, fecha_inicio_plan, plano_id
          )
          VALUES (CURRENT_DATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
          insertCompra,
          [
            precio,
            saldoPendiente,
            usuarioId,
            lote_id,
            porcentaje_enganche,
            valorEnganche,
            saldoFinanciado,
            numero_cuotas,
            valorCuota,
            tasaInteres,
            fechaInicioPlan,
            plano_id,
          ],
          (insertErr, insertResults) => {
            if (insertErr) {
              return db.rollback(() => {
                console.error("Error al crear compra:", insertErr);
                res.status(500).json({
                  error: "Error al crear la compra",
                  details: insertErr.message,
                });
              });
            }

            const compraId = insertResults.insertId;
            const updateLote =
              "UPDATE lotes SET estado = 'reservado', usuario_id = ? WHERE id = ?";

            db.query(updateLote, [usuarioId, lote_id], (updateErr) => {
              if (updateErr) {
                return db.rollback(() => {
                  console.error("Error al actualizar lote:", updateErr);
                  res.status(500).json({
                    error: "Error al actualizar el lote",
                    details: updateErr.message,
                  });
                });
              }

              const continuarPostPago = () => {
                if (numero_cuotas > 1) {
                  return generarCalendarioCuotas(
                    compraId,
                    saldoFinanciado,
                    tasaInteres,
                    numero_cuotas,
                    fechaInicioPlan,
                    (cuotasErr) => {
                      if (cuotasErr) {
                        return db.rollback(() => {
                          console.error("Error al generar cuotas:", cuotasErr);
                          res.status(500).json({
                            error: "Error al generar calendario de cuotas",
                            details: cuotasErr.message,
                          });
                        });
                      }

                      db.commit((commitErr) => {
                        if (commitErr) {
                          return db.rollback(() => {
                            console.error(
                              "Error al confirmar transacción:",
                              commitErr
                            );
                            res
                              .status(500)
                              .json({ error: "Error al confirmar la compra" });
                          });
                        }

                        res.status(201).json({
                          message:
                            "Compra creada exitosamente con plan de cuotas",
                          compra_id: compraId,
                          valor_total: precio,
                          pago_inicial: pagoInicial,
                          saldo_pendiente: saldoPendiente,
                          plan_cuotas: {
                            numero_cuotas,
                            valor_cuota: valorCuota,
                            tasa_interes: tasaInteres,
                            porcentaje_enganche,
                          },
                        });
                      });
                    }
                  );
                }

                db.commit((commitErr) => {
                  if (commitErr) {
                    return db.rollback(() => {
                      console.error(
                        "Error al confirmar transacción:",
                        commitErr
                      );
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
              };

              if (pagoInicial > 0) {
                const tipoPago = valorEnganche > 0 ? "enganche" : "cuota";
                const insertPago = `
                  INSERT INTO pagos (monto, fecha_pago, comprobante, compra_id, tipo_pago)
                  VALUES (?, CURRENT_DATE(), 'Pago inicial', ?, ?)
                `;

                return db.query(
                  insertPago,
                  [pagoInicial, compraId, tipoPago],
                  (pagoErr) => {
                    if (pagoErr) {
                      return db.rollback(() => {
                        console.error(
                          "Error al registrar pago inicial:",
                          pagoErr
                        );
                        res.status(500).json({
                          error: "Error al registrar pago inicial",
                          details: pagoErr.message,
                        });
                      });
                    }

                    continuarPostPago();
                  }
                );
              }

              continuarPostPago();
            });
          }
        );
      });
    };

    if (plano_id) {
      const checkPlano =
        "SELECT id FROM lote_planos WHERE id = ? AND lote_id = ? AND activo = 1";
      return db.query(
        checkPlano,
        [plano_id, lote_id],
        (planoErr, planoRows) => {
          if (planoErr) {
            console.error("Error al verificar plano:", planoErr);
            return res
              .status(500)
              .json({ error: "Error al verificar el plano" });
          }

          if (planoRows.length === 0) {
            return res
              .status(400)
              .json({ error: "El plano seleccionado no pertenece al lote" });
          }

          continuarConCompra();
        }
      );
    }

    continuarConCompra();
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

const obtenerCuotasCompra = (req, res) => {
  const compraId = req.params.compra_id;
  const usuarioId = req.user.id;

  const query = `
    SELECT 
      q.id,
      q.numero_cuota,
      q.valor_cuota,
      q.monto_capital,
      q.monto_interes,
      q.saldo_restante,
      q.fecha_vencimiento,
      q.estado,
      q.fecha_pago,
      q.monto_pagado,
      q.dias_mora,
      q.interes_moratorio
    FROM cuotas q
    INNER JOIN compra c ON c.id = q.compra_id
    WHERE q.compra_id = ? AND c.usuario_id = ?
    ORDER BY q.numero_cuota ASC
  `;

  db.query(query, [compraId, usuarioId], (err, cuotas) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener cuotas" });
    }
    res.json({ compra_id: compraId, cuotas });
  });
};

module.exports = {
  crearCompra,
  obtenerTodasCompras,
  buscarComprasPorCliente,
  obtenerCuotasCompra,
  descargarFactura,
};
