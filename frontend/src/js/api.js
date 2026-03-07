/**
 * Cliente API centralizado para todas las peticiones
 * Maneja autenticación, token y errores
 */

const API_BASE = "http://localhost:3000/api";

class APIClient {
  constructor(baseURL = API_BASE) {
    this.baseURL = baseURL;
  }

  getToken() {
    return localStorage.getItem("token");
  }

  getHeaders(includeAuth = true) {
    const headers = {
      "Content-Type": "application/json",
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async request(endpoint, method = "GET", body = null, includeAuth = true) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const options = {
        method,
        headers: this.getHeaders(includeAuth),
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      console.log(`[API] ${method} ${endpoint}`, body || "");

      const res = await fetch(url, options);
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      console.log(`[API] Response ${res.status}:`, data);

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/index.html";
        }
        throw new Error(data.error || data.message || `Error ${res.status}`);
      }

      return data;
    } catch (err) {
      console.error(`[API] Error en ${endpoint}:`, err);
      throw err;
    }
  }

  // ─── AUTH ───
  async register(nombre_usuario, correo, password) {
    return this.request(
      "/auth/register",
      "POST",
      {
        nombre_usuario,
        correo,
        password,
      },
      false,
    );
  }

  async login(correo, password) {
    return this.request("/auth/login", "POST", { correo, password }, false);
  }

  async getCurrentUser() {
    return this.request("/auth/me", "GET", null, true);
  }

  // ─── LOTES ───
  async getLotes() {
    return this.request("/lotes", "GET", null, false);
  }

  async createLote(data) {
    return this.request("/lotes", "POST", data, true);
  }

  // ─── COMPRAS ───
  async createCompra(lote_id, valor_inicial) {
    return this.request("/compra", "POST", { lote_id, valor_inicial }, true);
  }

  async getMisCompras() {
    return this.request("/mis-compras", "GET", null, true);
  }

  async getTodasCompras() {
    return this.request("/compra/admin/todas", "GET", null, true);
  }

  // ─── PAGOS ───
  async registrarPago(compra_id, monto) {
    return this.request(
      "/pagos",
      "POST",
      {
        compra_id,
        monto,
      },
      true,
    );
  }

  async getPagosHistorial(compra_id) {
    return this.request(`/pagos/historial/${compra_id}`, "GET", null, true);
  }

  // ─── PQRS ───
  async createPQRS(tipo, asunto, descripcion) {
    return this.request("/pqrs", "POST", { tipo, asunto, descripcion }, true);
  }

  async getMisPQRS() {
    return this.request("/pqrs", "GET", null, true);
  }

  async getPQRSAdmin() {
    return this.request("/pqrs/admin/todas", "GET", null, true);
  }

  async responderPQRS(id, respuesta) {
    return this.request(
      `/pqrs/admin/${id}/responder`,
      "PUT",
      { respuesta },
      true,
    );
  }

  // ─── DASHBOARD ───
  async getDashboard() {
    return this.request("/dashboard", "GET", null, true);
  }

  // ─── ROLES ───
  async getRoles() {
    return this.request("/roles", "GET", null, false);
  }

  // ─── PERFIL ───
  async updateProfile(nombre_usuario, correo) {
    return this.request(
      "/usuarios/perfil",
      "PUT",
      {
        nombre_usuario,
        correo,
      },
      true,
    );
  }
}

const api = new APIClient();

function requireAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/src/pages/auth/login.html";
    return false;
  }
  return true;
}

function getLoggedUser() {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/index.html";
}

// Export para módulos ES6
export { api, requireAuth, getLoggedUser, logout, APIClient };
