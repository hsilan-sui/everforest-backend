const express = require("express");
const router = express.Router();
//引入checkAuth middlewares
const checkAuth = require("../middlewares/checkAuth");
const { restrictTo } = require("../middlewares/restrictTo");
const errorAsync = require("../utils/errorAsync");

const hostController = require("../controllers/host/hostController");

//創建主辦方資料
router.post(
  "/profile",
  checkAuth,
  restrictTo("member"),
  errorAsync(hostController.postHostProfile)
);

module.exports = router;
