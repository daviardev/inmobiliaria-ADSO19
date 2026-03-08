const db = require("../config/db.js");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const { Readable } = require("stream");

// Configurar email
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Función auxiliar para generar PDF como buffer
const generarPDFBuffer = (pagoData) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ bufferPages: true, margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Encabezado
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("COMPROBANTE DE PAGO", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica").text("Altos del Roble", {
      align: "center",
    });
    doc.fontSize(10).text("Portal de Transacciones Inmobiliarias", {
      align: "center",
    });

    doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
    doc.moveDown(1);

    // Información del comprobante
    doc.fontSize(11).font("Helvetica-Bold").text("Información del Comprobante");
    doc.fontSize(10).font("Helvetica");
    doc
      .text(`Número: CP-${String(pagoData.pago_id).padStart(5, "0")}`, {
        width: 200,
        continued: true,
      })
      .text(
        `Fecha: ${new Date(pagoData.fecha_pago).toLocaleDateString("es-CO")}`,
        { align: "right" }
      );

    doc.moveDown(1);

    // Información del cliente
    doc.fontSize(11).font("Helvetica-Bold").text("Información del Cliente");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Nombre: ${pagoData.nombre_usuario}`);
    doc.text(`Correo: ${pagoData.correo}`);

    doc.moveDown(1);

    // Información del lote
    doc.fontSize(11).font("Helvetica-Bold").text("Información de la Propiedad");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Lote: ${pagoData.numero_lote}`);
    doc.text(`Descripción: ${pagoData.descripcion}`);
    doc.text(`Área: ${pagoData.area_m2} m²`);

    doc.moveDown(1);

    // Información financiera
    doc.fontSize(11).font("Helvetica-Bold").text("Detalles del Pago");

    const tableTop = doc.y + 20;
    const col1 = 60;
    const col2 = 300;

    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Concepto", col1, tableTop);
    doc.text("Valor", col2, tableTop, { align: "right" });

    doc
      .moveTo(50, tableTop + 15)
      .lineTo(500, tableTop + 15)
      .stroke();

    doc.fontSize(10).font("Helvetica");
    doc.text(`Valor Total del Lote:`, col1, tableTop + 25);
    doc.text(
      `$${Number(pagoData.valor_total).toLocaleString("es-CO")}`,
      col2,
      tableTop + 25,
      {
        align: "right",
      }
    );

    doc.text(`Monto Pagado:`, col1, tableTop + 50);
    doc.text(
      `$${Number(pagoData.monto).toLocaleString("es-CO")}`,
      col2,
      tableTop + 50,
      {
        align: "right",
      }
    );

    doc.text(`Saldo Pendiente:`, col1, tableTop + 75);
    doc.text(
      `$${Number(pagoData.saldo_actual).toLocaleString("es-CO")}`,
      col2,
      tableTop + 75,
      {
        align: "right",
      }
    );

    doc
      .moveTo(50, tableTop + 85)
      .lineTo(500, tableTop + 85)
      .stroke();

    doc.fontSize(10).font("Helvetica-Bold");
    doc.text(`TOTAL PAGADO:`, col1, tableTop + 95);
    doc.text(
      `$${Number(pagoData.monto).toLocaleString("es-CO")}`,
      col2,
      tableTop + 95,
      {
        align: "right",
      }
    );

    doc.moveDown(3);

    // Pie de página
    doc
      .fontSize(9)
      .font("Helvetica")
      .text(
        "Este comprobante es válido como constancia de pago. Guárdelo para sus registros.",
        { align: "center" }
      );
    doc.text(
      `Generado: ${new Date().toLocaleDateString("es-CO")} ${new Date().toLocaleTimeString("es-CO")}`,
      { align: "center" }
    );

    doc.end();
  });
};

const registrarPago = (req, res) => {
  const usuarioId = req.user.id;
  const { compra_id, monto, cuota_id = null } = req.body;

  const getCompra = `
    SELECT c.*, u.correo, u.nombre_usuario, l.numero_lote, l.descripcion, l.area_m2
    FROM compra c
    JOIN usuarios u ON c.usuario_id = u.id
    JOIN lotes l ON c.lote_id = l.id
    WHERE c.id = ? AND c.usuario_id = ?
  `;

  db.query(getCompra, [compra_id, usuarioId], (err, results) => {
    if (err)
      return res.status(500).json({ error: "Error al obtener la compra" });

    if (results.length === 0)
      return res.status(404).json({ error: "Compra no encontrada" });

    const compra = results[0];

    if (monto <= 0)
      return res.status(400).json({ error: "Monto debe ser mayor a 0" });

    if (monto > compra.saldo_pendiente)
      return res.status(400).json({
        error: "Monto no puede ser mayor al saldo pendiente",
      });

    // Verificar si la compra tiene plan de cuotas
    if (compra.numero_cuotas > 1) {
      // Tiene plan de cuotas: buscar próxima cuota pendiente
      const getCuotaPendiente = `
        SELECT * FROM cuotas 
        WHERE compra_id = ? AND estado = 'pendiente' 
        ORDER BY numero_cuota ASC 
        LIMIT 1
      `;

      db.query(getCuotaPendiente, [compra_id], (err, cuotasResults) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Error al obtener cuota pendiente" });
        }

        if (cuotasResults.length === 0) {
          return res.status(400).json({
            error: "No hay cuotas pendientes para esta compra",
          });
        }

        const cuota = cuotasResults[0];

        // Validar que el pago sea al menos el valor de la cuota
        if (monto < cuota.valor_cuota) {
          return res.status(400).json({
            error: `El pago mínimo debe ser ${cuota.valor_cuota.toLocaleString("es-CO")} (valor de la cuota)`,
            valor_minimo: cuota.valor_cuota,
          });
        }

        const montoPagado = Number(monto);
        const montoExcedente = montoPagado - Number(cuota.valor_cuota);

        // Registrar el pago
        const insertPago = `
          INSERT INTO pagos (monto, fecha_pago, compra_id, tipo_pago, aplicado_a_cuota, cuota_id)
          VALUES (?, CURRENT_DATE(), ?, 'cuota', ?, ?)
        `;

        db.query(
          insertPago,
          [montoPagado, compra_id, cuota.numero_cuota, cuota.id],
          async (err, insertResults) => {
            if (err) {
              console.error("Error al registrar el pago:", err);
              return res.status(500).json({
                error: "Error al registrar el pago",
                details: err.message,
              });
            }

            const pagoId = insertResults.insertId;

            // Actualizar estado de la cuota
            const updateCuota = `
              UPDATE cuotas 
              SET estado = 'pagado', 
                  fecha_pago = CURRENT_DATE(), 
                  monto_pagado = ?
              WHERE id = ?
            `;

            db.query(updateCuota, [montoPagado, cuota.id], (err) => {
              if (err) {
                return res.status(500).json({
                  error: "Error al actualizar cuota",
                });
              }

              // Actualizar compra
              const nuevoSaldo = Number(compra.saldo_pendiente) - montoPagado;
              const nuevoEstado = nuevoSaldo === 0 ? "pagado" : "pendiente";
              const cuotasPagadas = Number(compra.cuotas_pagadas || 0) + 1;

              const updateCompra = `
                UPDATE compra 
                SET saldo_pendiente = ?, estado = ?, cuotas_pagadas = ?
                WHERE id = ?
              `;

              db.query(
                updateCompra,
                [nuevoSaldo, nuevoEstado, cuotasPagadas, compra_id],
                async (err) => {
                  if (err)
                    return res
                      .status(500)
                      .json({ error: "Error al actualizar la compra" });

                  // Generar PDF y enviar email
                  try {
                    const pagoData = {
                      pago_id: pagoId,
                      monto: montoPagado,
                      fecha_pago: new Date().toISOString().split("T")[0],
                      valor_total: compra.valor_total,
                      saldo_actual: nuevoSaldo,
                      numero_lote: compra.numero_lote,
                      descripcion: compra.descripcion,
                      area_m2: compra.area_m2,
                      nombre_usuario: compra.nombre_usuario,
                      correo: compra.correo,
                      cuota_numero: cuota.numero_cuota,
                      valor_cuota: cuota.valor_cuota,
                      excedente: montoExcedente,
                    };

                    const pdfBuffer = await generarPDFBuffer(pagoData);

                    const mailOptions = {
                      from: process.env.EMAIL_USER,
                      to: compra.correo,
                      subject: `Comprobante de pago - Cuota ${cuota.numero_cuota} - Lote ${compra.numero_lote}`,
                      html: `
                      <h2>¡Gracias por tu pago!</h2>
                      <p>Hola ${compra.nombre_usuario},</p>
                      <p>Te confirmamos que has realizado el pago de la <strong>Cuota ${cuota.numero_cuota}</strong> de <strong>$${Number(cuota.valor_cuota).toLocaleString("es-CO")}</strong> para el lote <strong>${compra.numero_lote}</strong>.</p>
                      <p><strong>Detalles del pago:</strong></p>
                      <ul>
                        <li>Número de comprobante: CP-${String(pagoId).padStart(5, "0")}</li>
                        <li>Cuota: ${cuota.numero_cuota} de ${compra.numero_cuotas}</li>
                        <li>Monto pagado: $${montoPagado.toLocaleString("es-CO")}</li>
                        ${montoExcedente > 0 ? `<li>Abono extra: $${montoExcedente.toLocaleString("es-CO")}</li>` : ""}
                        <li>Saldo pendiente: $${Number(nuevoSaldo).toLocaleString("es-CO")}</li>
                        <li>Cuotas pagadas: ${cuotasPagadas} de ${compra.numero_cuotas}</li>
                      </ul>
                      <p>Adjunto encontrarás tu comprobante de pago en PDF.</p>
                      <p>Para cualquier consulta, contacta con nosotros.</p>
                      <p>Saludos,<br>Altos del Roble</p>
                    `,
                      attachments: [
                        {
                          filename: `Comprobante-${pagoId}.pdf`,
                          content: pdfBuffer,
                          contentType: "application/pdf",
                        },
                      ],
                    };

                    transporter.sendMail(mailOptions, (err) => {
                      if (err) {
                        console.error(
                          "[EMAIL] Error enviando comprobante:",
                          err
                        );
                        return res.json({
                          message: "Pago de cuota registrado exitosamente",
                          saldo_restante: nuevoSaldo,
                          estado_compra: nuevoEstado,
                          cuota_pagada: cuota.numero_cuota,
                          cuotas_totales: compra.numero_cuotas,
                          email_enviado: false,
                        });
                      }

                      console.log(
                        `[EMAIL] Comprobante enviado a: ${compra.correo}`
                      );
                      res.json({
                        message:
                          "Pago de cuota registrado y comprobante enviado al correo",
                        saldo_restante: nuevoSaldo,
                        estado_compra: nuevoEstado,
                        cuota_pagada: cuota.numero_cuota,
                        cuotas_totales: compra.numero_cuotas,
                        email_enviado: true,
                      });
                    });
                  } catch (err) {
                    console.error("[PDF] Error generando PDF:", err);
                    res.json({
                      message: "Pago de cuota registrado exitosamente",
                      saldo_restante: nuevoSaldo,
                      estado_compra: nuevoEstado,
                      cuota_pagada: cuota.numero_cuota,
                      email_enviado: false,
                    });
                  }
                }
              );
            });
          }
        );
      });
    } else {
      // No tiene plan de cuotas: pago libre (legacy)
      const insertPago = `
        INSERT INTO pagos (monto, fecha_pago, compra_id, tipo_pago)
        VALUES (?, CURRENT_DATE(), ?, 'abono_extra')
      `;

      db.query(insertPago, [monto, compra_id], async (err, insertResults) => {
        if (err) {
          console.error("Error al registrar el pago:", err);
          return res.status(500).json({
            error: "Error al registrar el pago",
            details: err.message,
          });
        }

        const pagoId = insertResults.insertId;
        const nuevoSaldo = Number(compra.saldo_pendiente) - Number(monto);
        const nuevoEstado = nuevoSaldo === 0 ? "pagado" : "pendiente";

        const updateCompra = `
          UPDATE compra 
          SET saldo_pendiente = ?, estado = ?
          WHERE id = ?
        `;

        db.query(
          updateCompra,
          [nuevoSaldo, nuevoEstado, compra_id],
          async (err) => {
            if (err)
              return res
                .status(500)
                .json({ error: "Error al actualizar la compra" });

            // Generar PDF y enviar email (código legacy)
            try {
              const pagoData = {
                pago_id: pagoId,
                monto,
                fecha_pago: new Date().toISOString().split("T")[0],
                valor_total: compra.valor_total,
                saldo_actual: nuevoSaldo,
                numero_lote: compra.numero_lote,
                descripcion: compra.descripcion,
                area_m2: compra.area_m2,
                nombre_usuario: compra.nombre_usuario,
                correo: compra.correo,
              };

              const pdfBuffer = await generarPDFBuffer(pagoData);

              const mailOptions = {
                from: process.env.EMAIL_USER,
                to: compra.correo,
                subject: `Comprobante de pago - Altos del Roble - Lote ${compra.numero_lote}`,
                html: `
                <h2>¡Gracias por tu pago!</h2>
                <p>Hola ${compra.nombre_usuario},</p>
                <p>Te confirmamos que has realizado un pago exitoso de <strong>$${Number(monto).toLocaleString("es-CO")}</strong> para el lote <strong>${compra.numero_lote}</strong>.</p>
                <p><strong>Detalles del pago:</strong></p>
                <ul>
                  <li>Número de comprobante: CP-${String(pagoId).padStart(5, "0")}</li>
                  <li>Lote: ${compra.numero_lote}</li>
                  <li>Monto pagado: $${Number(monto).toLocaleString("es-CO")}</li>
                  <li>Saldo pendiente: $${Number(nuevoSaldo).toLocaleString("es-CO")}</li>
                </ul>
                <p>Adjunto encontrarás tu comprobante de pago en PDF.</p>
                <p>Para cualquier consulta, contacta con nosotros.</p>
                <p>Saludos,<br>Altos del Roble</p>
              `,
                attachments: [
                  {
                    filename: `Comprobante-${pagoId}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf",
                  },
                ],
              };

              transporter.sendMail(mailOptions, (err) => {
                if (err) {
                  console.error("[EMAIL] Error enviando comprobante:", err);
                  return res.json({
                    message: "Pago registrado exitosamente",
                    saldo_restante: nuevoSaldo,
                    estado_compra: nuevoEstado,
                    email_enviado: false,
                  });
                }

                console.log(`[EMAIL] Comprobante enviado a: ${compra.correo}`);
                res.json({
                  message: "Pago registrado y comprobante enviado al correo",
                  saldo_restante: nuevoSaldo,
                  estado_compra: nuevoEstado,
                  email_enviado: true,
                });
              });
            } catch (err) {
              console.error("[PDF] Error generando PDF:", err);
              res.json({
                message: "Pago registrado exitosamente",
                saldo_restante: nuevoSaldo,
                estado_compra: nuevoEstado,
                email_enviado: false,
              });
            }
          }
        );
      });
    }
  });
};

/* ============================= */
/*  NUEVA FUNCIÓN: HISTORIAL    */
/* ============================= */

const historialPagos = (req, res) => {
  const usuarioId = req.user.id;
  const { compra_id } = req.params;

  const verificarCompra = `
    SELECT id FROM compra
    WHERE id = ? AND usuario_id = ?
  `;

  db.query(verificarCompra, [compra_id, usuarioId], (err, results) => {
    if (err)
      return res.status(500).json({ error: "Error al verificar compra" });

    if (results.length === 0)
      return res.status(404).json({ error: "Compra no encontrada" });

    const getPagos = `
      SELECT id, monto, fecha_pago, comprobante
      FROM pagos
      WHERE compra_id = ?
      ORDER BY fecha_pago ASC
    `;

    db.query(getPagos, [compra_id], (err, pagos) => {
      if (err) return res.status(500).json({ error: "Error al obtener pagos" });

      if (pagos.length === 0) {
        return res.status(200).json({
          message: "Esta compra aún no tiene pagos registrados",
          pagos: [],
        });
      }

      res.status(200).json({
        total_pagos: pagos.length,
        pagos,
      });
    });
  });
};

// Enviar comprobante de pago por email
const enviarComprobantePago = (req, res) => {
  const usuarioId = req.user.id;
  const { pago_id } = req.body;

  if (!pago_id)
    return res.status(400).json({ message: "pago_id es requerido" });

  const getPagoQuery = `
    SELECT 
      p.id,
      p.monto,
      p.fecha_pago,
      p.comprobante,
      c.id as compra_id,
      c.numero_referencia,
      l.numero_lote,
      u.nombre_usuario,
      u.correo
    FROM pagos p
    INNER JOIN compra c ON p.compra_id = c.id
    INNER JOIN lotes l ON c.lote_id = l.id
    INNER JOIN usuarios u ON c.usuario_id = u.id
    WHERE p.id = ? AND c.usuario_id = ?
  `;

  db.query(getPagoQuery, [pago_id, usuarioId], (err, results) => {
    if (err) {
      console.error("Error al obtener pago:", err);
      return res.status(500).json({ error: "Error al obtener el pago" });
    }

    if (results.length === 0)
      return res.status(404).json({ error: "Pago no encontrado" });

    const pago = results[0];

    // Enviar email con comprobante
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: pago.correo,
      subject: `Comprobante de Pago - Lote ${pago.numero_lote}`,
      html: `
        <h2>Comprobante de Pago</h2>
        <p>Hola ${pago.nombre_usuario},</p>
        <p>Adjunto encontrarás tu comprobante de pago.</p>
        
        <h3>Detalles del Pago:</h3>
        <ul>
          <li><strong>Monto:</strong> $${pago.monto.toLocaleString("es-CO")}</li>
          <li><strong>Fecha:</strong> ${new Date(pago.fecha_pago).toLocaleDateString("es-CO")}</li>
          <li><strong>Lote:</strong> ${pago.numero_lote}</li>
          <li><strong>Referencia:</strong> ${pago.numero_referencia}</li>
        </ul>
        
        <p>Si tienes preguntas, no dudes en contactarnos.</p>
        <p>Gracias por tu compra.</p>
      `,
      attachments: pago.comprobante
        ? [{ filename: pago.comprobante, path: `./${pago.comprobante}` }]
        : [],
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error("Error enviando email:", err);
        return res.status(500).json({
          message: "Error al enviar el comprobante por email",
        });
      }

      res.json({
        message: "Comprobante enviado exitosamente al correo",
      });
    });
  });
};

/* ============================= */
/*  DESCARGAR COMPROBANTE PDF   */
/* ============================= */

const descargarComprobante = (req, res) => {
  const usuarioId = req.user.id;
  const { pago_id } = req.params;

  console.log(`[COMPROBANTE] Usuario: ${usuarioId}, Pago: ${pago_id}`);

  const getPago = `
    SELECT 
      p.id as pago_id,
      p.monto,
      p.fecha_pago,
      c.id as compra_id,
      c.valor_total,
      c.saldo_pendiente as saldo_actual,
      l.numero_lote,
      l.descripcion,
      l.area_m2,
      u.nombre_usuario,
      u.correo
    FROM pagos p
    JOIN compra c ON p.compra_id = c.id
    JOIN lotes l ON c.lote_id = l.id
    JOIN usuarios u ON c.usuario_id = u.id
    WHERE p.id = ? AND u.id = ?
  `;

  db.query(getPago, [pago_id, usuarioId], (err, results) => {
    if (err) {
      console.error("[COMPROBANTE] Error en query:", err);
      return res.status(500).json({
        error: "Error al obtener el pago",
        details: err.message,
      });
    }

    console.log(`[COMPROBANTE] Resultados encontrados:`, results.length);

    if (results.length === 0) {
      return res.status(404).json({
        error: "Comprobante no encontrado",
        mensaje:
          "Verifica que el ID del pago sea correcto y que pertenezca al usuario autenticado",
      });
    }

    const pago = results[0];
    console.log(`[COMPROBANTE] Generando PDF para pago:`, pago.pago_id);

    // Crear PDF
    const doc = new PDFDocument({ bufferPages: true, margin: 50 });

    // Headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Comprobante-${pago.pago_id}.pdf"`
    );

    // Pasar el PDF al cliente
    doc.pipe(res);

    // Encabezado
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("COMPROBANTE DE PAGO", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica").text("Altos del Roble", {
      align: "center",
    });
    doc.fontSize(10).text("Portal de Transacciones Inmobiliarias", {
      align: "center",
    });

    doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
    doc.moveDown(1);

    // Información del comprobante
    doc.fontSize(11).font("Helvetica-Bold").text("Información del Comprobante");
    doc.fontSize(10).font("Helvetica");
    doc
      .text(`Número: CP-${String(pago.pago_id).padStart(5, "0")}`, {
        width: 200,
        continued: true,
      })
      .text(`Fecha: ${new Date(pago.fecha_pago).toLocaleDateString("es-CO")}`, {
        align: "right",
      });

    doc.moveDown(1);

    // Información del cliente
    doc.fontSize(11).font("Helvetica-Bold").text("Información del Cliente");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Nombre: ${pago.nombre_usuario}`);
    doc.text(`Correo: ${pago.correo}`);

    doc.moveDown(1);

    // Información del lote
    doc.fontSize(11).font("Helvetica-Bold").text("Información de la Propiedad");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Lote: ${pago.numero_lote}`);
    doc.text(`Descripción: ${pago.descripcion}`);
    doc.text(`Área: ${pago.area_m2} m²`);

    doc.moveDown(1);

    // Información financiera
    doc.fontSize(11).font("Helvetica-Bold").text("Detalles del Pago");

    // Tabla simple
    const tableTop = doc.y + 20;
    const col1 = 60;
    const col2 = 300;

    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Concepto", col1, tableTop);
    doc.text("Valor", col2, tableTop, { align: "right" });

    doc
      .moveTo(50, tableTop + 15)
      .lineTo(500, tableTop + 15)
      .stroke();

    doc.fontSize(10).font("Helvetica");
    doc.text(`Valor Total del Lote:`, col1, tableTop + 25);
    doc.text(
      `$${Number(pago.valor_total).toLocaleString("es-CO")}`,
      col2,
      tableTop + 25,
      {
        align: "right",
      }
    );

    doc.text(`Monto Pagado:`, col1, tableTop + 50);
    doc.text(
      `$${Number(pago.monto).toLocaleString("es-CO")}`,
      col2,
      tableTop + 50,
      {
        align: "right",
      }
    );

    doc.text(`Saldo Pendiente:`, col1, tableTop + 75);
    doc.text(
      `$${Number(pago.saldo_actual).toLocaleString("es-CO")}`,
      col2,
      tableTop + 75,
      {
        align: "right",
      }
    );

    doc
      .moveTo(50, tableTop + 85)
      .lineTo(500, tableTop + 85)
      .stroke();

    doc.fontSize(10).font("Helvetica-Bold");
    doc.text(`TOTAL PAGADO:`, col1, tableTop + 95);
    doc.text(
      `$${Number(pago.monto).toLocaleString("es-CO")}`,
      col2,
      tableTop + 95,
      {
        align: "right",
      }
    );

    doc.moveDown(3);

    // Pie de página
    doc
      .fontSize(9)
      .font("Helvetica")
      .text(
        "Este comprobante es válido como constancia de pago. Guárdelo para sus registros.",
        { align: "center" }
      );
    doc.text(
      `Generado: ${new Date().toLocaleDateString("es-CO")} ${new Date().toLocaleTimeString("es-CO")}`,
      { align: "center" }
    );

    // Finalizar PDF
    doc.end();
  });
};

module.exports = {
  registrarPago,
  historialPagos,
  enviarComprobantePago,
  descargarComprobante,
};
