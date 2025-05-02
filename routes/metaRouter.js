const express = require("express");
const router = express.Router();
//引入checkAuth middlewares
const checkAuth = require("../middlewares/checkAuth");
const errorAsync = require("../utils/errorAsync");

const eventTagController = require("../controllers/eventTagController");

/**
 * @swagger
 * /api/v1/meta/event-tags:
 *   post:
 *     summary: 建立活動標籤
 *     description: |
 *       ⚠️ 僅限已登入的主辦方使用，用來建立活動標籤。
 *
 *       ✅ 建立一個新的活動標籤名稱(至少4個字)，標籤名稱必須唯一。
 *     tags: [EventTags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: 豪奢露營
 *     responses:
 *       201:
 *         description: 活動標籤建立成功
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
 *                   example: 活動標籤建立成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     eventTag:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         name:
 *                           type: string
 *                           example: 豪奢露營
 *       400:
 *         description: 缺少或格式錯誤的名稱
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
 *                   example: 請提供有效的活動標籤名稱
 *       409:
 *         description: 標籤名稱已存在
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
 *                   example: 已有相同名稱的活動標籤，請勿重複建立
 *       500:
 *         description: 資料庫錯誤或伺服器錯誤
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
 *                   example: 伺服器錯誤，請稍後再試
 */
router.post("/event-tags", checkAuth, errorAsync(eventTagController.createEventTag));

/**
 * @swagger
 * /api/v1/meta/event-tags:
 *   get:
 *     summary: 取得所有活動標籤（公開）
 *     description: |
 *       取得目前系統中所有活動標籤清單，供活動建立與標籤選擇使用。
 *       此 API 為公開 API，不需要登入驗證，前台與後台皆可使用。
 *     tags: [EventTags]
 *     responses:
 *       200:
 *         description: 成功取得活動標籤列表
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
 *                   example: 取得所有活動標籤成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     eventTags:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: c76dfc0d-0a6f-4eaa-a6b1-33f26b4111bc
 *                           name:
 *                             type: string
 *                             example: 新手友善
 *                           description:
 *                             type: string
 *                             nullable: true
 *                             example: 適合第一次參加的露營活動
 *                           level:
 *                             type: string
 *                             nullable: true
 *                             example: beginner
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: 2025-04-30T06:22:11.123Z
 *       500:
 *         description: 系統錯誤，請稍後再試
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
 *                   example: 系統錯誤，請稍後再試
 */
router.get("/event-tags", errorAsync(eventTagController.getAllEventTags));

// router.delete(
//   "/event-tags/:tagId",
//   checkAuth,
//   restrictTo("host"),
//   errorAsync(eventTagController.deleteEventTag)
// );
module.exports = router;
