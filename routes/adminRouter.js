const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/checkAuth");
const { restrictTo } = require("../middlewares/restrictTo");
const errorAsync = require("../utils/errorAsync");
const adminController = require("../controllers/adminController");

//我想要所有的admin api 都須先通過驗證登入與角色權限
router.use(checkAuth); // 驗證 JWT cookie  // 先驗證是否登入
router.use(restrictTo("admin")); // 限定 admin 存取

/**
 * @swagger
 * tags:
 *   - name: Admin - Events
 *     description: 活動審核與後台管理 API（僅限管理員）
 */

// 取得admin data

/**
 * @swagger
 * /api/admin/me:
 *   get:
 *     summary: 取得目前登入的管理員資料
 *     tags:
 *       - Admin - Events
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       管理員登入後查詢自己的基本資料。<br>
 *       僅限具備 `admin` 權限的使用者，否則將回傳 403。
 *     responses:
 *       200:
 *         description: 查詢成功，回傳管理員資料
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "c7e8aa29-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
 *                     email:
 *                       type: string
 *                       example: admin@example.com
 *                     username:
 *                       type: string
 *                       example: adminUser
 *                     role:
 *                       type: string
 *                       example: admin
 *                     firstname:
 *                       type: string
 *                       example: John
 *                     lastname:
 *                       type: string
 *                       example: Doe
 *       403:
 *         description: 使用者並非管理員，無存取權限
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
 *                   example: 你沒有權限存取此資源
 *       500:
 *         description: 系統錯誤，查詢失敗
 */

router.get("/me", errorAsync(adminController.getAdminData));

//查詢活動列表(支援 EVENT_INFO active狀態) all | draft | pending | published | archived
// 取得所有主辦方辦的活動
//取得待審核的所有活動(可以排序 先 後)
/**
 * @swagger
 * /api/admin/events:
 *   get:
 *     summary: 取得活動清單（依狀態分組）
 *     tags:
 *       - Admin - Events
 *     description: |
 *       管理員後台查詢活動清單，支援依據活動狀態、分頁、排序方式查詢。<br>
 *       若指定 `active=rejected` 則查詢退件活動（實際為 active=draft 且 is_rejected=true）。<br>
 *       回傳每筆活動資料包含封面圖、方案最高價、圖片數量、開始/結束時間、狀態標籤。
 *     parameters:
 *       - in: query
 *         name: active
 *         description: 活動狀態過濾條件
 *         required: false
 *         schema:
 *           type: string
 *           enum: [all, draft, rejected, pending, published, archived]
 *           default: all
 *       - in: query
 *         name: page
 *         description: 分頁頁碼
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         description: 每頁資料筆數
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sort_by
 *         description: 排序欄位（例如 created_at、start_time）
 *         required: false
 *         schema:
 *           type: string
 *           enum: [created_at, start_time, end_time, registration_open_time, registration_close_time, title, updated_at]
 *           default: created_at
 *       - in: query
 *         name: order
 *         description: 排序方式（ASC or DESC）
 *         required: false
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: 查詢成功，回傳活動清單
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 total_data:
 *                   type: integer
 *                   example: 42
 *                 current_page:
 *                   type: integer
 *                   example: 1
 *                 page_size:
 *                   type: integer
 *                   example: 10
 *                 total_page:
 *                   type: integer
 *                   example: 5
 *                 data_lists:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "uuid-123"
 *                       title:
 *                         type: string
 *                         example: "阿姆坪露營騎士行"
 *                       cover_photo_url:
 *                         type: string
 *                         nullable: true
 *                         example: "https://example.com/photo.jpg"
 *                       photo_count:
 *                         type: integer
 *                         example: 5
 *                       start_date:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-07-01T08:00:00.000Z"
 *                       end_date:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-07-03T18:00:00.000Z"
 *                       max_participants:
 *                         type: integer
 *                         example: 30
 *                       max_price:
 *                         type: integer
 *                         nullable: true
 *                         example: 2000
 *                       active_status:
 *                         type: string
 *                         example: "已退回"
 *       400:
 *         description: |
 *           查詢參數錯誤，可能原因包含：
 *           - active 參數不正確（允許值：all, draft, rejected, pending, published, archived）
 *           - sort_by 參數不正確（允許值：created_at, start_time, ...）
 *           - order 參數不是 ASC 或 DESC
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
 *                   example: 無效的狀態
 *       500:
 *         description: 查詢活動失敗
 */

router.get("/events", errorAsync(adminController.getAdminEvents));

//查看單筆活動詳情
// GET /api/admin/events/:id
/**
 * @swagger
 * /api/admin/events/{id}:
 *   get:
 *     summary: 取得指定活動（完整內容）
 *     tags:
 *       - Admin - Events
 *     description: |
 *       管理員後台取得單一活動的完整資料，包含封面圖、方案、加購項目、方案內容等資訊。<br>
 *       同時根據 active 狀態與 is_rejected 判斷並補上統一的狀態標籤（如「已退回」、「已上架」等）。
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 活動 ID（UUID）
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 查詢成功，回傳完整活動資料
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 active_status:
 *                   type: string
 *                   example: 已退回
 *                 data:
 *                   type: object
 *                   description: 活動詳細內容（包含所有關聯資料）
 *       404:
 *         description: 查無此活動
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
 *                   example: 找不到該活動
 *       500:
 *         description: 查詢活動失敗（伺服器錯誤）
 */

router.get("/events/:id", errorAsync(adminController.getAdminEventById));

//PATCH /api/v1/admin/events/:id/approve
//審核成功 → 將活動從 pending 改為 published(也務必確認is_rejected: false)，寄出通知信
////審核通過活動

/**
 * @swagger
 * /api/admin/events/{id}/approve:
 *   patch:
 *     summary: 活動審核通過並上架(上架活動)
 *     tags:
 *       - Admin - Events
 *     description: |
 *       管理員審核通過活動，將其狀態從 `pending` 改為 `published`，並寄送審核成功通知信給主辦方。
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 活動 ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 活動審核通過，已成功上架
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
 *                   example: 活動已通過審核並成功上架
 *       400:
 *         description: |
 *           活動狀態錯誤或主辦方資料不完整（例如不是 pending 狀態或缺 email）
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
 *                   example: 僅可審核狀態為『待審核』的活動
 *       404:
 *         description: 找不到該活動
 *       500:
 *         description: 審核流程錯誤
 */
router.patch("/events/:id/approve", errorAsync(adminController.approveEvent));

//審核不通過活動（可附原因）
/**
 * @swagger
 * /api/admin/events/{id}/reject:
 *   patch:
 *     summary: 活動審核不通過（退回活動）
 *     tags:
 *       - Admin - Events
 *     description: |
 *       管理員退回活動審核，將狀態從 `pending` 改為 `draft`，並設為 `is_rejected=true`。<br>
 *       可選擇性提供退回原因，會寄送通知信給主辦方。
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 活動 ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: 活動資訊缺少地點與報名限制，請補充後再送出審核
 *     responses:
 *       200:
 *         description: 活動已退回並通知主辦方
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 活動審核『不通過』，已退回活動並通知主辦方
 *       400:
 *         description: 僅可退回狀態為 pending 的活動
 *       404:
 *         description: 查無該活動
 *       500:
 *         description: 審核退回流程錯誤
 */
router.patch("/events/:id/reject", errorAsync(adminController.rejectEvent));

//------ AI 審查 ----------
router.post("/events/:id/ai-check", errorAsync(adminController.aiReviewEvent));

//封存已結束或不公開的活動
module.exports = router;
