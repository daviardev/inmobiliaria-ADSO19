import { api, requireAuth, logout } from "./api.js";

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

function clearFormErrors(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.querySelectorAll(".error-message").forEach((el) => el.remove());
  form
    .querySelectorAll(".form-error")
    .forEach((el) => el.classList.remove("form-error"));
}

function displayFormErrors(errors, formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  clearFormErrors(formId);

  Object.entries(errors).forEach(([field, message]) => {
    const input = form.querySelector(`[name="${field}"]`);
    if (!input) return;

    input.classList.add("form-error");
    const errorEl = document.createElement("span");
    errorEl.className = "error-message";
    errorEl.textContent = message;
    input.parentElement.appendChild(errorEl);
  });
}

function estadoClass(estado) {
  const normalized = String(estado || "").toLowerCase();
  if (["disponible", "pagado", "resuelta"].includes(normalized)) return "verde";
  if (["reservado", "pendiente", "en_proceso"].includes(normalized))
    return "amarillo";
  if (["vendido", "rechazada"].includes(normalized)) return "rojo";
  return "azul";
}

function estadoLabel(estado) {
  if (!estado) return "—";
  return String(estado)
    .replaceAll("_", " ")
    .replace(/^./, (char) => char.toUpperCase());
}

function setupNavigation() {
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll(".section");

  function showSection(id) {
    sections.forEach((section) => section.classList.remove("active"));
    navLinks.forEach((link) => link.classList.remove("active"));

    const target = document.getElementById(id);
    if (target) target.classList.add("active");

    document
      .querySelectorAll(`[data-section="${id}"]`)
      .forEach((link) => link.classList.add("active"));
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      if (section) showSection(section);
    });
  });
}

async function loadLotes() {
  const tbody = document.getElementById("admin-lotes-tbody");
  if (!tbody) return [];

  const response = await api.getLotes();
  const lotes = response?.lotes || [];

  if (!lotes.length) {
    tbody.innerHTML = '<tr><td colspan="5">No hay lotes registrados.</td></tr>';
    return lotes;
  }

  tbody.innerHTML = lotes
    .slice(0, 12)
    .map(
      (lote) => `
      <tr>
        <td>${lote.id}</td>
        <td><strong>${lote.numero_lote || "—"}</strong></td>
        <td>${Number(lote.area_m2 || 0)} m²</td>
        <td>${formatCurrency(lote.precio)}</td>
        <td><span class="badge ${estadoClass(lote.estado)}">${estadoLabel(lote.estado)}</span></td>
      </tr>
    `,
    )
    .join("");

  return lotes;
}

async function loadCompras() {
  const tbody = document.getElementById("admin-compras-tbody");
  if (!tbody) return [];

  const response = await api.getTodasCompras();
  const compras = response?.compras || [];

  if (!compras.length) {
    tbody.innerHTML =
      '<tr><td colspan="8">No hay compras registradas.</td></tr>';
    return compras;
  }

  tbody.innerHTML = compras
    .map(
      (compra) => `
      <tr>
        <td>${compra.id}</td>
        <td>${formatDate(compra.fecha_compra)}</td>
        <td>${compra.nombre_usuario || "—"}</td>
        <td>${compra.correo || "—"}</td>
        <td>${compra.numero_lote || "—"}</td>
        <td>${Number(compra.area_m2 || 0)} m²</td>
        <td>${formatCurrency(compra.valor_total)}</td>
        <td>${formatCurrency(compra.saldo_pendiente)}</td>
      </tr>
    `,
    )
    .join("");

  return compras;
}

function renderPQRS(pqrsList) {
  const tbody = document.getElementById("admin-pqrs-tbody");
  if (!tbody) return;

  if (!pqrsList.length) {
    tbody.innerHTML = '<tr><td colspan="7">No hay PQRS registradas.</td></tr>';
    return;
  }

  tbody.innerHTML = pqrsList
    .map((item) => {
      const responded = Boolean(item.respuesta);

      return `
        <tr>
          <td><strong>#${item.id}</strong></td>
          <td>
            <div>${item.nombre_usuario || "—"}</div>
            <small style="color:#666;">${item.correo || ""}</small>
          </td>
          <td>${item.tipo || "—"}</td>
          <td>${item.asunto || "—"}</td>
          <td style="max-width: 240px; white-space: normal;">${item.descripcion || "—"}</td>
          <td><span class="badge ${responded ? "verde" : "amarillo"}">${responded ? "Resuelta" : "Pendiente"}</span></td>
          <td style="min-width:260px;">
            ${
              responded
                ? `<div style="white-space: normal;">${item.respuesta}</div>`
                : `
                <textarea id="pqrs-reply-${item.id}" rows="2" placeholder="Escribe una respuesta" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;margin-bottom:8px;"></textarea>
                <button class="btn-sm pqrs-reply-btn" data-id="${item.id}">Responder</button>
              `
            }
          </td>
        </tr>
      `;
    })
    .join("");
}

async function loadPQRS() {
  const pqrs = await api.getPQRSAdmin();
  const list = Array.isArray(pqrs) ? pqrs : [];
  renderPQRS(list);
  return list;
}

function updateSummary(lotes, compras, pqrsList) {
  const disponibles = lotes.filter(
    (lote) => String(lote.estado || "").toLowerCase() === "disponible",
  ).length;
  const pqrsPendientes = pqrsList.filter((item) => !item.respuesta).length;

  setText("admin-stat-lotes", String(lotes.length));
  setText("admin-stat-lotes-disponibles", String(disponibles));
  setText("admin-stat-compras", String(compras.length));
  setText("admin-stat-pqrs-pendientes", String(pqrsPendientes));
}

async function loadAll() {
  showLoader("Cargando panel administrativo...");
  try {
    const [lotes, compras, pqrsList] = await Promise.all([
      loadLotes(),
      loadCompras(),
      loadPQRS(),
    ]);

    updateSummary(lotes, compras, pqrsList);
  } catch (error) {
    showAlert(error.message || "No fue posible cargar el panel admin", "error");
  } finally {
    hideLoader();
  }
}

function setupLoteForm() {
  const form = document.getElementById("admin-lote-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFormErrors("admin-lote-form");

    const data = Object.fromEntries(new FormData(form).entries());
    const errors = {};

    if (!data.numero_lote?.trim())
      errors.numero_lote = "El número de lote es obligatorio";
    if (!data.area_m2 || Number(data.area_m2) <= 0)
      errors.area_m2 = "El área debe ser mayor a 0";
    if (!data.precio || Number(data.precio) <= 0)
      errors.precio = "El precio debe ser mayor a 0";

    if (Object.keys(errors).length) {
      displayFormErrors(errors, "admin-lote-form");
      showAlert("Corrige los errores del formulario", "error");
      return;
    }

    showLoader("Creando lote...");
    try {
      await api.createLote({
        numero_lote: data.numero_lote.trim(),
        area_m2: Number(data.area_m2),
        precio: Number(data.precio),
        descripcion: data.descripcion?.trim() || null,
        etapa_id: data.etapa_id ? Number(data.etapa_id) : null,
        habitaciones: data.habitaciones ? Number(data.habitaciones) : null,
        banos: data.banos ? Number(data.banos) : null,
        image_url: data.image_url?.trim() || null,
      });

      form.reset();
      showAlert("Lote creado exitosamente", "success");
      await loadAll();
    } catch (error) {
      showAlert(error.message || "No fue posible crear el lote", "error");
    } finally {
      hideLoader();
    }
  });
}

function setupPQRSReply() {
  document.addEventListener("click", async (e) => {
    const button = e.target.closest(".pqrs-reply-btn");
    if (!button) return;

    const id = Number(button.dataset.id);
    const input = document.getElementById(`pqrs-reply-${id}`);
    const respuesta = input?.value?.trim();

    if (!id || !respuesta) {
      showAlert("La respuesta es obligatoria", "error");
      return;
    }

    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = "Enviando...";

    try {
      await api.responderPQRS(id, respuesta);
      showAlert("PQRS respondida correctamente", "success");
      await loadAll();
    } catch (error) {
      showAlert(error.message || "No se pudo responder la PQRS", "error");
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });
}

function setAdminProfile() {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const name = user?.nombre_usuario || "Administrador";
  const initials = name
    .split(" ")
    .map((chunk) => chunk[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  setText("admin-name", name);
  setText("admin-avatar", initials);
}

function guardAdminRole() {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  if (!user || user.rol_id !== 2) {
    showAlert("Acceso permitido solo para administradores", "error");
    setTimeout(() => {
      window.location.href = "/src/pages/panel/index.html";
    }, 900);
    return false;
  }

  return true;
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth()) return;
  if (!guardAdminRole()) return;

  setAdminProfile();
  setupNavigation();
  setupLoteForm();
  setupPQRSReply();

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", () => logout());

  await loadAll();
});
