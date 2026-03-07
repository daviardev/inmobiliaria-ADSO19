const e = require("express");
const router = e.Router();

const { getRoles } = require("../controller/roles.controller.js");

router.get("/", getRoles);

module.exports = router;
