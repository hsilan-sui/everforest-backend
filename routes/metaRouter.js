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
 *     summary: 新增活動標籤
 *     tags: [EventTags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               level:
 *                 type: string
 *                 enum: [basic, advanced]
 *     responses:
 *       201:
 *         description: 活動標籤新增成功
 *       400:
 *         description: 欄位錯誤或標籤已存在
 */
router.post("/event-tags", checkAuth, errorAsync(eventTagController.createEventTag));

/**
 * @swagger
 * /api/v1/meta/event-tags:
 *   get:
 *     summary: 取得所有活動標籤
 *     tags: [EventTags]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功取得標籤清單
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   level:
 *                     type: string
 */
router.get("/event-tags", checkAuth, errorAsync(eventTagController.getEventTags));

/**
 * @swagger
 * /api/v1/meta/event-tags/{tagId}:
 *   delete:
 *     summary: 刪除活動標籤
 *     tags: [EventTags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema:
 *           type: string
 *         description: 標籤 ID
 *     responses:
 *       200:
 *         description: 成功刪除標籤
 *       404:
 *         description: 找不到指定標籤
 */
router.delete("/event-tags/:tagId", checkAuth, errorAsync(eventTagController.deleteEventTag));
module.exports = router;
