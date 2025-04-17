const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/checkAuth");
const errorAsync = require("../utils/errorAsync");
const memberController = require("../controllers/member/memberController");

/**
 * @swagger
 * /member/profile:
 *   get:
 *     summary: 取得會員資料
 *     tags: [Member]
 *     description: 返回已登錄用戶的詳細資料。需要 JWT token 作為認證。
 *     security:
 *       - JWT: []
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
 *     tags: [Member]
 *     description: 更新當前已登錄用戶的個人資料。需要有效的 JWT token 作為認證。
 *     security:
 *       - JWT: []
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

module.exports = router;
