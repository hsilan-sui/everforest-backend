const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/checkAuth");
const { restrictTo } = require("../middlewares/restrictTo");
const errorAsync = require("../utils/errorAsync");
const adminController = require("../controllers/adminController");

//我想要所有的admin api 都須先通過驗證登入與角色權限
router.use(checkAuth); // 驗證 JWT cookie  // 先驗證是否登入
router.use(restrictTo("admin")); // 限定 admin 存取

// 取得admin data
router.get("/me", errorAsync(adminController.getAdminData));

//查詢活動列表(支援 EVENT_INFO active狀態) all | draft | pending | published | archived
// 取得所有主辦方辦的活動
//取得待審核的所有活動(可以排序 先 後)
router.get("/events", errorAsync(adminController.getAdminEvents));

//查看單筆活動詳情
// GET /api/admin/events/:id
router.get("/events/:id", errorAsync(adminController.getAdminEventById));

//審核通過活動
//審核不通過活動（可附原因）
//封存已結束或不公開的活動
module.exports = router;
