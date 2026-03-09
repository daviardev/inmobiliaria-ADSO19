const db = require("../config/db.js");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dns = require("dns");
const nodemailer = require("nodemailer");

// Configurar email
const transporter = nodemailer.createTransport({
  // eslint-disable-next-line no-undef
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  // eslint-disable-next-line no-undef
  port: Number(process.env.EMAIL_PORT || 465),
  // eslint-disable-next-line no-undef
  secure: String(process.env.EMAIL_SECURE || "true") === "true",
  auth: {
    // eslint-disable-next-line no-undef
    user: process.env.EMAIL_USER,
    // eslint-disable-next-line no-undef
    pass: process.env.EMAIL_PASSWORD,
  },
  // Railway can fail on IPv6 routes; force IPv4 DNS resolution for SMTP.
  lookup: (hostname, _options, callback) =>
    dns.lookup(hostname, { family: 4 }, callback),
});

// Verificar conexión
transporter.verify((error) => {
  if (error) {
    console.error("❌ Error configurando email:", error.message);
  } else {
    console.log("✅ Email configurado correctamente");
  }
});

const register = async (req, res) => {
  try {
    const { nombre_usuario, correo, password } = req.body;

    const checkUser = `select * from usuarios where correo = ?`;
    db.query(checkUser, [correo], async (err, results) => {
      if (err)
        return res
          .status(500)
          .json({ error: "Error verificando usuario", details: err.message });

      if (results.length > 0)
        return res.status(400).json({
          error: "El correo ya está registrado",
        });

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const rol_id = 1; // cliente por defecto

      const insertUser = `
        insert into usuarios (nombre_usuario, correo, password, rol_id)
        values (?, ?, ?, ?)
      `;

      db.query(
        insertUser,
        [nombre_usuario, correo, hashedPassword, rol_id],
        (err, results) => {
          if (err)
            return res.status(500).json({
              error: "Error al registrar usuario",
              details: err.message,
            });

          res.status(201).json({
            message: "Usuario registrado exitosamente",
            user_id: results.insertId,
          });
        }
      );
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al registrar usuario", details: err.message });
  }
};

const login = (req, res) => {
  const { correo, password } = req.body;

  const query = "SELECT * FROM usuarios WHERE correo = ?";

  db.query(query, [correo], async (err, results) => {
    if (err)
      return res.status(500).json({
        error: "Error del servidor",
        details: err.message,
      });

    if (results.length === 0)
      return res.status(400).json({
        error: "Usuario no encontrado",
      });

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(400).json({
        error: "Contraseña incorrecta",
      });

    const token = jwt.sign(
      {
        id: user.id,
        nombre_usuario: user.nombre_usuario,
        correo: user.correo,
        rol_id: user.rol_id,
      },
      // eslint-disable-next-line no-undef
      process.env.SECRET_KEY,
      { expiresIn: "30m" }
    );

    res.json({
      message: "Login exitoso",
      token,
      user: {
        id: user.id,
        nombre_usuario: user.nombre_usuario,
        correo: user.correo,
        rol_id: user.rol_id,
      },
    });
  });
};

// Recuperación de contraseña
const recoverPassword = (req, res) => {
  const { correo } = req.body;

  if (!correo) return res.status(400).json({ message: "Correo es requerido" });

  const query = "SELECT id, nombre_usuario FROM usuarios WHERE correo = ?";

  db.query(query, [correo], (err, results) => {
    if (err) return res.status(500).json({ error: "Error del servidor" });

    if (results.length === 0)
      return res.status(404).json({
        message: "Usuario no encontrado",
      });

    const user = results[0];

    // Generar token de reset (válido por 1 hora)
    const resetToken = jwt.sign(
      { id: user.id, correo },
      // eslint-disable-next-line no-undef
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    // URL del frontend para resetear contraseña
    // eslint-disable-next-line no-undef
    const resetUrl = `${process.env.FRONTEND_URL}?token=${resetToken}`;

    // Enviar email
    const mailOptions = {
      // eslint-disable-next-line no-undef
      from: process.env.EMAIL_USER,
      to: correo,
      subject: "Recuperación de Contraseña - App Inmobiliario",
      html: `
        <h2>Hola ${user.nombre_usuario}</h2>
        <p>Recibimos una solicitud para recuperar tu contraseña.</p>
        <p>Haz clic en el siguiente enlace para resetearla (válido por 1 hora):</p>
        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Resetear Contraseña
        </a>
        <p>Si no solicitaste esto, ignora este correo.</p>
      `,
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error("❌ Error enviando email:", err.message);
        console.error("   Código:", err.code);
        console.error("   Verifica que .env tenga las variables correctas");
        return res.status(500).json({
          message: "Error al enviar el correo",
          error: err.message,
          debug: {
            // eslint-disable-next-line no-undef
            service: process.env.EMAIL_SERVICE,
            // eslint-disable-next-line no-undef
            user: process.env.EMAIL_USER
              ? "✓ Configurado"
              : "✗ Falta EMAIL_USER",
            // eslint-disable-next-line no-undef
            password: process.env.EMAIL_PASSWORD
              ? "✓ Configurado"
              : "✗ Falta EMAIL_PASSWORD",
          },
        });
      }

      res.json({
        message: "Correo de recuperación enviado exitosamente",
      });
    });
  });
};

// Resetear contraseña
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword)
    return res
      .status(400)
      .json({ message: "Token y contraseña son requeridos" });

  try {
    // eslint-disable-next-line no-undef
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const query = "UPDATE usuarios SET password = ? WHERE id = ?";

    db.query(query, [hashedPassword, decoded.id], (err) => {
      if (err)
        return res.status(500).json({
          error: "Error al actualizar la contraseña",
        });

      res.json({
        message: "Contraseña actualizada exitosamente",
      });
    });
  } catch (err) {
    return res.status(400).json({
      message: "Token inválido o expirado",
      err,
    });
  }
};

// Obtener usuario actual (requiere autenticación)
const getCurrentUser = (req, res) => {
  try {
    // El middleware de autenticación ya validó el token y puso el usuario en req.user
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    // Buscar el usuario en la BD para obtener información actualizada
    const query =
      "SELECT id, nombre_usuario, correo, rol_id FROM usuarios WHERE id = ?";

    db.query(query, [user.id], (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Error al obtener usuario" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      res.json({
        message: "Usuario autenticado",
        usuario: results[0],
      });
    });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener usuario", err });
  }
};

module.exports = {
  register,
  login,
  recoverPassword,
  resetPassword,
  getCurrentUser,
};
