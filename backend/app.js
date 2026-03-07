const e = require("express");
const cors = require("cors");
require("dotenv").config();

const app = e();

app.use(cors());
app.use(e.json());

const pqrsRoutes = require("./src/routes/pqrs.routes.js");
const crearCompra = require("./src/routes/compra.routes.js");
const authRoutes = require("./src/routes/auth.routes.js");
const roleRoutes = require("./src/routes/roles.routes.js");
const pagosRoutes = require("./src/routes/pagos.routes.js");
const misComprasRoutes = require("./src/routes/mis-compras.routes.js");
const dashboardRoutes = require("./src/routes/dashboard.routes.js");
const etapasRoutes = require("./src/routes/etapas.routes.js");
const lotesRoutes = require("./src/routes/lotes.routes.js");
const usuariosRoutes = require("./src/routes/usuarios.routes.js");

app.use("/api/mis-compras", misComprasRoutes);
app.use("/api/pqrs", pqrsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/compra", crearCompra);
app.use("/api/etapas", etapasRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/lotes", lotesRoutes);
app.use("/api/usuarios", usuariosRoutes);

// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(PORT);
});
