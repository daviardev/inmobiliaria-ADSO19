import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css              */import{r as b,l as y,a as i}from"./api-_vZ4SOJS.js";function m(t){return Number(t||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}function v(t){return t?new Date(t).toLocaleDateString("es-CO"):"—"}function l(t,r){const e=document.getElementById(t);e&&(e.textContent=r)}function u(t="Cargando..."){let r=document.getElementById("loader-overlay");r||(r=document.createElement("div"),r.id="loader-overlay",r.className="loader-overlay",r.innerHTML=`
      <div style="text-align: center;">
        <div class="spinner"></div>
        <p style="color: white; margin-top: 16px; font-size: 14px; font-weight: 500;">${t}</p>
      </div>
    `,document.body.appendChild(r)),r.style.display="flex"}function p(){const t=document.getElementById("loader-overlay");t&&(t.style.display="none")}function s(t,r="success"){const e=document.getElementById("alerts-container")||h(),n=document.createElement("div");n.className=`alert alert-${r}`,n.innerHTML=`
    <span>${t}</span>
    <span class="alert-close" onclick="this.parentElement.remove()">✕</span>
  `,e.appendChild(n),setTimeout(()=>n.remove(),5e3)}function h(){const t=document.createElement("div");return t.id="alerts-container",t.style.cssText="position: fixed; top: 80px; right: 20px; z-index: 9998; width: 90%; max-width: 400px;",document.body.appendChild(t),t}function f(t){const r=document.getElementById(t);r&&(r.querySelectorAll(".error-message").forEach(e=>e.remove()),r.querySelectorAll(".form-error").forEach(e=>e.classList.remove("form-error")))}function g(t,r){const e=document.getElementById(r);e&&(f(r),Object.entries(t).forEach(([n,a])=>{const o=e.querySelector(`[name="${n}"]`);if(!o)return;o.classList.add("form-error");const d=document.createElement("span");d.className="error-message",d.textContent=a,o.parentElement.appendChild(d)}))}function E(t){const r=String(t||"").toLowerCase();return["disponible","pagado","resuelta"].includes(r)?"verde":["reservado","pendiente","en_proceso"].includes(r)?"amarillo":["vendido","rechazada"].includes(r)?"rojo":"azul"}function L(t){return t?String(t).replaceAll("_"," ").replace(/^./,r=>r.toUpperCase()):"—"}function $(){const t=document.querySelectorAll(".nav-link"),r=document.querySelectorAll(".section");function e(n){r.forEach(o=>o.classList.remove("active")),t.forEach(o=>o.classList.remove("active"));const a=document.getElementById(n);a&&a.classList.add("active"),document.querySelectorAll(`[data-section="${n}"]`).forEach(o=>o.classList.add("active"))}t.forEach(n=>{n.addEventListener("click",a=>{a.preventDefault();const o=n.dataset.section;o&&e(o)})})}async function w(){const t=document.getElementById("admin-lotes-tbody");if(!t)return[];const e=(await i.getLotes())?.lotes||[];return e.length?(t.innerHTML=e.slice(0,12).map(n=>`
      <tr>
        <td>${n.id}</td>
        <td><strong>${n.numero_lote||"—"}</strong></td>
        <td>${Number(n.area_m2||0)} m²</td>
        <td>${m(n.precio)}</td>
        <td><span class="badge ${E(n.estado)}">${L(n.estado)}</span></td>
      </tr>
    `).join(""),e):(t.innerHTML='<tr><td colspan="5">No hay lotes registrados.</td></tr>',e)}async function _(){const t=document.getElementById("admin-compras-tbody");if(!t)return[];const e=(await i.getTodasCompras())?.compras||[];return e.length?(t.innerHTML=e.map(n=>`
      <tr>
        <td>${n.id}</td>
        <td>${v(n.fecha_compra)}</td>
        <td>${n.nombre_usuario||"—"}</td>
        <td>${n.correo||"—"}</td>
        <td>${n.numero_lote||"—"}</td>
        <td>${Number(n.area_m2||0)} m²</td>
        <td>${m(n.valor_total)}</td>
        <td>${m(n.saldo_pendiente)}</td>
      </tr>
    `).join(""),e):(t.innerHTML='<tr><td colspan="8">No hay compras registradas.</td></tr>',e)}function x(t){const r=document.getElementById("admin-pqrs-tbody");if(r){if(!t.length){r.innerHTML='<tr><td colspan="7">No hay PQRS registradas.</td></tr>';return}r.innerHTML=t.map(e=>{const n=!!e.respuesta;return`
        <tr>
          <td><strong>#${e.id}</strong></td>
          <td>
            <div>${e.nombre_usuario||"—"}</div>
            <small style="color:#666;">${e.correo||""}</small>
          </td>
          <td>${e.tipo||"—"}</td>
          <td>${e.asunto||"—"}</td>
          <td style="max-width: 240px; white-space: normal;">${e.descripcion||"—"}</td>
          <td><span class="badge ${n?"verde":"amarillo"}">${n?"Resuelta":"Pendiente"}</span></td>
          <td style="min-width:260px;">
            ${n?`<div style="white-space: normal;">${e.respuesta}</div>`:`
                <textarea id="pqrs-reply-${e.id}" rows="2" placeholder="Escribe una respuesta" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;margin-bottom:8px;"></textarea>
                <button class="btn-sm pqrs-reply-btn" data-id="${e.id}">Responder</button>
              `}
          </td>
        </tr>
      `}).join("")}}async function C(){const t=await i.getPQRSAdmin(),r=Array.isArray(t)?t:[];return x(r),r}function S(t,r,e){const n=t.filter(o=>String(o.estado||"").toLowerCase()==="disponible").length,a=e.filter(o=>!o.respuesta).length;l("admin-stat-lotes",String(t.length)),l("admin-stat-lotes-disponibles",String(n)),l("admin-stat-compras",String(r.length)),l("admin-stat-pqrs-pendientes",String(a))}async function c(){u("Cargando panel administrativo...");try{const[t,r,e,n]=await Promise.all([w(),_(),C(),P()]);S(t,r,e)}catch(t){s(t.message||"No fue posible cargar el panel admin","error")}finally{p()}}function N(){const t=document.getElementById("admin-lote-form");t&&t.addEventListener("submit",async r=>{r.preventDefault(),f("admin-lote-form");const e=Object.fromEntries(new FormData(t).entries()),n={};if(e.numero_lote?.trim()||(n.numero_lote="El número de lote es obligatorio"),(!e.area_m2||Number(e.area_m2)<=0)&&(n.area_m2="El área debe ser mayor a 0"),(!e.precio||Number(e.precio)<=0)&&(n.precio="El precio debe ser mayor a 0"),Object.keys(n).length){g(n,"admin-lote-form"),s("Corrige los errores del formulario","error");return}u("Creando lote...");try{await i.createLote({numero_lote:e.numero_lote.trim(),area_m2:Number(e.area_m2),precio:Number(e.precio),descripcion:e.descripcion?.trim()||null,etapa_id:e.etapa_id?Number(e.etapa_id):null,habitaciones:e.habitaciones?Number(e.habitaciones):null,banos:e.banos?Number(e.banos):null,image_url:e.image_url?.trim()||null}),t.reset(),s("Lote creado exitosamente","success"),await c()}catch(a){s(a.message||"No fue posible crear el lote","error")}finally{p()}})}async function P(){const t=document.getElementById("admin-planos-tbody");if(!t)return[];const e=(await i.getTodosPlanos())?.planos||[];return e.length?(t.innerHTML=e.map(n=>`
      <tr>
        <td>${n.id}</td>
        <td><strong>${n.numero_lote||"—"}</strong></td>
        <td>${n.nombre||"—"}</td>
        <td><span class="badge ${n.activo?"verde":"rojo"}">${n.activo?"Activo":"Inactivo"}</span></td>
        <td style="white-space: nowrap;">
          ${n.activo?`<button class="btn-sm btn-danger plano-toggle-btn" data-id="${n.id}" data-action="desactivar">Desactivar</button>`:`<button class="btn-sm btn-success plano-toggle-btn" data-id="${n.id}" data-action="activar">Activar</button>`}
        </td>
      </tr>
    `).join(""),e):(t.innerHTML='<tr><td colspan="5">No hay planos registrados.</td></tr>',e)}function A(){const t=document.getElementById("admin-plano-form");t&&t.addEventListener("submit",async r=>{r.preventDefault(),f("admin-plano-form");const e=Object.fromEntries(new FormData(t).entries()),n={};if((!e.lote_id||Number(e.lote_id)<=0)&&(n.lote_id="El ID del lote es obligatorio"),e.nombre?.trim()||(n.nombre="El nombre del plano es obligatorio"),e.image_url?.trim()||(n.image_url="La URL de imagen es obligatoria"),Object.keys(n).length){g(n,"admin-plano-form"),s("Corrige los errores del formulario","error");return}u("Creando plano...");try{await i.createPlano({lote_id:Number(e.lote_id),nombre:e.nombre.trim(),image_url:e.image_url.trim(),descripcion:e.descripcion?.trim()||null}),t.reset(),s("Plano creado exitosamente","success"),await c()}catch(a){s(a.message||"No fue posible crear el plano","error")}finally{p()}})}function T(){document.addEventListener("click",async t=>{const r=t.target.closest(".plano-toggle-btn");if(!r)return;const e=Number(r.dataset.id),n=r.dataset.action;if(!e||!confirm(n==="desactivar"?"¿Desactivar este plano? Los clientes no podrán seleccionarlo.":"¿Activar este plano?"))return;r.disabled=!0;const o=r.textContent;r.textContent="Procesando...";try{n==="desactivar"?(await i.deletePlano(e),s("Plano desactivado correctamente","success")):(await i.updatePlano(e,{activo:1}),s("Plano activado correctamente","success")),await c()}catch(d){s(d.message||"No se pudo cambiar el estado","error")}finally{r.disabled=!1,r.textContent=o}})}function I(){document.addEventListener("click",async t=>{const r=t.target.closest(".pqrs-reply-btn");if(!r)return;const e=Number(r.dataset.id),a=document.getElementById(`pqrs-reply-${e}`)?.value?.trim();if(!e||!a){s("La respuesta es obligatoria","error");return}r.disabled=!0;const o=r.textContent;r.textContent="Enviando...";try{await i.responderPQRS(e,a),s("PQRS respondida correctamente","success"),await c()}catch(d){s(d.message||"No se pudo responder la PQRS","error")}finally{r.disabled=!1,r.textContent=o}})}function B(){const t=localStorage.getItem("user"),e=(t?JSON.parse(t):null)?.nombre_usuario||"Administrador",n=e.split(" ").map(a=>a[0]).join("").toUpperCase().slice(0,2);l("admin-name",e),l("admin-avatar",n)}function q(){const t=localStorage.getItem("user"),r=t?JSON.parse(t):null;return!r||r.rol_id!==2?(s("Acceso permitido solo para administradores","error"),setTimeout(()=>{window.location.href="/src/pages/panel/index.html"},900),!1):!0}document.addEventListener("DOMContentLoaded",async()=>{if(!b()||!q())return;B(),$(),N(),A(),T(),I();const t=document.getElementById("logout-btn");t&&t.addEventListener("click",()=>y()),await c()});
