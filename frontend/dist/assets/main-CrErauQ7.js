import"./modulepreload-polyfill-B5Qt9EMX.js";import{a as u}from"./api-DRR1AW4h.js";function f(){const t=document.getElementById("menuToggle"),e=document.getElementById("mobileMenu");t.addEventListener("click",()=>{e.classList.toggle("hidden")}),e.querySelectorAll("a, button").forEach(n=>{n.addEventListener("click",()=>{e.classList.add("hidden")})})}function y(){const t=document.getElementById("heroMainImage"),e=document.querySelectorAll("[data-hero-image]");!t||e.length===0||e.forEach(o=>{o.addEventListener("click",()=>{const n=o.getAttribute("data-hero-image");n&&(t.src=n,e.forEach(a=>a.classList.remove("is-active")),o.classList.add("is-active"))})})}function b(){const t="data:image/svg+xml;utf8,"+encodeURIComponent(`
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
    `);document.querySelectorAll("img").forEach(e=>{e.loading="lazy",e.referrerPolicy="no-referrer",e.addEventListener("error",()=>{e.dataset.fallbackApplied!=="true"&&(e.dataset.fallbackApplied="true",e.src=t,e.classList.add("object-cover"))})})}function x(){const t=document.getElementById("details-modal"),e=document.getElementById("modal-close-btn"),o=document.getElementById("modal-primary-action"),n=document.getElementById("modal-title"),a=document.getElementById("modal-subtitle"),i=document.getElementById("modal-price"),d=document.getElementById("modal-description"),c=document.getElementById("modal-features"),m=document.querySelectorAll(".details-trigger");if(!t||!e||!o||!n||!a||!i||!d||!c||m.length===0)return;const r=()=>{t.classList.add("hidden"),document.body.classList.remove("modal-open")},p=s=>{n.textContent=s.dataset.title||"Detalle",a.textContent=s.dataset.subtitle||"Información",i.textContent=s.dataset.price||"",d.textContent=s.dataset.description||"Información adicional disponible.";const g=(s.dataset.features||"").split("|").map(l=>l.trim()).filter(Boolean);c.innerHTML=g.map(l=>`
          <li class="flex items-start gap-2">
            <span class="mt-1 w-2 h-2 rounded-full bg-amber-600"></span>
            <span>${l}</span>
          </li>
        `).join(""),t.classList.remove("hidden"),document.body.classList.add("modal-open")};m.forEach(s=>{s.addEventListener("click",()=>p(s))}),e.addEventListener("click",r),o.addEventListener("click",r),t.addEventListener("click",s=>{s.target.dataset.modalClose==="true"&&r()}),document.addEventListener("keydown",s=>{s.key==="Escape"&&!t.classList.contains("hidden")&&r()})}function v(t){const e=Number(t)||0;return new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(e)}function h(t=[]){const e=document.getElementById("lotes-disponibles-grid");if(!e)return;if(!t.length){e.innerHTML='<p class="col-span-full text-center text-gray-500">No hay lotes disponibles por ahora.</p>';return}const o=t.slice(0,6).map(n=>{const a=n.image_url||"https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80",i=(n.estado||"disponible").toString();return`
        <article class="landing-card bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200 hover:shadow-2xl transition-all">
          <img src="${a}" alt="${n.numero_lote||"Lote"}" class="w-full h-52 object-cover">
          <div class="p-6 space-y-3">
            <div class="flex items-center justify-between gap-3">
              <h3 class="text-xl font-bold text-gray-900">${n.numero_lote||`Lote ${n.id}`}</h3>
              <span class="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">${i}</span>
            </div>
            <p class="text-sm text-gray-600 leading-relaxed">${n.descripcion||"Lote urbanizado con acceso a servicios públicos y excelente ubicación."}</p>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                <p class="text-gray-500">Área</p>
                <p class="font-semibold text-gray-900">${n.area_m2||0} m²</p>
              </div>
              <div class="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                <p class="text-gray-500">Precio</p>
                <p class="font-semibold text-gray-900">${v(n.precio)}</p>
              </div>
            </div>
          </div>
        </article>
      `}).join("");e.innerHTML=o}async function L(){const t=document.getElementById("lotes-disponibles-grid");if(t)try{t.innerHTML='<div class="col-span-full text-center py-12"><p class="text-gray-500">Cargando lotes disponibles...</p></div>';const e=await u.getLotes(),n=(Array.isArray(e)?e:e?.lotes||[]).filter(a=>String(a.estado||"").toLowerCase().includes("dispon"));h(n)}catch(e){console.error("Error al cargar lotes disponibles:",e),t.innerHTML='<p class="col-span-full text-center text-red-500">No fue posible cargar los lotes disponibles en este momento.</p>'}}document.addEventListener("DOMContentLoaded",()=>{console.log("🚀 Aplicación inmobiliaria iniciada"),f(),y(),b(),x(),L()});
