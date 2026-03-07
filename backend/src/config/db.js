const mysql = require("mysql2");

const connection = mysql.createConnection({
  // eslint-disable-next-line no-undef
  host: process.env.DB_HOST,
  // eslint-disable-next-line no-undef
  user: process.env.DB_USER,
  // eslint-disable-next-line no-undef
  password: process.env.DB_PASSWORD,
  // eslint-disable-next-line no-undef
  database: process.env.DB_NAME,
});

connection.connect((err) => {
  err
    ? console.error("Error connecting to the database:", err)
    : console.log("Connected to the database successfully!");
});

module.exports = connection;
