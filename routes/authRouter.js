const express = require("express");
const router = express.Router();
//引入checkAuth middlewares
const checkAuth = require("../middlewares/checkAuth");
const errorAsync = require("../utils/errorAsync");
const authController = require("../controllers/auth/authController");

router.post("/register", errorAsync(authController.signUp));

router.post("/login", errorAsync(authController.postMemberLogin));

/**
 * 驗證使用者是否登入、回傳基本資訊 =>	搭配 checkAuth middleware
 */
router.get("/check", checkAuth, errorAsync(authController.checkMemberIsLogin));

/**
 * 使用 Refresh Token 換新 Access Token => token 驗證成功後自動寫回 cookie
 * 刷新 Token（用 refresh_token，動作性操作，應使用 POST）
 */
router.post("/refresh", errorAsync(authController.refreshMemberToken));

/**
 * 會員登出 ，清除cookie
 */
router.post("/logout", errorAsync(authController.postMemberLogout));

module.exports = router;
