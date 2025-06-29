const express = require("express");
const router = express.Router();
//引入checkAuth middlewares
const checkAuth = require("../middlewares/checkAuth");
const errorAsync = require("../utils/errorAsync");
const orderController = require("../controllers/orderController");

/**
 * @swagger
 * /api/v1/member/orders/payment:
 *   post:
 *     summary: 處理訂單付款
 *     description: |
 *       此 API 用於處理訂單的付款，會生成一個付款表單並回傳給前端，前端可使用該表單進行付款。
 *       需要身份驗證，使用者必須先登入。
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderIds
 *             properties:
 *               orderIds:
 *                 type: array
 *                 description: 多筆訂單的唯一識別碼陣列
 *                 items:
 *                   type: string
 *                 example:
 *                   - "37a76112-d82e-41da-a459-5cdff0e7571b"
 *                   - "b0ac1202-9840-4a8d-8d7c-b6e7ed7a5857"
 *     responses:
 *       200:
 *         description: 成功生成付款表單
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
 *                   example: 生成表單成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     html:
 *                       type: string
 *                       example: "<form action='https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5' method='POST' name='payment' style='display:none;'>..."
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
 *       404:
 *         description: 訂單未找到
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
 *                   example: 訂單未找到
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
 *                   example: 伺服器錯誤
 */
router.post("/payment", checkAuth, errorAsync(orderController.postPayment));

/**
 * @swagger
 * /api/v1/member/orders/payment-callback:
 *   post:
 *     summary: 綠界付款回調通知 (ECPay Payment Callback)
 *     description: |
 *       此 API 接收綠界的付款結果通知。系統會驗證資料正確性（如 CheckMacValue），
 *       並根據 `RtnCode` 決定是否更新訂單與付款紀錄。
 *
 *       綠界要求系統回傳：
 *       - `1|OK`：處理成功
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               CheckMacValue:
 *                 type: string
 *               MerchantTradeNo:
 *                 type: string
 *               PaymentType:
 *                 type: string
 *               TradeAmt:
 *                 type: integer
 *               TradeNo:
 *                 type: string
 *               PaymentDate:
 *                 type: string
 *               RtnCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: |
 *           綠界回調回應（純文字）：
 *           - 成功時回傳 `1|OK`
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: 1|OK
 */
router.post("/payment-callback", errorAsync(orderController.postPaymentCallback));

/**
 * @swagger
 * /api/v1/member/order/{orderId}/refund:
 *   post:
 *     summary: 申請訂單退款
 *     tags: [Orders]
 *     description: |
 *       根據指定的訂單 ID，申請退款。退款申請送出後，訂單狀態會變為 **Refunding**（退款中），
 *       系統會在約 1 分鐘後自動更新為 **Refunded**（退款完成）。
 *       同時會更新該付款紀錄中所有已退款訂單的退款金額加總，判斷付款是否已全額退款。
 *
 *       使用說明：
 *       - `orderInfo` 反映單筆訂單退款狀態、退款金額與退款時間。
 *       - 部分訂單退款時，`orderPay.refundedAt` 為 `null`，退款金額為該付款下已退款訂單的總和。
 *       - 全額退款時，`orderPay.refundedAt` 會顯示付款退款完成時間。
 *
 *       📌 僅限管理員或系統操作使用。
 *       ⚠️ 請確認該筆訂單已付款，且尚未退款或退款中。
 *     parameters:
 *       - name: orderId
 *         in: path
 *         required: true
 *         description: 訂單 ID（UUID 格式）
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "d7353c4f-091e-4d79-b378-d5e6f9846219"
 *     responses:
 *       200:
 *         description: 退款申請成功，正在處理退款中
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
 *                   example: 退款申請已送出，正在處理退款
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderInfo:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           example: "d7353c4f-091e-4d79-b378-d5e6f9846219"
 *                         status:
 *                           type: string
 *                           example: "Refunding"
 *                         refundAmount:
 *                           type: number
 *                           example: 1000
 *                         refundedAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-07-23T07:15:00.000Z"
 *                     orderPay:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           example: "a8f5f167-f44f-47bf-beca-94efb3e6bb76"
 *                         paidAmount:
 *                           type: number
 *                           example: 3000
 *                         refundAmount:
 *                           type: number
 *                           example: 1000
 *                         refundedAt:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           example: null
 *       400:
 *         description: 退款失敗（可能已退款或狀態不符合）
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
 *                   example: 該訂單已退款
 *       404:
 *         description: 找不到訂單或付款紀錄
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
 *                   example: 找不到訂單
 *       500:
 *         description: 伺服器錯誤
 */
router.post("/:orderId/refund", errorAsync(orderController.refundPayment));

/**
 * @swagger
 * /api/v1/member/orders:
 *   get:
 *     summary: 取得會員所有訂單（可選擇 status 篩選）
 *     description: 回傳該會員的所有訂單資料，支援用 query string 篩選狀態（例如：status=Paid,Unpaid）
 *     tags:
 *       - Member Orders
 *     security:
 *       - bearerAuth: []  # 需登入驗證
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           example: Paid,Cancelled
 *         description: 用逗號分隔的狀態列表，例如 Paid,Cancelled
 *     responses:
 *       200:
 *         description: 會員訂單取得成功
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
 *                   example: 會員訂單取得成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: 123e4567-e89b-12d3-a456-426614174000
 *                           status:
 *                             type: string
 *                             example: Paid
 *                           event_info:
 *                             type: object
 *                             properties:
 *                               id: { type: string }
 *                               name: { type: string }
 *                               date: { type: string, format: date-time }
 *                               image: { type: string, format: uri }
 *                           event_plan:
 *                             type: object
 *                             properties:
 *                               id: { type: string }
 *                               title: { type: string }
 *                               price: { type: integer }
 *                           quantity:
 *                             type: integer
 *                             example: 2
 *                           total_price:
 *                             type: integer
 *                             example: 1000
 *                           book_at:
 *                             type: string
 *                             format: date-time
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           event_addons:
 *                             type: array
 *                             items: {}
 *       400:
 *         description: 無效的 status 參數
 *       401:
 *         description: 未登入或權限不足
 *       500:
 *         description: 伺服器錯誤
 */
router.get("/", checkAuth, errorAsync(orderController.getMemberOrder));

/**
 * @swagger
 * /api/v1/member/orders/status/{status}:
 *   get:
 *     summary: 依狀態查詢會員訂單
 *     description: 可依指定的 status 值（例如：Paid、Cancelled）取得符合條件的訂單
 *     tags:
 *       - Member Orders
 *     security:
 *       - bearerAuth: []  # 需登入驗證
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           example: Paid,Cancelled
 *         description: 以逗號分隔的狀態值（例如 Paid,Unpaid,Cancelled）
 *     responses:
 *       200:
 *         description: 訂單查詢成功
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
 *                   example: 會員訂單取得成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           status:
 *                             type: string
 *                             example: Paid
 *                           event_info:
 *                             type: object
 *                             properties:
 *                               id: { type: string }
 *                               name: { type: string }
 *                               date: { type: string, format: date-time }
 *                               image: { type: string, format: uri }
 *                           event_plan:
 *                             type: object
 *                             properties:
 *                               id: { type: string }
 *                               title: { type: string }
 *                               price: { type: integer }
 *                           quantity:
 *                             type: integer
 *                           total_price:
 *                             type: integer
 *                           book_at:
 *                             type: string
 *                             format: date-time
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           event_addons:
 *                             type: array
 *                             items: {}
 *       400:
 *         description: 無效的 status 參數
 *       401:
 *         description: 未登入或未授權
 *       500:
 *         description: 查詢失敗（伺服器錯誤）
 */
router.get("/status/:status", checkAuth, errorAsync(orderController.getMemberOrder));

/**
 * @swagger
 * /api/v1/member/orders:
 *   post:
 *     summary: 建立會員訂單
 *     description: 建立一筆新訂單，需提供活動方案 ID、數量、加購項目等資訊
 *     tags:
 *       - Member Orders
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event_plan_id
 *               - quantity
 *               - total_price
 *             properties:
 *               event_plan_id:
 *                 type: string
 *                 format: uuid
 *                 example: d3a9fabc-1e34-4cd9-97f2-521c75f0cb47
 *               quantity:
 *                 type: integer
 *                 example: 2
 *               total_price:
 *                 type: integer
 *                 example: 2000
 *               event_addons:
 *                 type: array
 *                 description: 選填的加購項目（若有）
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: addon-123
 *                     quantity:
 *                       type: integer
 *                       example: 1
 *     responses:
 *       201:
 *         description: 訂單建立成功
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
 *                   example: 訂單已成功建立
 *                 data:
 *                   type: object
 *                   properties:
 *                     order_id:
 *                       type: string
 *                       format: uuid
 *       400:
 *         description: 請求資料錯誤（欄位缺失或格式錯誤）
 *       401:
 *         description: 未登入
 *       500:
 *         description: 建立訂單失敗
 */
router.post("/", checkAuth, errorAsync(orderController.postMemberOrder));

/**
 * @swagger
 * /api/v1/member/orders/{orderid}:
 *   patch:
 *     summary: 修改會員訂單資訊
 *     description: 允許會員更新訂單資料，例如狀態或加購項目等（依照實作限制更新項目）
 *     tags:
 *       - Member Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 訂單 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 description: 要更新的訂單狀態（例如 Paid, Cancelled）
 *                 example: Cancelled
 *               cancellation_reason:
 *                 type: string
 *                 description: 若取消，請填寫取消原因
 *                 example: 用戶自行取消
 *               event_addons:
 *                 type: array
 *                 description: 變更後的加購項目（若允許修改）
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *     responses:
 *       200:
 *         description: 訂單更新成功
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
 *                   example: 訂單已成功更新
 *                 data:
 *                   type: object
 *                   properties:
 *                     order_id:
 *                       type: string
 *       400:
 *         description: 格式錯誤或不允許的變更
 *       401:
 *         description: 未登入或無權限
 *       404:
 *         description: 找不到該筆訂單
 *       500:
 *         description: 更新失敗（伺服器錯誤）
 */
router.patch("/:orderid", checkAuth, errorAsync(orderController.patchMemberOrder));

/**
 * @swagger
 * /api/v1/member/orders/{orderid}:
 *   delete:
 *     summary: 刪除會員訂單
 *     description: 允許會員刪除尚未付款或取消的訂單。不可刪除已付款或已處理中的訂單。
 *     tags:
 *       - Member Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 訂單 ID
 *     responses:
 *       200:
 *         description: 訂單刪除成功
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
 *                   example: 訂單已成功刪除
 *       400:
 *         description: 不可刪除該訂單（例如已付款）
 *       401:
 *         description: 未登入或無權限
 *       404:
 *         description: 找不到該筆訂單
 *       500:
 *         description: 刪除失敗（伺服器錯誤）
 */
router.delete("/:orderid", checkAuth, errorAsync(orderController.deleteMemberOrder));

/**
 * @swagger
 * /api/v1/member/orders/{orderid}/ticket:
 *   post:
 *     summary: 寄送票券到會員信箱
 *     description: 根據指定的訂單 ID，將票券資訊寄送至會員註冊的信箱。
 *     tags:
 *       - Member Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 訂單 ID
 *     responses:
 *       200:
 *         description: 票券已成功寄送至信箱
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
 *                   example: 票券已寄送至您的信箱
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           ticket_code:
 *                             type: string
 *                           event_title:
 *                             type: string
 *                           order_id:
 *                             type: string
 *                           quantity:
 *                             type: integer
 *                           total_price:
 *                             type: integer
 *                           issued_at:
 *                             type: string
 *                             format: date-time
 *                           qr_image_url:
 *                             type: string
 *                             format: uri
 *                           event_plan:
 *                             type: object
 *                             properties:
 *                               title:
 *                                 type: string
 *                               price:
 *                                 type: integer
 *                               description:
 *                                 type: string
 *                           event_addons:
 *                             type: array
 *                             items:
 *                               type: object
 *       400:
 *         description: 找不到會員信箱或其他參數錯誤
 *       401:
 *         description: 未登入或驗證失敗
 *       404:
 *         description: 查無此訂單或票券
 *       500:
 *         description: 寄送失敗（伺服器錯誤）
 */
router.post("/:orderid/ticket", checkAuth, errorAsync(orderController.postOrderTicket));

/**
 * @swagger
 * /api/v1/member/orders/{orderid}/ticket/{ticketid}:
 *   get:
 *     summary: 查詢並寄送單張票券
 *     description: 根據指定的訂單 ID 與票券 ID，查詢票券資訊並寄送至會員信箱。
 *     tags:
 *       - Member Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 訂單 ID
 *       - in: path
 *         name: ticketid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 票券 ID
 *     responses:
 *       200:
 *         description: 成功寄送票券資訊
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
 *                   example: 票券已寄送至您的信箱
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           ticket_code:
 *                             type: string
 *                           event_title:
 *                             type: string
 *                           order_id:
 *                             type: string
 *                           quantity:
 *                             type: integer
 *                           total_price:
 *                             type: integer
 *                           issued_at:
 *                             type: string
 *                             format: date-time
 *                           qr_image_url:
 *                             type: string
 *                             format: uri
 *                           event_plan:
 *                             type: object
 *                             properties:
 *                               title:
 *                                 type: string
 *                               price:
 *                                 type: integer
 *                               description:
 *                                 type: string
 *                           event_addons:
 *                             type: array
 *                             items:
 *                               type: object
 *       400:
 *         description: 找不到會員信箱或參數錯誤
 *       401:
 *         description: 未登入或驗證失敗
 *       404:
 *         description: 找不到該票券或訂單
 *       500:
 *         description: 寄送失敗（伺服器錯誤）
 */
router.get("/:orderid/ticket/:ticketid", checkAuth, errorAsync(orderController.getOrderTicket));

/**
 * @swagger
 * /api/v1/member/orders/verify-ticket:
 *   post:
 *     summary: 票券核銷驗證
 *     description: |
 *       此 API 用於核銷票券。前端傳入票券代碼 (ticket_code)，
 *       後端會檢查票券是否存在及狀態，若票券有效，則更新為已使用並回傳成功訊息。
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticket_code
 *             properties:
 *               ticket_code:
 *                 type: string
 *                 description: 票券代碼
 *                 example: "F05FFA24FABB4BE29D1D"
 *     responses:
 *       200:
 *         description: 票券成功核銷
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
 *                   example: 票券已成功核銷
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticket_code:
 *                       type: string
 *                       example: "F05FFA24FABB4BE29D1D"
 *                     used_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-06-19T04:56:00.000Z"
 *       400:
 *         description: 請求錯誤，票券已使用或其他請求錯誤
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
 *                   example: 票券已使用，無法再次核銷
 *       404:
 *         description: 找不到票券
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
 *                   example: 找不到票券
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
 *                   example: 伺服器錯誤
 */
router.post("/verify-ticket", errorAsync(orderController.verifyTicket));

/**
 * @swagger
 * /api/v1/member/orders/ticket/view:
 *   get:
 *     summary: 顯示票券資訊頁面
 *     description: 透過票券代碼查詢並呈現票券資訊頁面（HTML 格式）
 *     tags:
 *       - 票券 Ticket
 *     parameters:
 *       - name: q
 *         in: query
 *         required: true
 *         description: 票券查詢資訊（包含 ticket_code 的 JSON 字串，經過 encodeURIComponent）
 *         schema:
 *           type: string
 *           example: "%7B%22ticket_code%22%3A%22A9B6B43892BA49AEAED9%22%7D"
 *     responses:
 *       200:
 *         description: 成功回傳票券資訊 HTML 頁面
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: "<!DOCTYPE html>..."
 *       400:
 *         description: 缺少或錯誤的參數
 *       404:
 *         description: 找不到票券
 *       500:
 *         description: 系統錯誤
 */
router.get("/ticket/view", errorAsync(orderController.viewTicketPage));

module.exports = router;
