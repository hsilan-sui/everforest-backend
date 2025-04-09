const express = require("express");
const router = express.Router();
const errorAsync = require("../utils/errorAsync");
const memberController = require("../controller/member");
const auth = require("../middlewares/isAuth");

router.get("/profile/:memberId", auth.isAuth, errorAsync(memberController.getMemberProfile));
router.put("/profile/:memberId", auth.isAuth, errorAsync(memberController.updateProfile));

module.exports = router;
