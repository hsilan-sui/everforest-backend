const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/checkAuth");
const { restrictTo } = require("../middlewares/restrictTo");
const errorAsync = require("../utils/errorAsync");
const adminController = require("../controllers/adminController");

//我想要所有的admin api 都須先通過驗證登入與角色權限
router.use(checkAuth); // 驗證 JWT cookie  // 先驗證是否登入
router.use(restrictTo("admin")); // 限定 admin 存取

// 取得會員清單
router.get("/me", errorAsync(adminController.getAdminData));

module.exports = router;
