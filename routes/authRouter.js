const express = require("express");
const router = express.Router();
//引入checkAuth middlewares
const checkAuth = require("../middlewares/checkAuth");
const errorAsync = require("../utils/errorAsync");
const authController = require("../controllers/authController");
const passport = require("passport");

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: 會員註冊
 *     tags: [Auth 會員認證]
 *     description: 透過網站註冊會員帳號
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
 *         description: 註冊成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                   description: 結果
 *                 message:
 *                   type: string
 *                   example: 會員註冊成功
 *                   description: 回傳訊息
 *       400:
 *         description: 請求格式錯誤或缺少必要欄位
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: failed
 *                   description: 結果
 *                 message:
 *                   type: string
 *                   example: 欄位未填寫正確 / 密碼不符合規則
 *                   description: 回傳訊息（欄位錯誤或格式錯誤）
 *       409:
 *         description: 該 email、username 已被註冊
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: failed
 *                   description: 結果
 *                 message:
 *                   type: string
 *                   example: Email 已被使用 / username 已被使用
 *                   description: 回傳訊息（重複註冊）
 *       500:
 *         description: 伺服器錯誤
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                   description: 結果
 *                 message:
 *                   type: string
 *                   example: 伺服器錯誤
 *                   description: 回傳訊息
 */

router.post("/register", errorAsync(authController.signUp));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: 會員登入
 *     tags: [Auth 會員認證]
 *     description: |
 *       會員登入成功後，伺服器會回傳會員資訊，並透過 `Set-Cookie` 寫入兩個 Token 至瀏覽器：
 *
 *       - `access_token`：短效存取憑證（15 分鐘）
 *       - `refresh_token`：長效更新憑證（7 天）
 *
 *       📌 這兩個 Cookie 都設定為：
 *       - `HttpOnly`（JavaScript 無法存取，避免 XSS）
 *       - `Secure`（僅 HTTPS 傳送）
 *       - `SameSite=Strict`（防止 CSRF）
 *
 *       ⚠️ **前端請在發送請求時加上 `credentials: include`，以攜帶 Cookie。**
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: suiii@gmail.com
 *               password:
 *                 type: string
 *                 example: AAbbcc12345678
 *     responses:
 *       200:
 *         description: 登入成功
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
 *                   example: 登入成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     member_info:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: 1c8da31a-5fd2-44f3-897e-4a259e7ec62b
 *                         username:
 *                           type: string
 *                           example: suii
 *                         firstname:
 *                           type: string
 *                           example: 測試使用者
 *                         lastname:
 *                           type: string
 *                           example: 測試使用者
 *                         email:
 *                           type: string
 *                           example: aa@gmail.com
 *                         role:
 *                           type: string
 *                           example: member
 *       400:
 *         description: 欄位未填寫正確
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: failed
 *                 message:
 *                   type: string
 *                   example: 欄位未填寫正確
 *       401:
 *         description: email 或密碼錯誤
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: failed
 *                 message:
 *                   type: string
 *                   example: email或密碼錯誤
 *       500:
 *         description: 伺服器錯誤
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: 伺服器錯誤
 */

router.post("/login", errorAsync(authController.postMemberLogin));

/**
 * @swagger
 * /auth/check:
 *   get:
 *     summary: 檢查登入狀態
 *     tags: [Auth 會員認證]
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
 *     tags: [Auth 會員認證]
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
 *     tags: [Auth 會員認證]
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

/**
 * @swagger
 * /auth/reset-password:
 *   put:
 *     summary: 重設密碼（需登入）
 *     tags: [Auth 會員認證]
 *     description: 已登入會員透過此 API 重設密碼。前端應負責確認 newPassword 與 confirmPassword 是否一致。
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 description: 新密碼（需符合密碼規則）
 *                 example: Abc123456
 *     responses:
 *       200:
 *         description: 密碼已成功重設
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
 *                   example: 密碼已成功重設
 *       400:
 *         description: 請求錯誤（如密碼格式錯誤）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: 密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字
 *       401:
 *         description: 尚未登入或驗證失敗
 *       500:
 *         description: 伺服器錯誤
 */
router.put("/reset-password", checkAuth, errorAsync(authController.resetPassword));

/**
 * @swagger
 * /api/v1/auth/oauth/google:
 *   get:
 *     summary: 透過 Google 登入（OAuth 2.0）
 *     tags: [Auth 會員認證]
 *     description: 透過 Google OAuth 重導使用者至 Google 授權頁面，使用者授權後將自動跳轉至 callback URL。
 *     responses:
 *       302:
 *         description: 重導至 Google 授權頁面
 *       500:
 *         description: 伺服器錯誤
 */
router.get(
  "/oauth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"], // 要求的授權範圍
  })
);

/**
 * @swagger
 * /api/v1/auth/oauth/google/callback:
 *   get:
 *     summary: Google OAuth 登入 callback
 *     tags: [Auth 會員認證]
 *     description: |
 *       Google 授權完成後自動導向此 callback。Passport 將透過授權碼交換 access token，
 *       並取得使用者資訊，進行登入或註冊處理，最終將使用者導回前端頁面。
 *     responses:
 *       302:
 *         description: 成功登入後導回前端頁面
 *       401:
 *         description: 授權失敗，導向登入頁面
 *       500:
 *         description: 登入流程發生錯誤
 */
router.get(
  "/oauth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  errorAsync(authController.googleCallback)
);

//忘記密碼
/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: 忘記密碼 - 寄送重設連結
 *     tags: [Auth 會員認證]
 *     description: >
 *       使用者在忘記密碼時輸入 email，系統將寄送一封內含重設連結（含 resetId token）的 email。<br />
 *       此連結有效時間約 15 分鐘。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 使用者註冊時的 email
 *                 example: suihsilan@gmail.com
 *     responses:
 *       200:
 *         description: 信件已寄出（即使 email 不存在也回應成功）
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
 *                   example: 重設密碼信件已寄出，請稍後確認
 *       429:
 *         description: 過於頻繁請求（15 分鐘內再次請求）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: 請勿重複申請重設密碼，請稍後再試
 *       400:
 *         description: 欄位錯誤或格式錯誤
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: 欄位必填
 *       500:
 *         description: 伺服器錯誤
 */

router.post("/forgot-password", errorAsync(authController.forgotPassword));

/**
 * @swagger
 * /auth/reset-password-by-token:
 *   post:
 *     summary: 忘記密碼 - 使用 token 重設密碼
 *     tags: [Auth 會員認證]
 *     description: >
 *       使用者忘記密碼，透過 email 中收到的 token，輸入新密碼進行重設。<br />
 *       前端需從連結中擷取 resetId，作為 token 一併送出。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: 來自 email 的 token（resetId）
 *                 example: 542dcc26569d7d65e0e0c6d25b1d606e3f77c1bc9f9c0514b14249de3b04c57a
 *               newPassword:
 *                 type: string
 *                 description: 新密碼，需符合密碼強度規則（8～16 字，包含英文與數字）
 *                 example: Abc123456
 *     responses:
 *       200:
 *         description: 密碼重設成功
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
 *                   example: 請重新登入
 *       400:
 *         description: 請求錯誤，如欄位缺失、token 錯誤或已過期
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: failed
 *                 message:
 *                   type: string
 *                   example: 連結已失效，請稍後再試
 *       500:
 *         description: 伺服器錯誤
 */

router.post("/reset-password-by-token", errorAsync(authController.resetPasswordByToken));

module.exports = router;
