const express = require("express");
const router = express.Router();

const errorAsync = require("../utils/errorAsync");
const authController = require("../controllers/auth/auth");

router.post("/register", errorAsync(authController.signUp));
router.post("/login", errorAsync(authController.postMemberLogin));

module.exports = router;
