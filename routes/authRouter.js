const express = require("express");
const router = express.Router();
//引入checkAuth middlewares
const checkAuth = require("../middlewares/checkAuth");
const errorAsync = require("../utils/errorAsync");
const authController = require("../controllers/auth/authController");
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: 會員註冊
 *     tags: [Auth]
 *     description: 透過本網站註冊新會員帳號，僅限本地註冊（local），不可用於第三方登入。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - firstname
 *               - lastname
 *               - email
 *               - phone
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: 測試使用者
 *               firstname:
 *                 type: string
 *                 example: 測試
 *               lastname:
 *                 type: string
 *                 example: 使用者
 *               email:
 *                 type: string
 *                 example: test@example.com
 *               phone:
 *                 type: string
 *                 example: 0922123123
 *               password:
 *                 type: string
 *                 example: AAbbcc12345678
 *     responses:
 *       201:
 *         description: 註冊成功，返回會員資料與登入狀態
 *       400:
 *         description: 請求格式錯誤或缺少必要欄位
 *       409:
 *         description: 該 email、username已被註冊
 *       500:
 *         description: 伺服器錯誤
 */

router.post("/register", errorAsync(authController.signUp));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: 會員登入
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: 登入成功，返回 cookie
 *       400:
 *         description: 欄位未填寫正確
 *       401:
 *         description: email或密碼錯
 *       500:
 *         description: 伺服器錯誤
 */

router.post("/login", errorAsync(authController.postMemberLogin));

/**
 * @swagger
 * /auth/check:
 *   get:
 *     summary: 檢查登入狀態
 *     tags: [Auth]
 *     description: 驗證會員登入狀態，驗證 access_token 是否有效，並回傳目前登入的會員資料。需附帶 HttpOnly cookie。
 *     responses:
 *       200:
 *         description: 登入中，返回會員資料
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: 已登入
 *                 data:
 *                   type: object
 *                   properties:
 *                     member_info:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                           enum: [member, host, admin]
 *       401:
 *         description: 尚未登入或 access_token 已過期
 *       500:
 *         description: 伺服器錯誤
 */
router.get("/check", checkAuth, errorAsync(authController.checkMemberIsLogin));

/**
 * 使用 Refresh Token 換新 Access Token => token 驗證成功後自動寫回 cookie
 * 刷新 Token（用 refresh_token，動作性操作，應使用 POST）
 */
/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: 刷新 Access Token
 *     tags: [Auth]
 *     description: 使用 refresh_token（HttpOnly cookie）取得新的 access_token，並自動寫入 cookie。成功會回傳會員資料。
 *     responses:
 *       200:
 *         description: Token 已更新
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: 您的Token 已更新
 *                 data:
 *                   type: object
 *                   properties:
 *                     member_info:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                           enum: [member, host, admin]
 *       401:
 *         description: 未提供 refresh_token 或 Token 無效
 *       500:
 *         description: 伺服器錯誤
 */
router.post("/refresh", errorAsync(authController.refreshMemberToken));

/**
 * 會員登出 ，清除cookie
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: 會員登出
 *     tags: [Auth]
 *     description: 清除 access_token 與 refresh_token 的 cookie，結束登入狀態。
 *     responses:
 *       200:
 *         description: 已成功登出，cookie 已清除
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: 已成功登出
 *       500:
 *         description: 伺服器錯誤
 */
router.post("/logout", errorAsync(authController.postMemberLogout));

module.exports = router;
