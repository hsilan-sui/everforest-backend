const express = require("express");
const router = express.Router();
//引入checkAuth middlewares
const checkAuth = require("../middlewares/checkAuth");
const { restrictTo } = require("../middlewares/restrictTo");
const errorAsync = require("../utils/errorAsync");

const eventController = require("../controllers/eventController");

const checkEventEditable = require("../middlewares/checkEventEditable");

router.get("/favorites", checkAuth, errorAsync(eventController.getEventFavorites));

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
 *     summary: 建立一筆新的活動
 *     description: |
 *       僅限已登入的主辦方使用，用來建立活動基本資料。
 *
 *       ⚠️ 注意：主辦方需先建立 Host_Info 資料，否則會回傳 403。
 *
 *       ✅ 成功後會儲存為active為'draft'狀態，可後續補上圖片、方案、提醒等資料。
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
 *                 example: 夏日山林兩天一夜營隊
 *               address:
 *                 type: string
 *                 example: 南投縣仁愛鄉合歡山
 *               description:
 *                 type: string
 *                 example: 深入山林、觀星露營、野炊體驗
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-08-10T09:00:00+08:00
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-08-11T17:00:00+08:00
 *               max_participants:
 *                 type: integer
 *                 example: 40
 *               cancel_policy:
 *                 type: string
 *                 example: 活動前 7 日可全額退費
 *               registration_open_time:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: 2025-07-01T00:00:00+08:00
 *               registration_close_time:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: 2025-08-05T23:59:59+08:00
 *               latitude:
 *                 type: number
 *                 nullable: true
 *                 example: 24.1801
 *               longitude:
 *                 type: number
 *                 nullable: true
 *                 example: 121.3105
 *     responses:
 *       201:
 *         description: 活動建立成功
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
 *                   example: 露營活動建立成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     event:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         host_info_id:
 *                           type: string
 *                         title:
 *                           type: string
 *                         status:
 *                           type: string
 *                           example: preparing
 *                         active:
 *                           type: string
 *                           example: draft
 *       400:
 *         description: 必填欄位驗證錯誤
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
 *                   example: 請填寫必填欄位
 *       401:
 *         description: 未登入
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
 *                   example: 請先登入會員
 *       403:
 *         description: 尚未建立主辦方資料
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
 *                   example: 尚未建立主辦方資料
 *       409:
 *         description: 該活動已存在（主辦方 + 標題 + 起始時間相同）
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
 *                   example: 該活動已存在，請勿重複建立
 *       500:
 *         description: 資料庫錯誤或交易失敗
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

router.post("/", checkAuth, restrictTo("host"), errorAsync(eventController.createEvent));

router.patch("/:eventId", checkAuth, restrictTo("host"), errorAsync(eventController.patchEvent));

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
 *     description: 主辦方更新指定活動的行前提醒與標籤。若陣列為空則代表清除所有設定。
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         description: 活動 ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tagIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               notices:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: 行前提醒
 *                     content:
 *                       type: string
 *                       example: 請記得攜帶身分證件
 *             example:
 *               tagIds:
 *                 - "7c3a2e10-8baf-4c42-a7e1-21f1e1b993f3"
 *                 - "a9e8d9c7-3f25-456a-abc9-0a5de40c730e"
 *               notices:
 *                 - type: 行前提醒
 *                   content: 請記得攜帶身分證件
 *                 - type: 行前提醒
 *                   content: 活動地點無停車位，請搭乘大眾運輸
 *     responses:
 *       200:
 *         description: 成功更新行前提醒與標籤
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 status: success
 *                 message: 行前提醒與標籤更新成功
 *                 data:
 *                   event_id: b329c845-6bc2-4b5d-982e-7a861121fd2b
 *                   notices_updated: 2
 *                   tags_updated: 2
 *                   notices:
 *                     - type: 行前提醒
 *                       content: 請記得攜帶身分證件
 *                     - type: 行前提醒
 *                       content: 活動地點無停車位，請搭乘大眾運輸
 *                   tags:
 *                     - id: 7c3a2e10-8baf-4c42-a7e1-21f1e1b993f3
 *                       name: 寵物友善
 *                       description: 適合攜帶寵物參加的活動
 *                       level: 1
 *                     - id: a9e8d9c7-3f25-456a-abc9-0a5de40c730e
 *                       name: 秘境探索
 *                       description: 探訪不為人知的自然景點
 *                       level: 3
 *       400:
 *         description: 缺少活動 ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 status: failed
 *                 message: 尚未建立活動
 *       401:
 *         description: 未登入會員
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 status: failed
 *                 message: 請先登入會員
 *       403:
 *         description: 權限錯誤或主辦方資料不存在
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   example:
 *                     status: failed
 *                     message: 尚未建立主辦方資料
 *                 - type: object
 *                   example:
 *                     status: failed
 *                     message: 權限異常或活動不存在
 *       500:
 *         description: 系統內部錯誤
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 status: error
 *                 message: 伺服器錯誤，請稍後再試
 */

router.patch(
  "/:eventId/notices-tags",
  checkAuth,
  restrictTo("host"),
  checkEventEditable, //根據活動狀態（pending、rejected、published、archived）擋住不能再編輯
  errorAsync(eventController.updateNoticesTags)
);

/**
 * @swagger
 * /api/v1/events/{eventId}/images:
 *   post:
 *     summary: 上傳活動圖片（封面圖或詳情圖）
 *     description: 需登入並擁有活動主辦權限。可上傳最多 3 張封面圖或詳情圖，僅支援 JPG / PNG 格式。
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
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [cover, detail]
 *         description: 圖片類型，可為 `cover`（封面圖）或 `detail`（詳情圖）
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
 *                 description: 上傳的圖片檔案（最多 3 張）
 *               descriptions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 圖片對應的描述內容（只有 `type=detail` 時使用）
 *     responses:
 *       201:
 *         description: 上傳成功，回傳每張圖片資訊
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
 *                   example: 封面圖上傳成功
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
 *                         format: uri
 *                       type:
 *                         type: string
 *                         enum: [cover, detail]
 *                       description:
 *                         type: string
 *                         nullable: true
 *       400:
 *         description: 上傳錯誤（格式錯誤、檔案數量超過、缺少必要欄位等）
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
 *                   example: 請至少上傳一張圖片
 *       401:
 *         description: 未授權，請先登入
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
 *                   example: 請先登入會員
 *       403:
 *         description: 無權限上傳此活動圖片
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
 *                   example: 尚未建立主辦方資料
 */

router.post(
  "/:eventId/images",
  checkAuth,
  restrictTo("host"),
  checkEventEditable,
  errorAsync(eventController.uploadEventPhotos)
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
 *                       description: 方案名稱
 *                       example: 豪華雙人方案
 *                     price:
 *                       type: number
 *                       description: 原價
 *                       example: 2800
 *                     discounted_price:
 *                       type: number
 *                       description: 折扣價（可省略）
 *                       example: 2500
 *                     people_capacity:
 *                       type: integer
 *                       description: 此方案可容納人數上限
 *                       example: 4
 *                     contents:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: 方案內容陣列
 *                       example: ["含早餐", "附贈帳篷"]
 *                     addons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: 加購品名稱
 *                             example: BBQ 套餐
 *                           price:
 *                             type: number
 *                             description: 加購品價格
 *                             example: 399
 *     responses:
 *       201:
 *         description: 活動方案建立成功，回傳建立的方案資料
 *       400:
 *         description: 請求錯誤，可能原因：缺少活動 ID、plans 陣列為空、方案超過上限
 *       403:
 *         description: 無權限建立此活動方案（非該活動的主辦方）
 *       404:
 *         description: 找不到對應的活動 ID
 *       500:
 *         description: 伺服器內部錯誤（資料庫操作失敗、交易錯誤等）
 */
// 建立活動方案 活動方案內容 活動加購
router.post(
  "/:eventId/plans",
  checkAuth,
  restrictTo("host"),
  checkEventEditable,
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
  checkEventEditable,
  errorAsync(eventController.updateEventPlans)
);

// 刪除活動方案

/**
 * @swagger
 * /api/v1/events/{eventId}/plans/{planId}:
 *   delete:
 *     summary: 刪除活動方案（含內容與加購品）
 *     description: 主辦方可刪除某活動的指定方案，系統會一併刪除該方案下所有內容與加購品。需要登入並具主辦方身份。
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         description: 活動 ID
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: planId
 *         required: true
 *         description: 要刪除的活動方案 ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 成功刪除活動方案
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
 *                   example: 成功刪除活動方案
 *       400:
 *         description: 請求錯誤，例如驗證失敗或資料不完整
 *       403:
 *         description: 無權限操作此活動的方案
 *       404:
 *         description: 找不到活動或方案
 *       500:
 *         description: 系統錯誤
 */
router.delete(
  "/:eventId/plans/:planId",
  checkAuth,
  restrictTo("host"),
  checkEventEditable,
  errorAsync(eventController.deleteEventPlan)
);

/**
 * @swagger
 * /api/v1/events/{eventId}/submit:
 *   patch:
 *     summary: 提交活動送審（草稿 ➝ 待審核）
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       主辦方將自己草稿狀態的活動提交送審，僅限登入身份為主辦方的會員操作。<br>
 *       若活動已上架、已下架、或非草稿狀態，將無法提交。<br>
 *       系統也會檢查活動時間是否過期與基本資訊是否齊全（如標題、時間）。
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 要提交的活動 ID
 *     responses:
 *       200:
 *         description: 活動已成功提交送審
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
 *                   example: 活動已提交審核，請等待審核結果
 *                 data:
 *                   type: object
 *                   properties:
 *                     eventId:
 *                       type: string
 *                       example: "c7e8aa29-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
 *                     status:
 *                       type: string
 *                       example: pending
 *       400:
 *         description: |
 *           無法提交活動審核，可能原因包含：
 *           - 活動已上架（published）
 *           - 活動已下架（archived）
 *           - 活動狀態非草稿（非 draft）
 *           - 活動時間設定錯誤或已過期
 *           - 缺少必要資訊（如標題、開始時間、結束時間）
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
 *                   example: 該活動已經上架
 *       403:
 *         description: 僅限該活動的主辦方操作
 *       404:
 *         description: 找不到對應的活動
 */

router.patch(
  "/:eventId/submit",
  checkAuth,
  restrictTo("host"),
  errorAsync(eventController.submitEvent)
);

/**
 * @swagger
 * /api/v1/events/recommend:
 *   get:
 *     summary: 取得推薦活動（依縣市分類）與熱門活動
 *     tags: [Events]
 *     description: >
 *       根據活動地址中的縣市名稱進行分類，回傳所有已發布的推薦活動，
 *       並同時回傳最多人報名的熱門活動（最多六筆）。
 *       若熱門活動不足六筆，則會補上隨機活動。
 *     responses:
 *       200:
 *         description: 成功取得推薦活動與熱門活動
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
 *                   example: 取得推薦活動成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     groupedEvents:
 *                       type: object
 *                       description: 依縣市分類的推薦活動列表
 *                       example:
 *                         台北:
 *                           - id: "3a325cbd-04b2-4373-94ba-b03041fa9bcb"
 *                             title: "2025 復興區角板山sisi露營派對3"
 *                             description: "和sisi，一起來狂野露營！上山下水都奉陪3"
 *                             photos: []
 *                           - id: "953fc991-8a85-4726-99df-11922bb423a5"
 *                             title: "2025 復興區角板山sisi露營派對1"
 *                             description: "和sisi，一起來狂野露營！上山下水都奉陪1"
 *                             photos: []
 *                         宜蘭:
 *                           - id: "1c362f8e-1e42-44d5-9bc7-30d5c431f766"
 *                             title: "2025 復興區角板山sisi露營派對yo"
 *                             description: "和sisi，一起來狂野露營！上山下水都奉陪yo"
 *                             photos: []
 *                     popularEvents:
 *                       type: array
 *                       description: 熱門活動（最多六筆）
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "a1b2c3d4-5678-90ab-cdef-1234567890ab"
 *                           title:
 *                             type: string
 *                             example: "2025 熱門露營活動"
 *                           description:
 *                             type: string
 *                             example: "熱門活動說明"
 *                           start_time:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-08-20T02:00:00.000Z"
 *                           end_time:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-08-21T08:00:00.000Z"
 *                           total_signup:
 *                             type: integer
 *                             example: 150
 *                           max_participants:
 *                             type: integer
 *                             example: 300
 *                           photos:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["https://example.com/photo1.jpg"]
 *       500:
 *         description: 伺服器錯誤，請稍後再試
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
router.get("/recommend", errorAsync(eventController.recommendEvents));

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

/**
 * @swagger
 * /api/v1/events:
 *   get:
 *     summary: 取得公開活動列表（支援篩選與分頁）
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: start_time
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 活動開始時間（ISO 格式）
 *       - in: query
 *         name: end_time
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 活動結束時間（ISO 格式）
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: 活動地點關鍵字（模糊搜尋）
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: integer
 *         description: 最低價格
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: integer
 *         description: 最高價格
 *       - in: query
 *         name: people
 *         schema:
 *           type: integer
 *         description: 人數關鍵字
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 當前頁碼（預設為 1）
 *       - in: query
 *         name: per
 *         schema:
 *           type: integer
 *         description: 每頁筆數（預設為 10）
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: 排序方式（asc 或 desc）
 *     responses:
 *       200:
 *         description: 成功取得活動列表
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
 *                   example: 取得活動成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         per:
 *                           type: integer
 *                           example: 10
 *                         total:
 *                           type: integer
 *                           example: 50
 *                         total_pages:
 *                           type: integer
 *                           example: 5
 *                         sort:
 *                           type: string
 *                           example: asc
 *                     events:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "123e4567-e89b-12d3-a456-426614174000"
 *                           title:
 *                             type: string
 *                             example: "登山健行活動"
 *                           start_time:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-08-01T10:00:00.000Z"
 *                           end_time:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-08-01T16:00:00.000Z"
 *                           address:
 *                             type: string
 *                             example: "台北市信義區信義路五段7號"
 *                           price:
 *                             type: string
 *                             example: "1500"
 *                           people:
 *                             type: integer
 *                             example: 4
 *                             description: 活動可容納人數
 *                           photos:
 *                             type: array
 *                             items:
 *                               type: string
 *                               example: "https://example.com/photo.jpg"
 *                           tags:
 *                             type: array
 *                             items:
 *                               type: string
 *                               example: "戶外活動"
 *       400:
 *         description: 參數格式錯誤
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
 *                   example: 參數格式錯誤，請確認填寫正確
 *       500:
 *         description: 伺服器錯誤，請稍後再試
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
router.get("/", errorAsync(eventController.getEvents));

/**
 * @swagger
 * /api/v1/events/map/live_map:
 *   get:
 *     summary: 取得所有上架活動的地理座標資訊
 *     tags: [Events]
 *     description: 回傳所有 `active = published` 的活動，包含標題、地點、狀態與起訖時間等資訊，用於地圖顯示。
 *     responses:
 *       200:
 *         description: 成功取得動態地圖活動資料
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
 *                   example: 取得動態地圖成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     events:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: 16ac7827-b6e0-4cbc-9140-4661e7d33588
 *                           title:
 *                             type: string
 *                             example: 2025 復興區角板山sisi露營派對
 *                           latitude:
 *                             type: number
 *                             format: float
 *                             example: 24.8162611
 *                           longitude:
 *                             type: number
 *                             format: float
 *                             example: 121.3488891
 *                           status:
 *                             type: string
 *                             enum: [preparing, registering, expired, full]
 *                             example: registering
 *                           start_time:
 *                             type: string
 *                             format: date-time
 *                             example: 2025-07-20T08:00:00.000Z
 *                           end_time:
 *                             type: string
 *                             format: date-time
 *                             example: 2025-07-21T17:00:00.000Z
 *                           address:
 *                             type: string
 *                             example: 桃園市復興區角板山1號
 *       500:
 *         description: 伺服器錯誤，請稍後再試
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
router.get("/map/live_map", errorAsync(eventController.getLiveMapEvents));

// eventId = eventInfoId

router.post("/:eventId/comments", checkAuth, errorAsync(eventController.postEventComment));

router.get("/:eventId/comments", errorAsync(eventController.getEventComment));

router.delete("/:eventId/favorites", checkAuth, errorAsync(eventController.deleteEventFavorite));

router.post("/:eventId/favorites", checkAuth, errorAsync(eventController.postEventFavorite));

module.exports = router;
