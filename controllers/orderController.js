const ecpay_payment = require("ecpay_aio_nodejs");
const { dataSource } = require("../db/data-source");
const dayjs = require("dayjs");
const { appError } = require("../utils/appError");
require("dotenv").config();

const options = {
  OperationMode: "Test", //Test or Production
  MercProfile: {
    MerchantID: process.env.MERCHANTID,
    HashKey: process.env.HASHKEY,
    HashIV: process.env.HASHIV,
  },
  IgnorePayment: [],
  IsProjectContractor: false,
};
const orderController = {
  async postPayment(req, res, next) {
    const orderId = req.params.orderId;
    const orderRepo = dataSource.getRepository("OrderInfo");
    const order = await orderRepo.findOne({
      where: {
        id: orderId,
      },
      relations: ["eventPlan"],
    });
    if (!order) {
      return next(appError(404, "訂單未找到"));
    }

    let base_param = {
      MerchantTradeNo: order.merchantTradeNo,
      MerchantTradeDate: dayjs(order.created_at).format("YYYY/MM/DD HH:mm:ss"),
      TotalAmount: order.total_price,
      TradeDesc: "訂單付款",
      ItemName: order.eventPlan.title,
      ReturnURL: `${process.env.DB_HOST}/api/v1/member/orders/${order.id}/payment-callback`,
      ClientBackURL: `${process.env.DB_HOST}`,
    };
    const create = new ecpay_payment(options);

    // 注意：在此事直接提供 html + js 直接觸發的範例，直接從前端觸發付款行為
    const html = create.payment_client.aio_check_out_all(base_param);

    // 回傳表單資料給前端
    res.json({ html });
  },
  async postPaymentCallback(req, res) {
    const { CheckMacValue } = req.body;
    const data = { ...req.body };
    delete data.CheckMacValue;

    const create = new ecpay_payment(options);
    const checkValue = create.payment_client.helper.gen_chk_mac_value(data);

    if (CheckMacValue !== checkValue) {
      return res.send("0|ERROR");
    }

    // 1. 取得訂單
    const orderRepo = dataSource.getRepository("OrderInfo");
    const orderPayRepo = dataSource.getRepository("OrderPay");
    const order = await orderRepo.findOne({
      where: {
        merchantTradeNo: data.MerchantTradeNo,
      },
    });

    if (!order) {
      return res.send("0|ERROR");
    }

    // 2. 建立付款資料
    await orderPayRepo.create({
      order_info_id: order.id,
      method: data.PaymentType,
      gateway: "ecpay",
      status: "已付款",
      amount: data.TradeAmt,
      transaction_id: data.TradeNo,
      paid_at: new Date(data.PaymentDate),
    });

    // 3. 如果訂單成功付款，則更新訂單狀態
    if (data.RtnCode === "1") {
      order.status = "已付款";
      await order.save();
    }

    res.send("1|OK");
  },
  // async getPaymentCallback(req, res) {
  //   res.send(`
  //           <html>
  //             <head>
  //               <meta charset="utf-8" />
  //               <title>付款成功</title>
  //               <script>
  //                 window.location.href = "${process.env.HOST}";
  //               </script>
  //             </head>
  //             <body>
  //               <p>訂單編號：ORDER20250415200001</p>
  //             </body>
  //           </html>
  //       `);
  // },
};

module.exports = orderController;
