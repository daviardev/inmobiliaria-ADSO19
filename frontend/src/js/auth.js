document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = import.meta.env.VITE_API_BASE;
  const container = document.querySelector(".container");

  const parseResponse = async (res) => {
    const text = await res.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  };

  const getErrorMessage = (payload, fallback) => {
    return payload?.error || payload?.message || fallback;
  };

  const getRedirectByRole = (user) => {
    if (user?.rol_id === 2) return "/src/pages/admin/index.html";
    return "/src/pages/panel/index.html";
  };

  document.getElementById("btn-go-signup")?.addEventListener("click", () => {
    container.classList.add("toggle");
  });

  document.getElementById("btn-go-signin")?.addEventListener("click", () => {
    container.classList.remove("toggle");
  });

  document
    .getElementById("sign-in-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = document.getElementById("sign-in-msg");
      msg.style.color = "var(--muted)";
      msg.textContent = "Iniciando sesión...";

      const data = Object.fromEntries(new FormData(e.target).entries());

      console.log("[AUTH][LOGIN] Request:", {
        url: `${API_BASE}/auth/login`,
        payload: { correo: data.correo, password: "******" },
      });

      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await parseResponse(res);
        console.log("[AUTH][LOGIN] Response:", {
          status: res.status,
          body: result,
        });

        if (!res.ok) {
          throw new Error(getErrorMessage(result, "Credenciales incorrectas"));
        }

        if (result?.token) {
          localStorage.setItem("token", result.token);
        }

        if (result?.user) {
          localStorage.setItem("user", JSON.stringify(result.user));
        }

        msg.style.color = "var(--success)";
        msg.textContent = "¡Login exitoso! Redirigiendo...";

        console.log(
          "[AUTH][LOGIN] Token guardado:",
          localStorage.getItem("token"),
        );
        console.log(
          "[AUTH][LOGIN] User guardado:",
          localStorage.getItem("user"),
        );

        // Redirigir al panel según rol después de 800ms
        setTimeout(() => {
          window.location.href = getRedirectByRole(result?.user);
        }, 800);
      } catch (err) {
        console.error("[AUTH][LOGIN] Error:", err);
        msg.style.color = "var(--error)";
        msg.textContent =
          err.name === "TypeError"
            ? "No se pudo conectar al servidor."
            : err.message;
      }
    });

  document
    .getElementById("sign-up-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = document.getElementById("sign-up-msg");
      msg.style.color = "var(--muted)";
      msg.textContent = "Registrando...";

      const formData = Object.fromEntries(new FormData(e.target).entries());
      const data = {
        nombre_usuario: formData.nombre,
        correo: formData.correo,
        password: formData.password,
      };

      console.log("[AUTH][REGISTER] Request:", {
        url: `${API_BASE}/auth/register`,
        payload: { ...data, password: "******" },
      });

      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await parseResponse(res);
        console.log("[AUTH][REGISTER] Response:", {
          status: res.status,
          body: result,
        });

        if (!res.ok) {
          throw new Error(getErrorMessage(result, "Error al registrarse"));
        }

        msg.style.color = "var(--success)";
        msg.textContent = "¡Registro exitoso! Haciendo login automático...";

        // Auto-login después del registro
        const loginRes = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            correo: data.correo,
            password: data.password,
          }),
        });

        const loginResult = await parseResponse(loginRes);

        if (loginResult?.token) {
          localStorage.setItem("token", loginResult.token);
        }

        if (loginResult?.user) {
          localStorage.setItem("user", JSON.stringify(loginResult.user));
        }

        console.log("[AUTH][REGISTER] Login automático completado");
        console.log(
          "[AUTH][REGISTER] Token guardado:",
          localStorage.getItem("token"),
        );
        console.log(
          "[AUTH][REGISTER] User guardado:",
          localStorage.getItem("user"),
        );

        // Redirigir al panel según rol después de 500ms
        setTimeout(() => {
          window.location.href = getRedirectByRole(loginResult?.user);
        }, 500);
      } catch (err) {
        console.error("[AUTH][REGISTER] Error:", err);
        msg.style.color = "var(--error)";
        msg.textContent =
          err.name === "TypeError"
            ? "No se pudo conectar al servidor."
            : err.message;
      }
    });
});
