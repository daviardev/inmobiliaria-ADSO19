/**
 * Lógica de inicialización del panel de cliente
 */

import { api, requireAuth, logout } from "./api.js";

let comprasCache = [];
let selectedPlanoId = null;

function formatCurrency(value) {
  const amount = Number(value || 0);
  return amount.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-CO");
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

// ─── LOADERS ───
function showLoader(message = "Cargando...") {
  let overlay = document.getElementById("loader-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "loader-overlay";
    overlay.className = "loader-overlay";
    overlay.innerHTML = `
      <div style="text-align: center;">
        <div class="spinner"></div>
        <p style="color: white; margin-top: 16px; font-size: 14px; font-weight: 500;">${message}</p>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  overlay.style.display = "flex";
}

function hideLoader() {
  const overlay = document.getElementById("loader-overlay");
  if (overlay) overlay.style.display = "none";
}

// ─── ALERTS ───
function showAlert(message, type = "success") {
  const container =
    document.getElementById("alerts-container") || createAlertsContainer();
  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.innerHTML = `
    <span>${message}</span>
    <span class="alert-close" onclick="this.parentElement.remove()">✕</span>
  `;
  container.appendChild(alert);

  // Auto remove después de 5 segundos
  setTimeout(() => alert.remove(), 5000);
}

function createAlertsContainer() {
  const container = document.createElement("div");
  container.id = "alerts-container";
  container.style.cssText =
    "position: fixed; top: 80px; right: 20px; z-index: 9998; width: 90%; max-width: 400px;";
  document.body.appendChild(container);
  return container;
}

// ─── VALIDACIONES ───
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validateForm(formData, rules) {
  const errors = {};

  Object.entries(rules).forEach(([field, fieldRules]) => {
    const value = formData[field];

    if (fieldRules.required && (!value || value.toString().trim() === "")) {
      errors[field] = `${fieldRules.label} es requerido`;
      return;
    }

    if (
      fieldRules.minLength &&
      value &&
      value.toString().length < fieldRules.minLength
    ) {
      errors[field] =
        `${fieldRules.label} debe tener mínimo ${fieldRules.minLength} caracteres`;
    }

    if (
      fieldRules.maxLength &&
      value &&
      value.toString().length > fieldRules.maxLength
    ) {
      errors[field] =
        `${fieldRules.label} no puede exceder ${fieldRules.maxLength} caracteres`;
    }

    if (fieldRules.min && Number(value) < fieldRules.min) {
      errors[field] = `${fieldRules.label} debe ser mínimo ${fieldRules.min}`;
    }

    if (fieldRules.max && Number(value) > fieldRules.max) {
      errors[field] = `${fieldRules.label} no puede exceder ${fieldRules.max}`;
    }

    if (fieldRules.email && value && !validateEmail(value)) {
      errors[field] = `${fieldRules.label} no es válido`;
    }

    if (fieldRules.custom) {
      const customError = fieldRules.custom(value);
      if (customError) errors[field] = customError;
    }
  });

  return errors;
}

function displayFormErrors(errors, formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  // Limpiar errores previos
  form.querySelectorAll(".error-message").forEach((el) => el.remove());
  form
    .querySelectorAll(".form-error")
    .forEach((el) => el.classList.remove("form-error"));

  // Mostrar nuevos errores
  Object.entries(errors).forEach(([field, message]) => {
    const input = form.querySelector(`[name="${field}"]`);
    if (input) {
      input.classList.add("form-error");
      const errorEl = document.createElement("span");
      errorEl.className = "error-message";
      errorEl.textContent = message;
      input.parentElement.appendChild(errorEl);
    }
  });
}

function clearFormErrors(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.querySelectorAll(".error-message").forEach((el) => el.remove());
  form
    .querySelectorAll(".form-error")
    .forEach((el) => el.classList.remove("form-error"));
}

function estadoClass(estado) {
  const normalized = String(estado || "").toLowerCase();
  if (
    normalized === "disponible" ||
    normalized === "pagado" ||
    normalized === "resuelta"
  )
    return "verde";
  if (
    normalized === "reservado" ||
    normalized === "pendiente" ||
    normalized === "en_proceso"
  )
    return "amarillo";
  if (normalized === "vendido" || normalized === "rechazada") return "rojo";
  return "azul";
}

function estadoLabel(estado) {
  if (!estado) return "—";
  return String(estado)
    .replaceAll("_", " ")
    .replace(/^./, (char) => char.toUpperCase());
}

async function loadDashboard() {
  try {
    showLoader("Cargando estadísticas...");
    const data = await api.getDashboard();
    const resumen = data?.resumen || {};

    setText("stat-compras", String(resumen.total_compras || 0));
    setText("stat-total-invertido", formatCurrency(resumen.total_invertido));
    setText("stat-total-pagado", formatCurrency(resumen.total_pagado));
    setText("stat-total-pendiente", formatCurrency(resumen.total_pendiente));
    hideLoader();
  } catch (error) {
    hideLoader();
    showAlert("Error al cargar estadísticas", "error");
  }
}

function attachReserveEvents() {
  document.querySelectorAll(".reserve-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const loteId = Number(button.dataset.loteId);
      if (!loteId) return;

      // Buscar el lote en el cache
      const lote = allLotes.find((l) => l.id === loteId);
      if (!lote) {
        alert("Error: Lote no encontrado");
        return;
      }

      // Abrir modal de plan de cuotas
      openModalPlanCuotas(lote);
    });
  });
}

// Calcular cuota con interés (sistema francés)
function calcularCuotaConInteres(saldoFinanciado, tasaInteres, numeroCuotas) {
  if (numeroCuotas === 1) return saldoFinanciado;

  const i = tasaInteres;
  const n = numeroCuotas;
  const cuota =
    (saldoFinanciado * (i * Math.pow(1 + i, n))) / (Math.pow(1 + i, n) - 1);

  return Math.round(cuota);
}

async function cargarPlanos(loteId) {
  const planosGallery = document.getElementById("planos-gallery");
  if (!planosGallery) return;

  planosGallery.innerHTML =
    "<p style='grid-column: 1 / -1; color: #777; font-size: 13px;'>Cargando planos...</p>";
  selectedPlanoId = null;

  try {
    const response = await api.getPlanosLote(loteId);
    const planos = response?.planos || [];

    if (planos.length === 0) {
      planosGallery.innerHTML =
        "<p style='grid-column: 1 / -1; color: #777; font-size: 13px;'>No hay planos disponibles para este lote.</p>";
      return;
    }

    planosGallery.innerHTML = "";

    planos.forEach((plano, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "plano-card";
      card.innerHTML = `
        <img class="plano-image" src="${plano.image_url}" alt="${plano.nombre}" />
        <div class="plano-info">
          <p class="plano-name">${plano.nombre}</p>
          <p class="plano-desc">${plano.descripcion || ""}</p>
        </div>
      `;

      card.addEventListener("click", () => {
        document
          .querySelectorAll("#planos-gallery .plano-card")
          .forEach((el) => el.classList.remove("selected"));
        card.classList.add("selected");
        selectedPlanoId = plano.id;
      });

      planosGallery.appendChild(card);

      if (index === 0) {
        card.classList.add("selected");
        selectedPlanoId = plano.id;
      }
    });
  } catch (error) {
    console.error("Error al cargar planos:", error);
    planosGallery.innerHTML =
      "<p style='grid-column: 1 / -1; color: #b30000; font-size: 13px;'>No fue posible cargar los planos.</p>";
  }
}

// Abrir modal con plan de cuotas
function openModalPlanCuotas(lote) {
  const modal = document.getElementById("modal-compra-cuotas");
  const precio = Number(lote.precio);
  // Cargar planos para este lote
  cargarPlanos(lote.id);

  // Llenar información del lote
  document.getElementById("modal-lote-nombre").textContent =
    `Lote ${lote.numero_lote}`;
  document.getElementById("modal-lote-precio").textContent =
    `$${precio.toLocaleString("es-CO")}`;

  // Función para actualizar preview
  const actualizarPreview = () => {
    const porcentajeEnganche = Number(
      document.getElementById("porcentaje-enganche").value,
    );
    const numeroCuotas = Number(document.getElementById("numero-cuotas").value);
    const tasaInteres = 0.01; // 1% mensual

    const valorEnganche = Math.round(precio * (porcentajeEnganche / 100));
    const saldoFinanciar = precio - valorEnganche;
    const cuotaMensual =
      numeroCuotas > 1
        ? calcularCuotaConInteres(saldoFinanciar, tasaInteres, numeroCuotas)
        : 0;

    // Actualizar preview
    document.getElementById("preview-valor-lote").textContent =
      `$${precio.toLocaleString("es-CO")}`;
    document.getElementById("preview-enganche").textContent =
      `$${valorEnganche.toLocaleString("es-CO")} (${porcentajeEnganche}%)`;
    document.getElementById("preview-saldo-financiar").textContent =
      `$${saldoFinanciar.toLocaleString("es-CO")}`;

    if (numeroCuotas === 1) {
      document.getElementById("preview-cuota-mensual").textContent =
        "Pago único";
      document.getElementById("preview-tasa").textContent = "Sin interés";
    } else {
      document.getElementById("preview-cuota-mensual").textContent =
        `$${cuotaMensual.toLocaleString("es-CO")}`;
      document.getElementById("preview-tasa").textContent =
        `1% mensual (${numeroCuotas} cuotas)`;
    }
  };

  // Event listeners para actualizar preview
  document.getElementById("porcentaje-enganche").onchange = actualizarPreview;
  document.getElementById("numero-cuotas").onchange = actualizarPreview;

  // Actualizar preview inicial
  actualizarPreview();

  // Manejar confirmación
  const btnConfirmar = document.getElementById("btn-confirmar-compra");
  const newBtnConfirmar = btnConfirmar.cloneNode(true); // Remover listeners previos
  btnConfirmar.parentNode.replaceChild(newBtnConfirmar, btnConfirmar);

  newBtnConfirmar.addEventListener("click", async () => {
    const porcentajeEnganche = Number(
      document.getElementById("porcentaje-enganche").value,
    );
    const numeroCuotas = Number(document.getElementById("numero-cuotas").value);
    const valorEnganche = Math.round(precio * (porcentajeEnganche / 100));

    if (!selectedPlanoId) {
      alert("Debes seleccionar un plano antes de confirmar la compra.");
      return;
    }

    newBtnConfirmar.disabled = true;
    newBtnConfirmar.textContent = "Procesando...";

    try {
      await api.createCompra(
        lote.id,
        valorEnganche,
        porcentajeEnganche,
        numeroCuotas,
        selectedPlanoId,
      );
      modal.style.display = "none";
      alert(
        "¡Compra creada exitosamente! Revisa la sección 'Mis Compras' para ver tu plan de cuotas.",
      );

      // Recargar datos
      await Promise.all([
        loadDashboard(),
        loadLotes(),
        loadCompras(),
        loadPagos(),
      ]);
    } catch (error) {
      alert(error.message || "No fue posible completar la compra.");
    } finally {
      newBtnConfirmar.disabled = false;
      newBtnConfirmar.textContent = "Confirmar Compra";
    }
  });

  // Mostrar modal
  modal.style.display = "flex";
}

let allLotes = []; // Cache de todos los lotes

async function loadLotes() {
  const container = document.getElementById("lotes-grid");
  if (!container) return;

  try {
    showLoader("Cargando lotes...");
    const response = await api.getLotes();
    allLotes = response?.lotes || [];
    hideLoader();

    if (allLotes.length === 0) {
      container.innerHTML =
        '<div class="table-card"><p>No hay lotes disponibles por ahora.</p></div>';
      return;
    }

    renderLotes(allLotes);
    attachReserveEvents();
  } catch (error) {
    hideLoader();
    container.innerHTML =
      '<div class="table-card"><p>Error cargando lotes.</p></div>';
    showAlert("Error al cargar los lotes", "error");
  }
}

function renderLotes(lotes) {
  const container = document.getElementById("lotes-grid");
  if (!container) return;

  if (lotes.length === 0) {
    container.innerHTML =
      '<div class="table-card"><p>No hay lotes que coincidan con los filtros.</p></div>';
    return;
  }

  container.innerHTML = lotes
    .map((lote) => {
      const estado = String(lote.estado || "").toLowerCase();
      const disponible = estado === "disponible";
      const badgeClass = estadoClass(estado);
      const label = estadoLabel(estado);
      const imageUrl =
        lote.image_url ||
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3C/svg%3E";

      return `
        <div class="lote-card" data-estado="${label}" data-precio="${lote.precio}" data-area="${lote.area_m2}" data-hab="${lote.habitaciones || 0}">
          <img src="${imageUrl}" alt="${lote.numero_lote}" style="width:100%;height:180px;object-fit:cover;border-radius:6px;margin-bottom:12px;">
          <div class="lote-id">Lote · ${lote.numero_lote || "N/A"}</div>
          <h4>${lote.descripcion || "Lote disponible"}</h4>
          <div class="lote-info">
            <span>📐 Área: <strong>${Number(lote.area_m2 || 0)} m²</strong></span>
            <span>📍 Etapa: <strong>${lote.etapa_id ? `Etapa ${lote.etapa_id}` : "General"}</strong></span>
          </div>
          <div class="lote-precio">${formatCurrency(lote.precio)}</div>
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="badge ${badgeClass}">${label}</span>
            ${
              disponible
                ? `<button class="btn-sm reserve-btn" data-lote-id="${lote.id}">Reservar</button>`
                : '<button class="btn-sm outline" disabled style="opacity:0.5;cursor:not-allowed;">No disponible</button>'
            }
          </div>
        </div>
      `;
    })
    .join("");
}

function applyFilters() {
  const search = document.getElementById("lote-search")?.value || "";
  const precioMin = Number(
    document.getElementById("lote-filter-precio-min")?.value || 0,
  );
  const precioMax = Number(
    document.getElementById("lote-filter-precio-max")?.value || Infinity,
  );
  const area = Number(document.getElementById("lote-filter-area")?.value || 0);
  const habitaciones = Number(
    document.getElementById("lote-filter-habitaciones")?.value || 0,
  );

  let filtered = allLotes.filter((lote) => {
    const matchSearch =
      search === "" ||
      lote.numero_lote.toLowerCase().includes(search.toLowerCase()) ||
      lote.descripcion.toLowerCase().includes(search.toLowerCase());

    const matchPrecio =
      Number(lote.precio) >= precioMin && Number(lote.precio) <= precioMax;
    const matchArea = area === 0 || Number(lote.area_m2) >= area;
    const matchHab =
      habitaciones === 0 || Number(lote.habitaciones) === habitaciones;

    return matchSearch && matchPrecio && matchArea && matchHab;
  });

  renderLotes(filtered);
  attachReserveEvents();
}

function fillPagoCompraSelect(compras) {
  const select = document.getElementById("payment-compra-id");
  if (!select) return;

  const options = ['<option value="">Seleccione una compra</option>'];
  compras.forEach((compra) => {
    options.push(
      `<option value="${compra.id}">Lote ${compra.numero_lote} · Saldo: ${formatCurrency(compra.saldo_pendiente)}</option>`,
    );
  });
  select.innerHTML = options.join("");
}

async function loadCompras() {
  const tbody = document.getElementById("compras-tbody");
  if (!tbody) return;

  try {
    showLoader("Cargando compras...");
    const response = await api.getMisCompras();
    const compras = response?.compras || [];
    comprasCache = compras;
    fillPagoCompraSelect(compras);
    hideLoader();

    if (compras.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="11">Aún no tienes compras registradas.</td></tr>';
      return;
    }

    tbody.innerHTML = compras
      .map((compra) => {
        const pagado =
          Number(compra.valor_total || 0) - Number(compra.saldo_pendiente || 0);
        const estado =
          Number(compra.saldo_pendiente || 0) === 0 ? "pagado" : "pendiente";
        const imageUrl =
          compra.image_url ||
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3C/svg%3E";

        const tieneCuotas = Number(compra.numero_cuotas || 1) > 1;
        const btnCuotas = tieneCuotas
          ? `<button class="btn-sm" onclick="window.verCuotasCompra(${compra.id})" style="background: var(--forest); color: white;">📅 Ver Cuotas (${compra.cuotas_pagadas || 0}/${compra.numero_cuotas})</button>`
          : "";
        const planoInfo = compra.plano_nombre
          ? `<div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
               <img
                 src="${compra.plano_image_url || imageUrl}"
                 alt="${compra.plano_nombre}"
                 style="width:32px;height:32px;object-fit:cover;border-radius:6px;border:1px solid #e5e5e5;"
               />
               <div style="font-size:12px;color:var(--muted);line-height:1.2;">
                 Plano elegido:<br><strong style="color:var(--forest);">${compra.plano_nombre}</strong>
               </div>
             </div>`
          : "";

        return `
          <tr>
            <td width="80"><img src="${imageUrl}" alt="Lote" style="width:100%;height:60px;object-fit:cover;border-radius:4px;"></td>
            <td><strong>${compra.numero_lote || "—"}</strong></td>
            <td>${compra.descripcion || "—"}${planoInfo}</td>
            <td>${Number(compra.area_m2 || 0)} m²</td>
            <td>${compra.habitaciones || "—"}</td>
            <td>${compra.etapa_id ? `Etapa ${compra.etapa_id}` : "—"}</td>
            <td>${formatCurrency(compra.valor_total)}</td>
            <td>${formatCurrency(pagado)}</td>
            <td>${formatCurrency(compra.saldo_pendiente)}</td>
            <td><span class="badge ${estadoClass(estado)}">${estadoLabel(estado)}</span></td>
            <td>
              <div style="display: flex; gap: 5px; flex-direction: column;">
                <button class="btn-sm" onclick="window.descargarFactura(${compra.id})">📄 Factura</button>
                ${btnCuotas}
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  } catch (error) {
    hideLoader();
    tbody.innerHTML = '<tr><td colspan="11">Error cargando compras.</td></tr>';
    showAlert("Error al cargar tus compras", "error");
  }
}

// Ver cuotas de una compra
async function verCuotasCompra(compraId) {
  try {
    showLoader("Cargando calendario de cuotas...");
    const response = await api.getCuotasCompra(compraId);
    const cuotas = response?.cuotas || [];
    hideLoader();

    if (cuotas.length === 0) {
      alert("Esta compra no tiene cuotas registradas.");
      return;
    }

    // Crear modal con el calendario
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.style.display = "flex";
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 900px;">
        <span class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</span>
        <h2 style="color: var(--forest); margin-bottom: 20px;">Calendario de Cuotas - Compra #${compraId}</h2>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div>
              <span style="font-size: 12px; color: #666;">Total cuotas</span>
              <p style="margin: 5px 0; font-size: 20px; font-weight: bold; color: var(--forest);">${cuotas.length}</p>
            </div>
            <div>
              <span style="font-size: 12px; color: #666;">Cuotas pagadas</span>
              <p style="margin: 5px 0; font-size: 20px; font-weight: bold; color: #28a745;">${cuotas.filter((c) => c.estado === "pagado").length}</p>
            </div>
            <div>
              <span style="font-size: 12px; color: #666;">Cuotas pendientes</span>
              <p style="margin: 5px 0; font-size: 20px; font-weight: bold; color: #ffc107;">${cuotas.filter((c) => c.estado === "pendiente").length}</p>
            </div>
            <div>
              <span style="font-size: 12px; color: #666;">Cuotas vencidas</span>
              <p style="margin: 5px 0; font-size: 20px; font-weight: bold; color: #dc3545;">${cuotas.filter((c) => c.estado === "vencido").length}</p>
            </div>
          </div>
        </div>

        <div style="overflow-x: auto;">
          <table class="cuotas-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cuota</th>
                <th>Capital</th>
                <th>Interés</th>
                <th>Saldo Restante</th>
                <th>Vencimiento</th>
                <th>Pagado</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${cuotas
                .map(
                  (cuota) => `
                <tr>
                  <td>${cuota.numero_cuota}</td>
                  <td><strong>${formatCurrency(cuota.valor_cuota)}</strong></td>
                  <td>${formatCurrency(cuota.monto_capital)}</td>
                  <td>${formatCurrency(cuota.monto_interes)}</td>
                  <td>${formatCurrency(cuota.saldo_restante)}</td>
                  <td>${new Date(cuota.fecha_vencimiento).toLocaleDateString("es-CO")}</td>
                  <td>${cuota.monto_pagado > 0 ? formatCurrency(cuota.monto_pagado) : "—"}</td>
                  <td>
                    <span class="estado-cuota ${cuota.estado}">
                      ${cuota.estado}
                    </span>
                  </td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 20px; text-align: right;">
          <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                  style="padding: 10px 20px; background: #ccc; border: none; border-radius: 8px; cursor: pointer;">
            Cerrar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  } catch (error) {
    hideLoader();
    alert("Error al cargar las cuotas: " + error.message);
  }
}

// Hacer función accesible globalmente
window.verCuotasCompra = verCuotasCompra;

async function downloadComprobantePDF(pagoId) {
  try {
    // Llamar al backend para descargar el comprobante PDF
    const response = await fetch(
      `http://localhost:3000/api/pagos/${pagoId}/comprobante`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );
    if (!response.ok) throw new Error("Error al descargar comprobante");
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Comprobante-${pagoId}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    alert("No fue posible descargar el comprobante: " + error.message);
  }
}

// Hacer la función accesible globalmente desde HTML onclick
window.downloadComprobantePDF = downloadComprobantePDF;

async function descargarFactura(compraId) {
  try {
    // Llamar al backend para descargar la factura PDF
    const response = await fetch(
      `http://localhost:3000/api/compra/${compraId}/factura`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Factura-${String(compraId).padStart(5, "0")}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    alert("No fue posible descargar la factura: " + error.message);
  }
}

// Hacer la función accesible globalmente desde HTML onclick
window.descargarFactura = descargarFactura;

async function loadPagos() {
  const tbody = document.getElementById("pagos-tbody");
  if (!tbody) return;

  try {
    showLoader("Cargando pagos...");
    if (!comprasCache.length) {
      tbody.innerHTML =
        '<tr><td colspan="7">No hay compras para mostrar pagos.</td></tr>';
      hideLoader();
      return;
    }

    const historialResponses = await Promise.all(
      comprasCache.map(async (compra) => {
        const response = await api.getPagosHistorial(compra.id);
        return (response?.pagos || []).map((pago) => ({
          ...pago,
          numero_lote: compra.numero_lote,
        }));
      }),
    );

    const pagos = historialResponses.flat();

    if (!pagos.length) {
      tbody.innerHTML =
        '<tr><td colspan="7">Aún no tienes pagos registrados.</td></tr>';
      hideLoader();
      return;
    }

    tbody.innerHTML = pagos
      .map((pago, index) => {
        const numeroComprobante = String(pago.id || index).padStart(5, "0");
        return `
        <tr>
          <td>${String(index + 1).padStart(3, "0")}</td>
          <td>${formatDate(pago.fecha_pago)}</td>
          <td>${pago.numero_lote || "—"}</td>
          <td>${formatCurrency(pago.monto)}</td>
          <td>${pago.metodo || "Transferencia"}</td>
          <td><code style="background:#f0f0f0;padding:4px 8px;border-radius:3px;font-size:12px;">CP-${numeroComprobante}</code></td>
          <td><button class="btn-sm outline" onclick="downloadComprobantePDF(${pago.id})">📄 PDF</button></td>
        </tr>
      `;
      })
      .join("");
    hideLoader();
  } catch (error) {
    hideLoader();
    tbody.innerHTML = '<tr><td colspan="7">Error cargando pagos.</td></tr>';
    showAlert("Error al cargar los pagos", "error");
  }
}

async function loadPQRS() {
  const tbody = document.getElementById("pqrs-tbody");
  if (!tbody) return;

  try {
    showLoader("Cargando solicitudes...");
    const pqrs = await api.getMisPQRS();
    hideLoader();

    if (!Array.isArray(pqrs) || pqrs.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5">Aún no tienes solicitudes PQRS.</td></tr>';
      return;
    }

    tbody.innerHTML = pqrs
      .map(
        (item) => `
          <tr>
            <td><strong>#${item.id}</strong></td>
            <td>${item.tipo || "—"}</td>
            <td>${item.asunto || "—"}</td>
            <td>
              <div class="pqrs-status-row">
                <div class="dot ${item.respuesta ? "verde" : "amarillo"}"></div>
                ${item.respuesta ? "Resuelta" : "En revisión"}
              </div>
            </td>
            <td>${item.respuesta || "—"}</td>
          </tr>
        `,
      )
      .join("");
  } catch (error) {
    hideLoader();
    tbody.innerHTML = '<tr><td colspan="5">Error cargando PQRS.</td></tr>';
    showAlert("Error al cargar las solicitudes", "error");
  }
}

async function initPanel() {
  if (!requireAuth()) return;

  try {
    // Obtener usuario de localStorage (ya se guardó en auth.js)
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    if (user) {
      const name = user.nombre_usuario || "Cliente";
      const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();

      const userNameEl = document.getElementById("user-name");
      const userAvatarEl = document.getElementById("user-avatar");
      const perfilAvatarEl = document.getElementById("perfil-avatar");
      const perfilNameEl = document.getElementById("perfil-name");
      const perfilEmailEl = document.getElementById("perfil-email");

      if (userNameEl) userNameEl.textContent = name;
      if (userAvatarEl) userAvatarEl.textContent = initials;
      if (perfilAvatarEl) perfilAvatarEl.textContent = initials;
      if (perfilNameEl) perfilNameEl.textContent = name;
      if (perfilEmailEl) perfilEmailEl.textContent = user.correo || "";

      await Promise.all([loadDashboard(), loadLotes(), loadCompras()]);
      await Promise.all([loadPagos(), loadPQRS()]);
    } else {
      logout();
    }
  } catch (err) {
    logout();
  } finally {
    hideLoader();
  }
}

// ─── INICIALIZAR PANEL ───
document.addEventListener("DOMContentLoaded", () => {
  hideLoader();
  initPanel();

  // ─── LOGOUT ───
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logout();
    });
  }

  // ─── NAVIGATION ───
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll(".section");

  function showSection(id) {
    sections.forEach((s) => s.classList.remove("active"));
    navLinks.forEach((l) => l.classList.remove("active"));
    const target = document.getElementById(id);
    if (target) target.classList.add("active");
    document
      .querySelectorAll(`[data-section="${id}"]`)
      .forEach((l) => l.classList.add("active"));
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      if (section) showSection(section);
    });
  });

  // Show first section by default
  const firstSection = sections[0];
  if (firstSection) {
    firstSection.classList.add("active");
    const firstNav = document.querySelector(
      '[data-section="' + firstSection.id + '"]',
    );
    if (firstNav) firstNav.classList.add("active");
  }

  // ─── LOTE FILTER & SEARCH ───
  const setupFilterListeners = () => {
    // Setup filter event listeners
    const filterInputs = [
      "lote-search",
      "lote-filter-precio-min",
      "lote-filter-precio-max",
      "lote-filter-area",
      "lote-filter-habitaciones",
    ];

    filterInputs.forEach((id) => {
      const elem = document.getElementById(id);
      if (elem) {
        elem.addEventListener("input", applyFilters);
        elem.addEventListener("change", applyFilters);
      }
    });

    // Clear filters button
    const clearBtn = document.getElementById("filter-limpiar");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        filterInputs.forEach((id) => {
          const elem = document.getElementById(id);
          if (elem) elem.value = "";
        });
        renderLotes(allLotes);
        attachReserveEvents();
      });
    }
  };

  setupFilterListeners();

  // ─── PQRS FORM ───
  document.getElementById("pqrs-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    clearFormErrors("pqrs-form");

    const tipo = document.getElementById("pqrs-tipo")?.value;
    const asunto = document.getElementById("pqrs-asunto")?.value?.trim();
    const descripcion = document
      .getElementById("pqrs-descripcion")
      ?.value?.trim();

    // Validaciones
    const errors = {};
    if (!tipo) errors["pqrs-tipo"] = "Selecciona un tipo de solicitud";
    if (!asunto)
      errors["pqrs-asunto"] = "El asunto es obligatorio (mínimo 5 caracteres)";
    else if (asunto.length < 5)
      errors["pqrs-asunto"] = "El asunto debe tener mínimo 5 caracteres";
    if (!descripcion)
      errors["pqrs-descripcion"] =
        "La descripción es obligatoria (mínimo 20 caracteres)";
    else if (descripcion.length < 20)
      errors["pqrs-descripcion"] =
        "La descripción debe tener mínimo 20 caracteres";

    if (Object.keys(errors).length > 0) {
      displayFormErrors(errors, "pqrs-form");
      showAlert("Por favor completa todos los campos correctamente", "error");
      return;
    }

    showLoader("Enviando solicitud...");
    api
      .createPQRS(tipo, asunto, descripcion)
      .then(async () => {
        hideLoader();
        showAlert("✓ Solicitud enviada correctamente", "success");
        e.target.reset();
        clearFormErrors("pqrs-form");
        await loadPQRS();
      })
      .catch((error) => {
        hideLoader();
        showAlert(error.message || "Error al enviar la solicitud", "error");
      });
  });

  // ─── PAYMENT FORM ───
  document.getElementById("payment-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    clearFormErrors("payment-form");

    const compraId = Number(
      document.getElementById("payment-compra-id")?.value,
    );
    const monto = Number(document.getElementById("payment-monto")?.value || 0);

    // Validaciones
    const compraSeleccionada = comprasCache.find((c) => c.id === compraId);
    const saldoPendiente = compraSeleccionada
      ? Number(compraSeleccionada.saldo_pendiente)
      : 0;

    const rules = {
      "payment-compra-id": { required: true, label: "Compra" },
      "payment-monto": {
        required: true,
        label: "Monto",
        custom: () => {
          if (monto <= 0) return "El monto debe ser mayor a 0";
          if (monto > saldoPendiente)
            return `El monto no puede exceder $${formatCurrency(saldoPendiente)}`;
          return null;
        },
      },
    };

    const errors = {};
    if (!compraId) errors["payment-compra-id"] = "Selecciona una compra";
    if (!monto || monto <= 0)
      errors["payment-monto"] = "Ingresa un monto válido";
    if (monto > saldoPendiente)
      errors["payment-monto"] =
        `No puedes pagar más de $${formatCurrency(saldoPendiente)}`;

    if (Object.keys(errors).length > 0) {
      displayFormErrors(errors, "payment-form");
      showAlert("Por favor corrige los errores en el formulario", "error");
      return;
    }

    showLoader("Registrando pago...");
    api
      .registrarPago(compraId, monto)
      .then(async () => {
        hideLoader();
        showAlert("✓ Pago registrado exitosamente", "success");
        e.target.reset();
        clearFormErrors("payment-form");
        await Promise.all([loadDashboard(), loadCompras()]);
        await loadPagos();
      })
      .catch((error) => {
        hideLoader();
        showAlert(error.message || "Error al registrar el pago", "error");
      });
  });

  // ─── PROFILE FORM ───
  document.getElementById("profile-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    clearFormErrors("profile-form");

    const nombre = document.getElementById("profile-nombre")?.value?.trim();
    const correo = document.getElementById("profile-email")?.value?.trim();

    // Validaciones
    const errors = {};
    if (!nombre) {
      errors["profile-nombre"] = "El nombre es obligatorio";
    } else if (nombre.length < 3) {
      errors["profile-nombre"] = "El nombre debe tener mínimo 3 caracteres";
    }

    if (!correo) {
      errors["profile-email"] = "El correo es obligatorio";
    } else if (!validateEmail(correo)) {
      errors["profile-email"] = "Por favor ingresa un correo válido";
    }

    if (Object.keys(errors).length > 0) {
      displayFormErrors(errors, "profile-form");
      showAlert("Por favor corrige los errores en el formulario", "error");
      return;
    }

    showLoader("Actualizando perfil...");
    api
      .updateProfile(nombre, correo)
      .then(() => {
        hideLoader();
        showAlert("✓ Información actualizada correctamente", "success");
        clearFormErrors("profile-form");
        // Actualizar localStorage
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        user.nombre_usuario = nombre;
        user.correo = correo;
        localStorage.setItem("user", JSON.stringify(user));
        // Actualizar UI
        const nameChip = document.getElementById("user-name");
        if (nameChip) nameChip.textContent = nombre;
        const emailDisplay = document.getElementById("perfil-email");
        if (emailDisplay) emailDisplay.textContent = correo;
      })
      .catch((error) => {
        hideLoader();
        showAlert(
          error.message || "Error al actualizar la información",
          "error",
        );
      });
  });

  // ─── CARGAR DATOS PERFIL ───
  function loadProfileData() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.nombre_usuario) {
      const nameInput = document.getElementById("profile-nombre");
      if (nameInput) nameInput.value = user.nombre_usuario;
    }
    if (user.correo) {
      const emailInput = document.getElementById("profile-email");
      if (emailInput) emailInput.value = user.correo;
    }
  }

  loadProfileData();
});
