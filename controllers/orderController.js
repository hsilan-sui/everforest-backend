const ecpay_payment = require("ecpay_aio_nodejs");
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
  async postPayment(req, res) {
    // const orderId = req.params.orderId;
    // 假設從資料庫撈取訂單資料
    // const order = await Order.findById(orderId); // 假設您的訂單模型名稱為 Order
    // if (!order) {
    //     return next(appError(400, "訂單未找到"));
    // }

    let base_param = {
      MerchantTradeNo: "ORDER20250415200001", //請帶20碼uid, ex: f0a0d7e9fae1bb72bc93
      MerchantTradeDate: "2025/04/15 20:30:00",
      TotalAmount: "100",
      TradeDesc: "測試交易描述",
      ItemName: "測試商品等",
      ReturnURL: `${process.env.HOST}/api/v1/member/orders/ORDER20250415200001/payment-callback`,
      ClientBackURL: `${process.env.HOST}`,
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
    delete data.CheckMacValue; // 此段不驗證

    const create = new ecpay_payment(options);
    const checkValue = create.payment_client.helper.gen_chk_mac_value(data);

    // console.log(
    //     '確認交易正確性：',
    //     CheckMacValue === checkValue,
    //     CheckMacValue,
    //     checkValue,
    // );

    if (CheckMacValue === checkValue) {
      // 交易成功後，需要回傳 1|OK 給綠界
      res.send("1|OK");
    } else {
      res.send("0|ERROR");
    }
  },
  async getPaymentCallback(req, res) {
    res.send(`
            <html>
              <head>
                <meta charset="utf-8" />
                <title>付款成功</title>
                <script>
                  window.location.href = "${process.env.HOST}"; 
                </script>
              </head>
              <body>
                <p>訂單編號：ORDER20250415200001</p>
              </body>
            </html>
        `);
  },
};

module.exports = orderController;
