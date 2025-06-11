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
 *     summary: 退款
 *     tags: [Orders]
 *     description: |
 *       根據指定的訂單 ID，進行退款動作，並更新付款與訂單狀態。
 *       📌 僅限管理員或系統操作使用。
 *       ⚠️ 請確認該筆訂單已付款，且尚未退款。
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
 *         description: 退款成功
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
 *                   example: 退款成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                       format: uuid
 *                       example: "d7353c4f-091e-4d79-b378-d5e6f9846219"
 *                     refundedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-07-23T07:15:00.000Z"
 *       400:
 *         description: 無法退款（可能已退款或狀態不符合）
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
router.post("/:orderId/refund", errorAsync(orderController.postPaymentRefund));

router.get("/", checkAuth, errorAsync(orderController.getMemberOrder));

router.post("/", checkAuth, errorAsync(orderController.postMemberOrder));

router.patch("/:orderid", checkAuth, errorAsync(orderController.patchMemberOrder));

router.delete("/:orderid", checkAuth, errorAsync(orderController.deleteMemberOrder));

router.post("/:orderid/ticket", checkAuth, errorAsync(orderController.postOrderTicket));

router.get("/:orderid/ticket/:ticketid", checkAuth, errorAsync(orderController.getOrderTicket));

module.exports = router;
