import "./style.css";
import { api } from "./js/api.js";

// ============================================
// NAVBAR FUNCTIONALITY
// ============================================

function initNavbar() {
  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");

  // Toggle menú móvil
  menuToggle.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });

  // Cerrar menú móvil al hacer click en un link
  const mobileLinks = mobileMenu.querySelectorAll("a, button");
  mobileLinks.forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.add("hidden");
    });
  });
}

// ============================================
// HERO GALLERY FUNCTIONALITY
// ============================================

function initHeroGallery() {
  const mainImage = document.getElementById("heroMainImage");
  const thumbs = document.querySelectorAll("[data-hero-image]");

  if (!mainImage || thumbs.length === 0) return;

  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const nextSrc = thumb.getAttribute("data-hero-image");
      if (!nextSrc) return;
      mainImage.src = nextSrc;
      thumbs.forEach((item) => item.classList.remove("is-active"));
      thumb.classList.add("is-active");
    });
  });
}

function initImageFallbacks() {
  const fallbackSvg =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'>
        <defs>
          <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
            <stop offset='0%' stop-color='#e5e7eb'/>
            <stop offset='100%' stop-color='#d1d5db'/>
          </linearGradient>
        </defs>
        <rect width='800' height='500' fill='url(#g)'/>
        <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='28' fill='#374151'>Imagen no disponible</text>
      </svg>
    `);

  document.querySelectorAll("img").forEach((img) => {
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    img.addEventListener("error", () => {
      if (img.dataset.fallbackApplied === "true") return;
      img.dataset.fallbackApplied = "true";
      img.src = fallbackSvg;
      img.classList.add("object-cover");
    });
  });
}

function initDetailsModal() {
  const modal = document.getElementById("details-modal");
  const closeBtn = document.getElementById("modal-close-btn");
  const primaryAction = document.getElementById("modal-primary-action");
  const title = document.getElementById("modal-title");
  const subtitle = document.getElementById("modal-subtitle");
  const price = document.getElementById("modal-price");
  const description = document.getElementById("modal-description");
  const features = document.getElementById("modal-features");
  const triggers = document.querySelectorAll(".details-trigger");

  if (
    !modal ||
    !closeBtn ||
    !primaryAction ||
    !title ||
    !subtitle ||
    !price ||
    !description ||
    !features ||
    triggers.length === 0
  ) {
    return;
  }

  const closeModal = () => {
    modal.classList.add("hidden");
    document.body.classList.remove("modal-open");
  };

  const openModal = (button) => {
    title.textContent = button.dataset.title || "Detalle";
    subtitle.textContent = button.dataset.subtitle || "Información";
    price.textContent = button.dataset.price || "";
    description.textContent =
      button.dataset.description || "Información adicional disponible.";

    const featureItems = (button.dataset.features || "")
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);

    features.innerHTML = featureItems
      .map(
        (item) => `
          <li class="flex items-start gap-2">
            <span class="mt-1 w-2 h-2 rounded-full bg-amber-600"></span>
            <span>${item}</span>
          </li>
        `,
      )
      .join("");

    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => openModal(trigger));
  });

  closeBtn.addEventListener("click", closeModal);
  primaryAction.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (event.target.dataset.modalClose === "true") {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });
}

function formatCOP(value) {
  const numeric = Number(value) || 0;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(numeric);
}

function renderLotesDisponibles(lotes = []) {
  const container = document.getElementById("lotes-disponibles-grid");
  if (!container) return;

  if (!lotes.length) {
    container.innerHTML =
      '<p class="col-span-full text-center text-gray-500">No hay lotes disponibles por ahora.</p>';
    return;
  }

  const html = lotes
    .slice(0, 6)
    .map((lote) => {
      const imageUrl =
        lote.image_url ||
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80";
      const estado = (lote.estado || "disponible").toString();
      return `
        <article class="landing-card bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200 hover:shadow-2xl transition-all">
          <img src="${imageUrl}" alt="${lote.numero_lote || "Lote"}" class="w-full h-52 object-cover">
          <div class="p-6 space-y-3">
            <div class="flex items-center justify-between gap-3">
              <h3 class="text-xl font-bold text-gray-900">${lote.numero_lote || `Lote ${lote.id}`}</h3>
              <span class="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">${estado}</span>
            </div>
            <p class="text-sm text-gray-600 leading-relaxed">${lote.descripcion || "Lote urbanizado con acceso a servicios públicos y excelente ubicación."}</p>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                <p class="text-gray-500">Área</p>
                <p class="font-semibold text-gray-900">${lote.area_m2 || 0} m²</p>
              </div>
              <div class="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                <p class="text-gray-500">Precio</p>
                <p class="font-semibold text-gray-900">${formatCOP(lote.precio)}</p>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  container.innerHTML = html;
}

async function cargarLotesDisponibles() {
  const container = document.getElementById("lotes-disponibles-grid");
  if (!container) return;

  try {
    container.innerHTML =
      '<div class="col-span-full text-center py-12"><p class="text-gray-500">Cargando lotes disponibles...</p></div>';

    const response = await api.getLotes();
    const lotes = Array.isArray(response) ? response : response?.lotes || [];
    const disponibles = lotes.filter((lote) =>
      String(lote.estado || "")
        .toLowerCase()
        .includes("dispon"),
    );
    renderLotesDisponibles(disponibles);
  } catch (err) {
    console.error("Error al cargar lotes disponibles:", err);
    container.innerHTML =
      '<p class="col-span-full text-center text-red-500">No fue posible cargar los lotes disponibles en este momento.</p>';
  }
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Aplicación inmobiliaria iniciada");
  initNavbar();
  initHeroGallery();
  initImageFallbacks();
  initDetailsModal();
  cargarLotesDisponibles();
});
