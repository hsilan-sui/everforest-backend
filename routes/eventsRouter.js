const express = require("express");
const router = express.Router();
//引入checkAuth middlewares
const checkAuth = require("../middlewares/checkAuth");
const { restrictTo } = require("../middlewares/restrictTo");
const errorAsync = require("../utils/errorAsync");

const eventController = require("../controllers/eventController");

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: 活動管理 API（主辦方限定）
 */

/**
 * @swagger
 * /api/v1/events:
 *   post:
 *     summary: 創建一筆新的活動
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - address
 *               - description
 *               - start_time
 *               - end_time
 *               - max_participants
 *               - cancel_policy
 *             properties:
 *               title:
 *                 type: string
 *               address:
 *                 type: string
 *               description:
 *                 type: string
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *               max_participants:
 *                 type: integer
 *               cancel_policy:
 *                 type: string
 *               registration_open_time:
 *                 type: string
 *                 format: date-time
 *               registration_close_time:
 *                 type: string
 *                 format: date-time
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       201:
 *         description: 活動建立成功
 *       400:
 *         description: 請求格式錯誤或缺少欄位
 *       409:
 *         description: 活動已存在
 */
router.post("/", checkAuth, restrictTo("host"), errorAsync(eventController.createEvent));

/**
 * @swagger
 * /api/v1/events/{eventId}/host:
 *   get:
 *     summary: 主辦方取得自己的活動詳情
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: 活動 ID
 *     responses:
 *       200:
 *         description: 成功取得活動詳情
 *       400:
 *         description: 缺少活動 ID
 *       403:
 *         description: 尚未建立主辦方資料
 *       404:
 *         description: 找不到該活動或無權查看
 */
router.get(
  "/:eventId/host",
  checkAuth,
  restrictTo("host"),
  errorAsync(eventController.getHostOwnedEvent)
);

/**
 * @swagger
 * /api/v1/events/{eventId}/notices-tags:
 *   patch:
 *     summary: 更新活動的行前提醒與標籤
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: 活動 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notices:
 *                 type: array
 *                 description: 行前提醒陣列
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: 行前提醒
 *                     content:
 *                       type: string
 *                       example: 請攜帶防蚊液
 *               tagIds:
 *                 type: array
 *                 description: 標籤 ID 陣列
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 行前提醒與標籤更新成功
 *       400:
 *         description: 缺少必要欄位
 *       404:
 *         description: 找不到對應的活動
 */

router.patch(
  "/:eventId/notices-tags",
  checkAuth,
  restrictTo("host"),
  errorAsync(eventController.updateNoticesTags)
);

/**
 * @swagger
 * /api/v1/events/{eventId}/images:
 *   get:
 *     summary: 取得指定活動的所有圖片（公開）
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: 活動 ID
 *     responses:
 *       200:
 *         description: 成功取得圖片列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       imageId:
 *                         type: string
 *                       event_info_id:
 *                         type: string
 *                       imageUrl:
 *                         type: string
 *                       description:
 *                         type: string
 *                       type:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: 找不到任何圖片或活動 ID 錯誤
 */

router.get(
  "/:eventId/images",
  errorAsync(eventController.getEventPhotos) // ← 查所有圖片
);

/**
 * @swagger
 * /api/v1/events/{eventId}/images/{imageId}:
 *   get:
 *     summary: 取得單張活動圖片資訊（公開）
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: 活動 ID
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: 圖片 ID
 *     responses:
 *       200:
 *         description: 成功取得圖片資訊
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     imageId:
 *                       type: string
 *                     event_info_id:
 *                       type: string
 *                     imageUrl:
 *                       type: string
 *                     description:
 *                       type: string
 *                     type:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: 找不到指定的圖片
 */
router.get("/:eventId/images/:imageId", errorAsync(eventController.getSingleEventPhoto));

/**
 * @swagger
 * /api/v1/events/{eventId}/images:
 *   post:
 *     summary: 上傳活動圖片（最多六張）
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: 活動 ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 最多上傳 6 張 JPG/PNG 圖片
 *     responses:
 *       201:
 *         description: 圖片上傳成功
 *       400:
 *         description: 上傳錯誤（例如張數超過、格式錯誤）
 */
router.post(
  "/:eventId/images",
  checkAuth,
  restrictTo("host"),
  errorAsync(eventController.uploadEventPhotos)
);

/**
 * @swagger
 * /api/v1/events/{eventId}/images/{imageId}:
 *   patch:
 *     summary: 更新活動圖片描述
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: 活動 ID
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: 圖片 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 example: 這是封面圖片
 *     responses:
 *       200:
 *         description: 圖片描述更新成功
 *       400:
 *         description: 缺少必要的 description 欄位
 *       404:
 *         description: 找不到指定的圖片
 */
router.patch(
  "/:eventId/images/:imageId",
  checkAuth,
  restrictTo("host"),
  errorAsync(eventController.updateImageDescription)
);

/**
 * @swagger
 * /api/v1/events/{eventId}/images/{imageId}:
 *   delete:
 *     summary: 刪除指定活動圖片
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: 活動 ID
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: 圖片 ID
 *     responses:
 *       200:
 *         description: 圖片刪除成功
 *       404:
 *         description: 找不到指定的圖片
 */
router.delete(
  "/:eventId/images/:imageId",
  checkAuth,
  restrictTo("host"),
  errorAsync(eventController.deleteImage)
);
/**
 * @swagger
 * /api/v1/events/{eventId}/images/{imageId}/set-cover:
 *   patch:
 *     summary: 設定活動圖片為封面
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: 活動 ID
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: 圖片 ID
 *     responses:
 *       200:
 *         description: 成功設定為封面圖片
 *       404:
 *         description: 找不到指定的圖片
 */
// 設定活動的封面圖片（指定一張 cover）
router.patch(
  "/:eventId/images/:imageId/set-cover",
  checkAuth,
  restrictTo("host"),
  errorAsync(eventController.setCoverImage)
);
/**
 * @swagger
 * /api/v1/events/{eventId}/plans:
 *   post:
 *     summary: 建立活動方案（含內容與加購品）
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: 活動 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plans:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - title
 *                     - price
 *                   properties:
 *                     title:
 *                       type: string
 *                     price:
 *                       type: number
 *                     discounted_price:
 *                       type: number
 *                     contents:
 *                       type: array
 *                       items:
 *                         type: string
 *                     addons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           price:
 *                             type: number
 *     responses:
 *       201:
 *         description: 活動方案建立成功
 *       400:
 *         description: 缺少活動 ID 或方案資料
 *       404:
 *         description: 找不到對應的活動
 */
// 建立活動方案 活動方案內容 活動加購
router.post(
  "/:eventId/plans",
  checkAuth,
  restrictTo("host"),
  errorAsync(eventController.createEventPlans)
);

/**
 * @swagger
 * /api/v1/events/{eventId}/plans:
 *   get:
 *     summary: 取得活動方案（含內容與加購品）
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: 活動 ID
 *     responses:
 *       200:
 *         description: 成功取得活動方案
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     event_info_id:
 *                       type: string
 *                     plans:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           price:
 *                             type: number
 *                           discounted_price:
 *                             type: number
 *                           contents:
 *                             type: array
 *                             items:
 *                               type: string
 *                           addons:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                 price:
 *                                   type: number
 *       400:
 *         description: 缺少活動 ID
 *       404:
 *         description: 找不到對應的活動
 */
router.get(
  "/:eventId/plans",
  checkAuth,
  restrictTo("host"),
  errorAsync(eventController.getEventPlans)
);
/**
 * @swagger
 * /api/v1/events/{eventId}/plans:
 *   patch:
 *     summary: 批次更新或新增活動方案
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: 活動 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plans:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: 若為更新請帶入方案 ID
 *                     title:
 *                       type: string
 *                     price:
 *                       type: number
 *                     discounted_price:
 *                       type: number
 *                     contents:
 *                       type: array
 *                       items:
 *                         type: string
 *                     addons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           price:
 *                             type: number
 *     responses:
 *       200:
 *         description: 更新活動方案成功
 *       400:
 *         description: 缺少活動 ID 或方案資料
 *       404:
 *         description: 找不到對應的活動或方案
 */
// 更新活動方案(整批部分更新 有id 沒id)
router.patch(
  "/:eventId/plans",
  checkAuth,
  restrictTo("host"),
  errorAsync(eventController.updateEventPlans)
);

/**
 * @swagger
 * /api/v1/events/{eventId}/publish:
 *   patch:
 *     summary: 將活動從草稿狀態上架為已發布
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: 活動 ID
 *     responses:
 *       200:
 *         description: 活動成功上架
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     eventId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: published
 *       400:
 *         description: 活動非草稿狀態或缺少活動 ID
 *       404:
 *         description: 找不到對應的活動
 */
//提交活動上架 active => draft => published
router.patch(
  "/:eventId/publish",
  checkAuth,
  restrictTo("host"),
  errorAsync(eventController.publishEvent)
);

/**
 * @swagger
 * /api/v1/events/{eventId}:
 *   get:
 *     summary: 取得公開活動詳情（僅限已上架活動）
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: 活動 ID
 *     responses:
 *       200:
 *         description: 成功取得公開活動詳情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   description: 活動詳細資料
 *       400:
 *         description: 缺少活動 ID
 *       404:
 *         description: 活動不存在或尚未上架
 */

// 新增公開取得活動詳情的 route（無需驗證）
router.get("/:eventId", errorAsync(eventController.getPublicEvent));

module.exports = router;
