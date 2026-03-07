const API_BASE = "http://localhost:3000/api/auth";
const params = new URLSearchParams(window.location.search);
const token = params.get("token");
const msg = document.getElementById("message");

console.log(
  "[RESET-PASSWORD] Token from URL:",
  token ? "✓ Present" : "✗ Missing",
);

if (!token) {
  msg.style.color = "var(--error, #c0392b)";
  msg.textContent = "Enlace inválido o expirado.";
}

document.getElementById("reset-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!token) return;

  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirm-password").value;

  if (password !== confirm) {
    msg.style.color = "var(--error, #c0392b)";
    msg.textContent = "Las contraseñas no coinciden.";
    return;
  }

  if (password.length < 6) {
    msg.style.color = "var(--error, #c0392b)";
    msg.textContent = "La contraseña debe tener al menos 6 caracteres.";
    return;
  }

  msg.style.color = "var(--muted, #7a8a80)";
  msg.textContent = "Actualizando contraseña...";

  console.log("[RESET-PASSWORD] Request:", {
    url: `${API_BASE}/reset-password`,
    payload: { token: token.substring(0, 20) + "...", newPassword: "******" },
  });

  try {
    const res = await fetch(`${API_BASE}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: password }),
    });

    let result = {};
    const text = await res.text();
    if (text) result = JSON.parse(text);

    console.log("[RESET-PASSWORD] Response:", {
      status: res.status,
      body: result,
    });

    if (!res.ok)
      throw new Error(result.message || "Error al cambiar contraseña");

    msg.style.color = "var(--success, #27ae60)";
    msg.textContent =
      result.message || "Contraseña actualizada. Redirigiendo...";

    // Limpiar formulario
    e.target.reset();

    setTimeout(() => (window.location.href = "login.html"), 2000);
  } catch (err) {
    console.error("[RESET-PASSWORD] Error:", err);
    msg.style.color = "var(--error, #c0392b)";
    msg.textContent =
      err.name === "TypeError"
        ? "No se pudo conectar al servidor."
        : err.message;
  }
});
