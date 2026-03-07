const API_BASE = "http://localhost:3000/api/auth";

document.getElementById("forgot-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const correo = formData.get("correo").trim();
  const msg = document.getElementById("message");

  msg.style.color = "var(--muted, #7a8a80)";
  msg.textContent = "Enviando correo...";

  console.log("[FORGOT-PASSWORD] Request:", {
    url: `${API_BASE}/recover-password`,
    payload: { correo },
  });

  try {
    const res = await fetch(`${API_BASE}/recover-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo }),
    });

    let result = {};
    const text = await res.text();
    if (text) result = JSON.parse(text);

    console.log("[FORGOT-PASSWORD] Response:", {
      status: res.status,
      body: result,
    });

    if (!res.ok) throw new Error(result.message || "Error al enviar");

    msg.style.color = "var(--success, #27ae60)";
    msg.textContent = result.message || "Enlace enviado. Revise su correo.";

    // Limpiar formulario
    e.target.reset();
  } catch (err) {
    console.error("[FORGOT-PASSWORD] Error:", err);
    msg.style.color = "var(--error, #c0392b)";
    msg.textContent =
      err.name === "TypeError"
        ? "No se pudo conectar al servidor."
        : err.message;
  }
});
