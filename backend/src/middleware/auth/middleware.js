const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err)
      return res
        .status(403)
        .json({ error: err.message, message: "Failed to authenticate token" });

    req.user = decoded;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (!req.user)
    return res.status(401).json({ message: "Usuario no autenticado" });

  if (req.user.rol_id !== 2)
    return res
      .status(403)
      .json({ message: "Acceso denegado. Solo administradores" });

  next();
};

const isCliente = (req, res, next) => {
  if (!req.user)
    return res.status(401).json({ message: "Usuario no autenticado" });

  if (req.user.rol_id !== 1)
    return res.status(403).json({ message: "Acceso denegado. Solo clientes" });

  next();
};

module.exports = { verifyToken, isAdmin, isCliente };
