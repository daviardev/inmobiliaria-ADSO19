const db = require("../config/db");

const getRoles = (req, res) => {
  const query = "SELECT * FROM roles";

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({
        error: "Error al consultar roles",
        details: err.message,
      });
    }

    res.json(results);
  });
};

module.exports = { getRoles };
