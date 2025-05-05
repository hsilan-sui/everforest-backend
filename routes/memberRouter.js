const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/checkAuth");
const errorAsync = require("../utils/errorAsync");
const memberController = require("../controllers/memberController");

/**
 * @swagger
 * /member/profile:
 *   get:
 *     summary: 取得會員資料
 *     tags: [Member 會員中心]
 *     description: |
 *       取得目前登入會員的詳細資料，包含關聯的會員角色資訊。
 *
 *       📌 僅限已登入且身份為 `member` 的會員存取。
 *
 *       ⚠️ 請確保請求附帶身份驗證 Cookie（access_token）。
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: 會員取得成功
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
 *                   example: 會員取得成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     member:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "c75721b4-db3a-467c-b21e-88c54d073e60"
 *                         username:
 *                           type: string
 *                           example: 測試使用者
 *                         firstname:
 *                           type: string
 *                           example: 測試
 *                         lastname:
 *                           type: string
 *                           example: 使用者
 *                         email:
 *                           type: string
 *                           example: xxx@gmail.com
 *                         role:
 *                           type: string
 *                           example: member
 *       400:
 *         description: 找不到會員資料
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 找不到會員資料
 *       401:
 *         description: 未授權，缺少或無效的 JWT
 *       500:
 *         description: 伺服器錯誤
 */

router.get("/profile", checkAuth, errorAsync(memberController.getProfile));

/**
 * @swagger
 * /member/profile:
 *   patch:
 *     summary: 更新會員資料
 *     tags: [Member 會員中心]
 *     description: |
 *       修改目前登入會員的詳細資料，包含關聯的會員角色資訊。
 *
 *       📌 僅限已登入且身份為 `member` 的會員存取。
 *
 *       ⚠️ 請確保請求附帶身份驗證 Cookie（access_token）。
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       description: 更新會員資料
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstname:
 *                 type: string
 *                 description: 用戶的名字
 *                 example: "測試"
 *               lastname:
 *                 type: string
 *                 description: 用戶的姓氏
 *                 example: "使用者"
 *               username:
 *                 type: string
 *                 description: 用戶的用戶名
 *                 example: "測試使用者"
 *               birth:
 *                 type: string
 *                 format: date
 *                 description: 用戶的出生日期
 *                 example: "2025-02-09"
 *               gender:
 *                 type: string
 *                 description: 用戶的性別
 *                 enum: ["男", "女"]
 *                 example: "男"
 *               photo_url:
 *                 type: string
 *                 description: 用戶的頭像照片 URL
 *                 example: "https://example.com/photo.jpg"
 *     responses:
 *       200:
 *         description: 會員資料更新成功
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
 *                   example: 會員資料更新成功
 *       400:
 *         description: 欄位未填寫正確
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 欄位未填寫正確
 *       401:
 *         description: 未授權，缺少或無效的 JWT
 *       500:
 *         description: 伺服器錯誤
 */
router.patch("/profile", checkAuth, errorAsync(memberController.updateProfile));

/**
 * @swagger
 * /member/profile/avatar:
 *   post:
 *     summary: 上傳會員頭像
 *     tags: [Member 會員中心]
 *     description: |
 *       上傳並更新會員頭像，圖片限制大小為 2MB。
 *
 *       📌 僅限已登入且身份為 `member` 的會員存取。
 *
 *       ⚠️ 請確保請求附帶身份驗證 Cookie（access_token）。
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 上傳的頭像圖片
 *     responses:
 *       200:
 *         description: 會員頭貼更新成功
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
 *                   example: 會員頭貼更新成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     photo_url:
 *                       type: string
 *                       example: https://example.com/avatar.jpg
 *       400:
 *         description: 未上傳圖片或圖片格式錯誤
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
 *                   example: 請上傳圖片
 *       404:
 *         description: 查無會員資料
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
 *                   example: 會員資料不存在
 *       401:
 *         description: 未授權，缺少或無效的 JWT
 *       500:
 *         description: 伺服器錯誤
 */
router.post("/profile/avatar", checkAuth, errorAsync(memberController.editMemberAvatar));

router.get("/orders", checkAuth, errorAsync(memberController.getMemberOrder));

router.post("/orders/:orderId", checkAuth, errorAsync(memberController.postMemberOrder));

router.patch("/orders/:orderId", checkAuth, errorAsync(memberController.patchMemberOrder));

router.delete("/orders/:orderId", checkAuth, errorAsync(memberController.patchMemberOrder));

module.exports = router;
