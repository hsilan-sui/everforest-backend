const express = require("express");
const router = express.Router();
// const config = require("../config/index");
// const { dataSource } = require("../db/data-source");
// const logger = require("../utils/logger")("Auth");

const errorAsync = require("../utils/errorAsync");
const authController = require("../controller/auth");

router.post("/register", errorAsync(authController.signUp));

module.exports = router;
