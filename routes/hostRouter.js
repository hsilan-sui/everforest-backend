const express = require("express");
const router = express.Router();
//引入checkAuth middlewares
const checkAuth = require("../middlewares/checkAuth");
const { restrictTo } = require("../middlewares/restrictTo");
const errorAsync = require("../utils/errorAsync");

const hostController = require("../controllers/hostController");

//創建主辦方資料
/**
 * @swagger
 * /host/profile:
 *   post:
 *     summary: 創建主辦方資料
 *     tags: [Host 主辦方控制台]
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       會員登入後可建立主辦方資料，並同時將會員角色升級為 `host`。此 API 會設定新的 `access_token` Cookie，供後續主辦方權限使用。
 *
 *       📌 建立成功後會回傳主辦方資料並升級會員角色。
 *
 *       ⚠️ 請確保已登入會員，且請求包含身份驗證 Cookie（access_token）。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - photo_url
 *             properties:
 *               name:
 *                 type: string
 *                 example: 山野露營俱樂部
 *               description:
 *                 type: string
 *                 example: 喜歡在山林間露營的團隊，歡迎加入我們！
 *               email:
 *                 type: string
 *                 example: host@example.com
 *               phone:
 *                 type: string
 *                 example: 0912345678
 *               photo_url:
 *                 type: string
 *                 example: https://cdn.yourdomain.com/uploads/host/photo/abc123.jpg
 *               photo_background_url:
 *                 type: string
 *                 example: https://cdn.yourdomain.com/uploads/host/bg/def456.jpg
 *     responses:
 *       201:
 *         description: 主辦方資料建立成功
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
 *                   example: 主辦方資料建立成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     host_info:
 *                       type: object
 *                       properties:
 *                         memberId:
 *                           type: string
 *                           example: 1c8da31a-5fd2-44f3-897e-4a259e7ec62b
 *                         role:
 *                           type: string
 *                           example: host
 *                         name:
 *                           type: string
 *                           example: 山野露營俱樂部
 *                         description:
 *                           type: string
 *                           example: 喜歡在山林間露營的團隊，歡迎加入我們！
 *                         email:
 *                           type: string
 *                           example: host@example.com
 *                         phone:
 *                           type: string
 *                           example: 0912345678
 *                         photo_url:
 *                           type: string
 *                           example: https://cdn.yourdomain.com/uploads/host/photo/abc123.jpg
 *                         photo_background_url:
 *                           type: string
 *                           example: https://cdn.yourdomain.com/uploads/host/bg/def456.jpg
 *       400:
 *         description: 缺少必填欄位
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
 *                   example: 請填寫主辦方名稱、電話、Email、大頭貼等必填欄位
 *       401:
 *         description: 未登入會員
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
 *       409:
 *         description: 已建立過主辦方資料
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
 *                   example: 您已經創建過主辦方資料
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

router.post("/profile", checkAuth, errorAsync(hostController.postHostProfile));

//取得主辦方資料
/**
 * @swagger
 * /host/profile:
 *   get:
 *     summary: 取得主辦方資料
 *     tags: [Host 主辦方控制台]
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       取得目前登入主辦方的詳細資料，包含關聯的會員角色資訊。
 *
 *       📌 僅限已登入且身份為 `host` 的會員存取。
 *
 *       ⚠️ 請確保請求附帶身份驗證 Cookie（access_token）。
 *     responses:
 *       200:
 *         description: 取得主辦方資料成功
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
 *                   example: 取得主辦方資料成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     host_info:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: 8f6c39a7-345f-48b0-a168-7a733004c1cf
 *                         member_id:
 *                           type: string
 *                           example: 1c8da31a-5fd2-44f3-897e-4a259e7ec62b
 *                         role:
 *                           type: string
 *                           example: host
 *                         name:
 *                           type: string
 *                           example: 山野露營俱樂部
 *                         description:
 *                           type: string
 *                           example: 喜歡在山林間露營的團隊，歡迎加入我們！
 *                         verification_status:
 *                           type: string
 *                           example: pending
 *                         phone:
 *                           type: string
 *                           example: 0912345678
 *                         email:
 *                           type: string
 *                           example: host@example.com
 *                         photo_url:
 *                           type: string
 *                           example: https://cdn.yourdomain.com/uploads/host/photo/abc123.jpg
 *                         photo_background_url:
 *                           type: string
 *                           example: https://cdn.yourdomain.com/uploads/host/bg/def456.jpg
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           example: 2025-04-17T08:00:00.000Z
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                           example: 2025-04-17T08:00:00.000Z
 *       401:
 *         description: 未登入會員
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
 *       404:
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
 *                   example: 伺服器錯誤，無法取得主辦方資料
 */

router.get("/profile", checkAuth, restrictTo("host"), errorAsync(hostController.getHostProfile));

/**
 * @swagger
 * /host/profile:
 *   patch:
 *     summary: 更新主辦方資料
 *     tags: [Host 主辦方控制台]
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       已登入且為主辦方的會員可更新自己的主辦方資料，包含：
 *
 *       - 主辦方名稱
 *       - 電話（會檢查是否與其他主辦方重複）
 *       - Email（會檢查是否與其他主辦方重複）
 *       - 活動簡介描述
 *       - 大頭貼與背景圖片 URL
 *
 *       ⚠️ 僅允許更新自己的資料，且欄位需為有效字串。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 山野露營俱樂部（新名稱）
 *               description:
 *                 type: string
 *                 example: 更新後的主辦方描述
 *               email:
 *                 type: string
 *                 example: newhost@example.com
 *               phone:
 *                 type: string
 *                 example: 0988123456
 *               photo_url:
 *                 type: string
 *                 example: https://cdn.yourdomain.com/uploads/host/photo/newabc123.jpg
 *               photo_background_url:
 *                 type: string
 *                 example: https://cdn.yourdomain.com/uploads/host/bg/newbg456.jpg
 *     responses:
 *       200:
 *         description: 主辦方資料更新成功
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
 *                   example: 主辦方資料更新成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     host_info:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: 8f6c39a7-345f-48b0-a168-7a733004c1cf
 *                         member_id:
 *                           type: string
 *                           example: 1c8da31a-5fd2-44f3-897e-4a259e7ec62b
 *                         name:
 *                           type: string
 *                           example: 山野露營俱樂部（新名稱）
 *                         description:
 *                           type: string
 *                           example: 更新後的主辦方描述
 *                         email:
 *                           type: string
 *                           example: newhost@example.com
 *                         phone:
 *                           type: string
 *                           example: 0988123456
 *                         photo_url:
 *                           type: string
 *                           example: https://cdn.yourdomain.com/uploads/host/photo/newabc123.jpg
 *                         photo_background_url:
 *                           type: string
 *                           example: https://cdn.yourdomain.com/uploads/host/bg/newbg456.jpg
 *                         verification_status:
 *                           type: string
 *                           example: pending
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                           example: 2025-04-17T10:00:00.000Z
 *       400:
 *         description: 資料驗證錯誤（如 Email 或電話重複）
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
 *                   example: 此 Email 已被其他主辦方使用
 *       401:
 *         description: 未登入或身分錯誤
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
 *       404:
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
 *                   example: 伺服器錯誤，無法更新主辦方資料
 */

router.patch(
  "/profile",
  checkAuth,
  restrictTo("host"),
  errorAsync(hostController.patchHostProfile)
);
module.exports = router;
