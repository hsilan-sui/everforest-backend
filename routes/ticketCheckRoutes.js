const express = require("express");
const router = express.Router();
//引入checkAuth middlewares
//驗票員身份驗證中介層
const checkAuth = require("../middlewares/checkAuth");

const errorAsync = require("../utils/errorAsync");

//驗票邏輯控制器
const ticketCheckController = require("../controllers/ticketCheckController");

// 核銷票券 API
router.post("/verify", checkAuth, errorAsync(ticketCheckController.verifyTicket));

module.exports = router;
