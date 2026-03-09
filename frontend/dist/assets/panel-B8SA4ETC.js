import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css              */import{l as L,a as f,r as H}from"./api-_vZ4SOJS.js";let w=[],C=null;function p(t){return Number(t||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}function A(t){return t?new Date(t).toLocaleDateString("es-CO"):"—"}function $(t,e){const r=document.getElementById(t);r&&(r.textContent=e)}function h(t="Cargando..."){let e=document.getElementById("loader-overlay");e||(e=document.createElement("div"),e.id="loader-overlay",e.className="loader-overlay",e.innerHTML=`
      <div style="text-align: center;">
        <div class="spinner"></div>
        <p style="color: white; margin-top: 16px; font-size: 14px; font-weight: 500;">${t}</p>
      </div>
    `,document.body.appendChild(e)),e.style.display="flex"}function m(){const t=document.getElementById("loader-overlay");t&&(t.style.display="none")}function g(t,e="success"){const r=document.getElementById("alerts-container")||j(),o=document.createElement("div");o.className=`alert alert-${e}`,o.innerHTML=`
    <span>${t}</span>
    <span class="alert-close" onclick="this.parentElement.remove()">✕</span>
  `,r.appendChild(o),setTimeout(()=>o.remove(),5e3)}function j(){const t=document.createElement("div");return t.id="alerts-container",t.style.cssText="position: fixed; top: 80px; right: 20px; z-index: 9998; width: 90%; max-width: 400px;",document.body.appendChild(t),t}function z(t){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)}function x(t,e){const r=document.getElementById(e);r&&(r.querySelectorAll(".error-message").forEach(o=>o.remove()),r.querySelectorAll(".form-error").forEach(o=>o.classList.remove("form-error")),Object.entries(t).forEach(([o,n])=>{const l=r.querySelector(`[name="${o}"]`);if(l){l.classList.add("form-error");const c=document.createElement("span");c.className="error-message",c.textContent=n,l.parentElement.appendChild(c)}}))}function b(t){const e=document.getElementById(t);e&&(e.querySelectorAll(".error-message").forEach(r=>r.remove()),e.querySelectorAll(".form-error").forEach(r=>r.classList.remove("form-error")))}function M(t){const e=String(t||"").toLowerCase();return e==="disponible"||e==="pagado"||e==="resuelta"?"verde":e==="reservado"||e==="pendiente"||e==="en_proceso"?"amarillo":e==="vendido"||e==="rechazada"?"rojo":"azul"}function T(t){return t?String(t).replaceAll("_"," ").replace(/^./,e=>e.toUpperCase()):"—"}async function I(){try{h("Cargando estadísticas...");const e=(await f.getDashboard())?.resumen||{};$("stat-compras",String(e.total_compras||0)),$("stat-total-invertido",p(e.total_invertido)),$("stat-total-pagado",p(e.total_pagado)),$("stat-total-pendiente",p(e.total_pendiente)),m()}catch{m(),g("Error al cargar estadísticas","error")}}function B(){document.querySelectorAll(".reserve-btn").forEach(t=>{t.addEventListener("click",async()=>{const e=Number(t.dataset.loteId);if(!e)return;const r=E.find(o=>o.id===e);if(!r){alert("Error: Lote no encontrado");return}R(r)})})}function O(t,e,r){if(r===1)return t;const o=e,n=r,l=t*(o*Math.pow(1+o,n))/(Math.pow(1+o,n)-1);return Math.round(l)}async function D(t){const e=document.getElementById("planos-gallery");if(e){e.innerHTML="<p style='grid-column: 1 / -1; color: #777; font-size: 13px;'>Cargando planos...</p>",C=null;try{const o=(await f.getPlanosLote(t))?.planos||[];if(o.length===0){e.innerHTML="<p style='grid-column: 1 / -1; color: #777; font-size: 13px;'>No hay planos disponibles para este lote.</p>";return}e.innerHTML="",o.forEach((n,l)=>{const c=document.createElement("button");c.type="button",c.className="plano-card",c.innerHTML=`
        <img class="plano-image" src="${n.image_url}" alt="${n.nombre}" />
        <div class="plano-info">
          <p class="plano-name">${n.nombre}</p>
          <p class="plano-desc">${n.descripcion||""}</p>
        </div>
      `,c.addEventListener("click",()=>{document.querySelectorAll("#planos-gallery .plano-card").forEach(a=>a.classList.remove("selected")),c.classList.add("selected"),C=n.id}),e.appendChild(c),l===0&&(c.classList.add("selected"),C=n.id)})}catch(r){console.error("Error al cargar planos:",r),e.innerHTML="<p style='grid-column: 1 / -1; color: #b30000; font-size: 13px;'>No fue posible cargar los planos.</p>"}}}function R(t){const e=document.getElementById("modal-compra-cuotas"),r=Number(t.precio);D(t.id),document.getElementById("modal-lote-nombre").textContent=`Lote ${t.numero_lote}`,document.getElementById("modal-lote-precio").textContent=`$${r.toLocaleString("es-CO")}`;const o=()=>{const c=Number(document.getElementById("porcentaje-enganche").value),a=Number(document.getElementById("numero-cuotas").value),i=.01,s=Math.round(r*(c/100)),d=r-s,u=a>1?O(d,i,a):0;document.getElementById("preview-valor-lote").textContent=`$${r.toLocaleString("es-CO")}`,document.getElementById("preview-enganche").textContent=`$${s.toLocaleString("es-CO")} (${c}%)`,document.getElementById("preview-saldo-financiar").textContent=`$${d.toLocaleString("es-CO")}`,a===1?(document.getElementById("preview-cuota-mensual").textContent="Pago único",document.getElementById("preview-tasa").textContent="Sin interés"):(document.getElementById("preview-cuota-mensual").textContent=`$${u.toLocaleString("es-CO")}`,document.getElementById("preview-tasa").textContent=`1% mensual (${a} cuotas)`)};document.getElementById("porcentaje-enganche").onchange=o,document.getElementById("numero-cuotas").onchange=o,o();const n=document.getElementById("btn-confirmar-compra"),l=n.cloneNode(!0);n.parentNode.replaceChild(l,n),l.addEventListener("click",async()=>{const c=Number(document.getElementById("porcentaje-enganche").value),a=Number(document.getElementById("numero-cuotas").value),i=Math.round(r*(c/100));if(!C){alert("Debes seleccionar un plano antes de confirmar la compra.");return}l.disabled=!0,l.textContent="Procesando...";try{await f.createCompra(t.id,i,c,a,C),e.style.display="none",alert("¡Compra creada exitosamente! Revisa la sección 'Mis Compras' para ver tu plan de cuotas."),await Promise.all([I(),k(),_(),N()])}catch(s){alert(s.message||"No fue posible completar la compra.")}finally{l.disabled=!1,l.textContent="Confirmar Compra"}}),e.style.display="flex"}let E=[];async function k(){const t=document.getElementById("lotes-grid");if(t)try{if(h("Cargando lotes..."),E=(await f.getLotes())?.lotes||[],m(),E.length===0){t.innerHTML='<div class="table-card"><p>No hay lotes disponibles por ahora.</p></div>';return}S(E),B()}catch{m(),t.innerHTML='<div class="table-card"><p>Error cargando lotes.</p></div>',g("Error al cargar los lotes","error")}}function S(t){const e=document.getElementById("lotes-grid");if(e){if(t.length===0){e.innerHTML='<div class="table-card"><p>No hay lotes que coincidan con los filtros.</p></div>';return}e.innerHTML=t.map(r=>{const o=String(r.estado||"").toLowerCase(),n=o==="disponible",l=M(o),c=T(o),a=r.image_url||"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3C/svg%3E";return`
        <div class="lote-card" data-estado="${c}" data-precio="${r.precio}" data-area="${r.area_m2}" data-hab="${r.habitaciones||0}">
          <img src="${a}" alt="${r.numero_lote}" style="width:100%;height:180px;object-fit:cover;border-radius:6px;margin-bottom:12px;">
          <div class="lote-id">Lote · ${r.numero_lote||"N/A"}</div>
          <h4>${r.descripcion||"Lote disponible"}</h4>
          <div class="lote-info">
            <span>📐 Área: <strong>${Number(r.area_m2||0)} m²</strong></span>
            <span>📍 Etapa: <strong>${r.etapa_id?`Etapa ${r.etapa_id}`:"General"}</strong></span>
          </div>
          <div class="lote-precio">${p(r.precio)}</div>
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="badge ${l}">${c}</span>
            ${n?`<button class="btn-sm reserve-btn" data-lote-id="${r.id}">Reservar</button>`:'<button class="btn-sm outline" disabled style="opacity:0.5;cursor:not-allowed;">No disponible</button>'}
          </div>
        </div>
      `}).join("")}}function P(){const t=document.getElementById("lote-search")?.value||"",e=Number(document.getElementById("lote-filter-precio-min")?.value||0),r=Number(document.getElementById("lote-filter-precio-max")?.value||1/0),o=Number(document.getElementById("lote-filter-area")?.value||0),n=Number(document.getElementById("lote-filter-habitaciones")?.value||0);let l=E.filter(c=>{const a=t===""||c.numero_lote.toLowerCase().includes(t.toLowerCase())||c.descripcion.toLowerCase().includes(t.toLowerCase()),i=Number(c.precio)>=e&&Number(c.precio)<=r,s=o===0||Number(c.area_m2)>=o,d=n===0||Number(c.habitaciones)===n;return a&&i&&s&&d});S(l),B()}function F(t){const e=document.getElementById("payment-compra-id");if(!e)return;const r=['<option value="">Seleccione una compra</option>'];t.forEach(o=>{r.push(`<option value="${o.id}">Lote ${o.numero_lote} · Saldo: ${p(o.saldo_pendiente)}</option>`)}),e.innerHTML=r.join("")}async function _(){const t=document.getElementById("compras-tbody");if(t)try{h("Cargando compras...");const r=(await f.getMisCompras())?.compras||[];if(w=r,F(r),m(),r.length===0){t.innerHTML='<tr><td colspan="11">Aún no tienes compras registradas.</td></tr>';return}t.innerHTML=r.map(o=>{const n=Number(o.valor_total||0)-Number(o.saldo_pendiente||0),l=Number(o.saldo_pendiente||0)===0?"pagado":"pendiente",c=o.image_url||"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3C/svg%3E",i=Number(o.numero_cuotas||1)>1?`<button class="btn-sm" onclick="window.verCuotasCompra(${o.id})" style="background: var(--forest); color: white;">📅 Ver Cuotas (${o.cuotas_pagadas||0}/${o.numero_cuotas})</button>`:"",s=o.plano_nombre?`<div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
               <img
                 src="${o.plano_image_url||c}"
                 alt="${o.plano_nombre}"
                 style="width:32px;height:32px;object-fit:cover;border-radius:6px;border:1px solid #e5e5e5;"
               />
               <div style="font-size:12px;color:var(--muted);line-height:1.2;">
                 Plano elegido:<br><strong style="color:var(--forest);">${o.plano_nombre}</strong>
               </div>
             </div>`:"";return`
          <tr>
            <td width="80"><img src="${c}" alt="Lote" style="width:100%;height:60px;object-fit:cover;border-radius:4px;"></td>
            <td><strong>${o.numero_lote||"—"}</strong></td>
            <td>${o.descripcion||"—"}${s}</td>
            <td>${Number(o.area_m2||0)} m²</td>
            <td>${o.habitaciones||"—"}</td>
            <td>${o.etapa_id?`Etapa ${o.etapa_id}`:"—"}</td>
            <td>${p(o.valor_total)}</td>
            <td>${p(n)}</td>
            <td>${p(o.saldo_pendiente)}</td>
            <td><span class="badge ${M(l)}">${T(l)}</span></td>
            <td>
              <div style="display: flex; gap: 5px; flex-direction: column;">
                <button class="btn-sm" onclick="window.descargarFactura(${o.id})">📄 Factura</button>
                ${i}
              </div>
            </td>
          </tr>
        `}).join("")}catch{m(),t.innerHTML='<tr><td colspan="11">Error cargando compras.</td></tr>',g("Error al cargar tus compras","error")}}async function U(t){try{h("Cargando calendario de cuotas...");const r=(await f.getCuotasCompra(t))?.cuotas||[];if(m(),r.length===0){alert("Esta compra no tiene cuotas registradas.");return}const o=document.createElement("div");o.className="modal",o.style.display="flex",o.innerHTML=`
      <div class="modal-content" style="max-width: 900px;">
        <span class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</span>
        <h2 style="color: var(--forest); margin-bottom: 20px;">Calendario de Cuotas - Compra #${t}</h2>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div>
              <span style="font-size: 12px; color: #666;">Total cuotas</span>
              <p style="margin: 5px 0; font-size: 20px; font-weight: bold; color: var(--forest);">${r.length}</p>
            </div>
            <div>
              <span style="font-size: 12px; color: #666;">Cuotas pagadas</span>
              <p style="margin: 5px 0; font-size: 20px; font-weight: bold; color: #28a745;">${r.filter(n=>n.estado==="pagado").length}</p>
            </div>
            <div>
              <span style="font-size: 12px; color: #666;">Cuotas pendientes</span>
              <p style="margin: 5px 0; font-size: 20px; font-weight: bold; color: #ffc107;">${r.filter(n=>n.estado==="pendiente").length}</p>
            </div>
            <div>
              <span style="font-size: 12px; color: #666;">Cuotas vencidas</span>
              <p style="margin: 5px 0; font-size: 20px; font-weight: bold; color: #dc3545;">${r.filter(n=>n.estado==="vencido").length}</p>
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
              ${r.map(n=>`
                <tr>
                  <td>${n.numero_cuota}</td>
                  <td><strong>${p(n.valor_cuota)}</strong></td>
                  <td>${p(n.monto_capital)}</td>
                  <td>${p(n.monto_interes)}</td>
                  <td>${p(n.saldo_restante)}</td>
                  <td>${new Date(n.fecha_vencimiento).toLocaleDateString("es-CO")}</td>
                  <td>${n.monto_pagado>0?p(n.monto_pagado):"—"}</td>
                  <td>
                    <span class="estado-cuota ${n.estado}">
                      ${n.estado}
                    </span>
                  </td>
                </tr>
              `).join("")}
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
    `,document.body.appendChild(o)}catch(e){m(),alert("Error al cargar las cuotas: "+e.message)}}window.verCuotasCompra=U;async function Q(t){try{const e=await fetch(`http://localhost:3000/api/pagos/${t}/comprobante`,{headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}});if(!e.ok)throw new Error("Error al descargar comprobante");const r=await e.blob(),o=window.URL.createObjectURL(r),n=document.createElement("a");n.href=o,n.download=`Comprobante-${t}.pdf`,n.click(),window.URL.revokeObjectURL(o)}catch(e){alert("No fue posible descargar el comprobante: "+e.message)}}window.downloadComprobantePDF=Q;async function J(t){try{const e=await fetch(`http://localhost:3000/api/compra/${t}/factura`,{headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}});if(!e.ok){const l=await e.text();throw new Error(`HTTP ${e.status}: ${l}`)}const r=await e.blob(),o=window.URL.createObjectURL(r),n=document.createElement("a");n.href=o,n.download=`Factura-${String(t).padStart(5,"0")}.pdf`,n.click(),window.URL.revokeObjectURL(o)}catch(e){alert("No fue posible descargar la factura: "+e.message)}}window.descargarFactura=J;async function N(){const t=document.getElementById("pagos-tbody");if(t)try{if(h("Cargando pagos..."),!w.length){t.innerHTML='<tr><td colspan="7">No hay compras para mostrar pagos.</td></tr>',m();return}const r=(await Promise.all(w.map(async o=>((await f.getPagosHistorial(o.id))?.pagos||[]).map(l=>({...l,numero_lote:o.numero_lote}))))).flat();if(!r.length){t.innerHTML='<tr><td colspan="7">Aún no tienes pagos registrados.</td></tr>',m();return}t.innerHTML=r.map((o,n)=>{const l=String(o.id||n).padStart(5,"0");return`
        <tr>
          <td>${String(n+1).padStart(3,"0")}</td>
          <td>${A(o.fecha_pago)}</td>
          <td>${o.numero_lote||"—"}</td>
          <td>${p(o.monto)}</td>
          <td>${o.metodo||"Transferencia"}</td>
          <td><code style="background:#f0f0f0;padding:4px 8px;border-radius:3px;font-size:12px;">CP-${l}</code></td>
          <td><button class="btn-sm outline" onclick="downloadComprobantePDF(${o.id})">📄 PDF</button></td>
        </tr>
      `}).join(""),m()}catch{m(),t.innerHTML='<tr><td colspan="7">Error cargando pagos.</td></tr>',g("Error al cargar los pagos","error")}}async function q(){const t=document.getElementById("pqrs-tbody");if(t)try{h("Cargando solicitudes...");const e=await f.getMisPQRS();if(m(),!Array.isArray(e)||e.length===0){t.innerHTML='<tr><td colspan="5">Aún no tienes solicitudes PQRS.</td></tr>';return}t.innerHTML=e.map(r=>`
          <tr>
            <td><strong>#${r.id}</strong></td>
            <td>${r.tipo||"—"}</td>
            <td>${r.asunto||"—"}</td>
            <td>
              <div class="pqrs-status-row">
                <div class="dot ${r.respuesta?"verde":"amarillo"}"></div>
                ${r.respuesta?"Resuelta":"En revisión"}
              </div>
            </td>
            <td>${r.respuesta||"—"}</td>
          </tr>
        `).join("")}catch{m(),t.innerHTML='<tr><td colspan="5">Error cargando PQRS.</td></tr>',g("Error al cargar las solicitudes","error")}}async function G(){if(H())try{const t=localStorage.getItem("user"),e=t?JSON.parse(t):null;if(e){const r=e.nombre_usuario||"Cliente",o=r.split(" ").map(s=>s[0]).join("").toUpperCase(),n=document.getElementById("user-name"),l=document.getElementById("user-avatar"),c=document.getElementById("perfil-avatar"),a=document.getElementById("perfil-name"),i=document.getElementById("perfil-email");n&&(n.textContent=r),l&&(l.textContent=o),c&&(c.textContent=o),a&&(a.textContent=r),i&&(i.textContent=e.correo||""),await Promise.all([I(),k(),_()]),await Promise.all([N(),q()])}else L()}catch{L()}finally{m()}}document.addEventListener("DOMContentLoaded",()=>{m(),G();const t=document.getElementById("logout-btn");t&&t.addEventListener("click",()=>{L()});const e=document.querySelectorAll(".nav-link"),r=document.querySelectorAll(".section");function o(a){r.forEach(s=>s.classList.remove("active")),e.forEach(s=>s.classList.remove("active"));const i=document.getElementById(a);i&&i.classList.add("active"),document.querySelectorAll(`[data-section="${a}"]`).forEach(s=>s.classList.add("active"))}e.forEach(a=>{a.addEventListener("click",i=>{i.preventDefault();const s=a.dataset.section;s&&o(s)})});const n=r[0];if(n){n.classList.add("active");const a=document.querySelector('[data-section="'+n.id+'"]');a&&a.classList.add("active")}(()=>{const a=["lote-search","lote-filter-precio-min","lote-filter-precio-max","lote-filter-area","lote-filter-habitaciones"];a.forEach(s=>{const d=document.getElementById(s);d&&(d.addEventListener("input",P),d.addEventListener("change",P))});const i=document.getElementById("filter-limpiar");i&&i.addEventListener("click",()=>{a.forEach(s=>{const d=document.getElementById(s);d&&(d.value="")}),S(E),B()})})(),document.getElementById("pqrs-form")?.addEventListener("submit",a=>{a.preventDefault(),b("pqrs-form");const i=document.getElementById("pqrs-tipo")?.value,s=document.getElementById("pqrs-asunto")?.value?.trim(),d=document.getElementById("pqrs-descripcion")?.value?.trim(),u={};if(i||(u["pqrs-tipo"]="Selecciona un tipo de solicitud"),s?s.length<5&&(u["pqrs-asunto"]="El asunto debe tener mínimo 5 caracteres"):u["pqrs-asunto"]="El asunto es obligatorio (mínimo 5 caracteres)",d?d.length<20&&(u["pqrs-descripcion"]="La descripción debe tener mínimo 20 caracteres"):u["pqrs-descripcion"]="La descripción es obligatoria (mínimo 20 caracteres)",Object.keys(u).length>0){x(u,"pqrs-form"),g("Por favor completa todos los campos correctamente","error");return}h("Enviando solicitud..."),f.createPQRS(i,s,d).then(async()=>{m(),g("✓ Solicitud enviada correctamente","success"),a.target.reset(),b("pqrs-form"),await q()}).catch(y=>{m(),g(y.message||"Error al enviar la solicitud","error")})}),document.getElementById("payment-form")?.addEventListener("submit",a=>{a.preventDefault(),b("payment-form");const i=Number(document.getElementById("payment-compra-id")?.value),s=Number(document.getElementById("payment-monto")?.value||0),d=w.find(v=>v.id===i),u=d?Number(d.saldo_pendiente):0,y={};if(i||(y["payment-compra-id"]="Selecciona una compra"),(!s||s<=0)&&(y["payment-monto"]="Ingresa un monto válido"),s>u&&(y["payment-monto"]=`No puedes pagar más de $${p(u)}`),Object.keys(y).length>0){x(y,"payment-form"),g("Por favor corrige los errores en el formulario","error");return}h("Registrando pago..."),f.registrarPago(i,s).then(async()=>{m(),g("✓ Pago registrado exitosamente","success"),a.target.reset(),b("payment-form"),await Promise.all([I(),_()]),await N()}).catch(v=>{m(),g(v.message||"Error al registrar el pago","error")})}),document.getElementById("profile-form")?.addEventListener("submit",a=>{a.preventDefault(),b("profile-form");const i=document.getElementById("profile-nombre")?.value?.trim(),s=document.getElementById("profile-email")?.value?.trim(),d={};if(i?i.length<3&&(d["profile-nombre"]="El nombre debe tener mínimo 3 caracteres"):d["profile-nombre"]="El nombre es obligatorio",s?z(s)||(d["profile-email"]="Por favor ingresa un correo válido"):d["profile-email"]="El correo es obligatorio",Object.keys(d).length>0){x(d,"profile-form"),g("Por favor corrige los errores en el formulario","error");return}h("Actualizando perfil..."),f.updateProfile(i,s).then(()=>{m(),g("✓ Información actualizada correctamente","success"),b("profile-form");const u=JSON.parse(localStorage.getItem("user")||"{}");u.nombre_usuario=i,u.correo=s,localStorage.setItem("user",JSON.stringify(u));const y=document.getElementById("user-name");y&&(y.textContent=i);const v=document.getElementById("perfil-email");v&&(v.textContent=s)}).catch(u=>{m(),g(u.message||"Error al actualizar la información","error")})});function c(){const a=JSON.parse(localStorage.getItem("user")||"{}");if(a.nombre_usuario){const i=document.getElementById("profile-nombre");i&&(i.value=a.nombre_usuario)}if(a.correo){const i=document.getElementById("profile-email");i&&(i.value=a.correo)}}c()});
