const ecpay_payment = require("ecpay_aio_nodejs");
const { dataSource } = require("../db/data-source");
const dayjs = require("dayjs");
const { isUndefined, isNotValidString, isNotValidInteger } = require("../utils/validUtils");
const appError = require("../utils/appError");
require("dotenv").config();
const QRCode = require("qrcode");
const { v4: uuid } = require("uuid");
const fs = require("fs").promises;
const path = require("path");
const logger = require("../utils/logger")("Order");
const { Not, IsNull: TypeORMIsNull } = require("typeorm");

const { uploadImageFile, ALLOWED_FILE_TYPES } = require("../utils/uploadImage");
const os = require("os");
const { In } = require("typeorm");
const { sendOrderSuccessEmail } = require("../utils/emailUtils");
const { sendTicketEmail } = require("../utils/emailUtils");
const ALLOWED_STATUSES = ["Unpaid", "Paying", "Paid", "Refunding", "Refunded", "Cancelled"];

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
    let orderIds = req.body.orderIds;

    // 支援單筆字串或多筆陣列
    if (!orderIds) {
      return next(appError(400, "請提供訂單ID"));
    }

    if (typeof orderIds === "string") {
      // 單筆訂單
      orderIds = [orderIds];
    }

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return next(appError(400, "訂單ID格式錯誤"));
    }

    const orderRepo = dataSource.getRepository("OrderInfo");
    const orders = await orderRepo.find({
      where: { id: In(orderIds) },
      relations: ["eventPlanBox"],
    });

    if (orders.length !== orderIds.length) {
      return next(appError(404, "訂單未找到"));
    }

    // 檢查欄位
    for (const order of orders) {
      if (
        (order.merchantTradeNo && isNotValidString(order.merchantTradeNo)) ||
        isUndefined(order.total_price) ||
        isNotValidInteger(order.total_price) ||
        isUndefined(order.eventPlanBox.title) ||
        isNotValidString(order.eventPlanBox.title)
      ) {
        return next(appError(400, "欄位未填寫正確"));
      }
    }

    // 總金額加總
    const totalAmount = orders.reduce((sum, order) => sum + order.total_price, 0);

    // 建立付款單
    const orderPayRepo = dataSource.getRepository("OrderPay");
    const newOrderPay = orderPayRepo.create({
      method: "ecpay",
      gateway: "ecpay",
      amount: totalAmount,
    });
    await orderPayRepo.save(newOrderPay);

    // 產生付款參數
    const MerchantTradeNo = `ORDERPAY${newOrderPay.id.replace(/-/g, "").slice(0, 12)}`;

    // 更新訂單綁定付款ID
    for (const order of orders) {
      order.order_pay_id = newOrderPay.id;
      order.merchantTradeNo = MerchantTradeNo;
      await orderRepo.save(order);
    }

    let base_param = {
      MerchantTradeNo,
      MerchantTradeDate: dayjs().format("YYYY/MM/DD HH:mm:ss"),
      TotalAmount: String(totalAmount),
      TradeDesc: "訂單付款",
      ItemName:
        orders.length === 1
          ? orders[0].eventPlanBox.title
          : orders.map((o) => o.eventPlanBox.title).join("#"),
      ReturnURL: `${process.env.BACKEND_PRO_ORIGIN}/api/v1/member/orders/payment-callback`,
      ClientBackURL: `${process.env.FRONTEND_PRO_ORIGIN}/orders/payment-success?MerchantTradeNo=${MerchantTradeNo}`,
      PaymentType: "aio",
      ChoosePayment: "ALL",
      EncryptType: 1,
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

    // 1. 取得訂單
    const orderRepo = dataSource.getRepository("OrderInfo");
    const orderPayRepo = dataSource.getRepository("OrderPay");
    const orderInfo = await orderRepo.findOne({
      where: {
        merchantTradeNo: data.MerchantTradeNo,
      },
    });
    const orderPay = await orderPayRepo.findOne({
      where: { id: orderInfo.order_pay_id },
    });

    console.warn("確認交易正確性：", CheckMacValue === checkValue, CheckMacValue, checkValue);

    // 2. 建立付款資料
    await orderPayRepo.update(orderPay.id, {
      amount: data.TradeAmt,
      transaction_id: data.TradeNo,
      paid_at: new Date(),
      method: data.PaymentType,
      gateway: "ecpay",
      updated_at: new Date(),
    });

    // 3. 更新所有綁定這筆付款的訂單狀態
    const orders = await orderRepo.find({
      where: { order_pay_id: orderPay.id },
      relations: ["eventPlanBox", "memberBox", "eventPlanBox.eventBox"],
    });

    const orderList = [];
    let email = null;

    // 4. 如果訂單成功付款，則更新訂單狀態
    if (String(data.RtnCode) === "1") {
      for (const order of orders) {
        order.status = "Paid";
        await orderRepo.save(order);

        const event = order.eventPlanBox.eventBox;
        const people = order.eventPlanBox.people_capacity || 1;
        const eventRepo = dataSource.getRepository("EventInfo");
        // 更新活動報名人數
        await eventRepo.increment({ id: event.id }, "total_signup", people);

        // 取得 email
        if (!email) email = order.memberBox?.email;

        // 準備寄信資料
        orderList.push({
          activityName: order.eventPlanBox.title,
          startDate: order.eventPlanBox.eventBox.start_time,
          endDate: order.eventPlanBox.eventBox.end_time,
          amount: order.total_price,
        });
      }

      if (email) {
        await sendOrderSuccessEmail(email, orderList);
      }
    }

    res.send("1|OK");
  },

  async refundPayment(req, res, next) {
    const { orderId } = req.params;
    const orderRepo = dataSource.getRepository("OrderInfo");
    const orderPayRepo = dataSource.getRepository("OrderPay");

    const order = await orderRepo.findOne({ where: { id: orderId } });

    if (!order) {
      return next(appError(404, "找不到訂單"));
    }
    if (order.status === "Refunded" || order.status === "Refunding") {
      return next(
        appError(400, `該訂單已${order.status === "Refunded" ? "退款完成" : "正在退款中"}`)
      );
    }

    const payRecord = await orderPayRepo.findOne({ where: { id: order.order_pay_id } });
    if (!payRecord) return next(appError(404, "找不到付款紀錄"));
    if (payRecord.refund_at) {
      return next(appError(400, "該訂單已全額退款"));
    }

    // 申請退款階段，狀態改成 refunding
    order.status = "Refunding";
    order.refund_amount = order.total_price;
    order.refund_at = new Date();
    await orderRepo.save(order);

    // 1 分鐘後才變成 refunded
    setTimeout(async () => {
      try {
        const freshOrder = await orderRepo.findOne({
          where: { id: orderId },
          relations: ["eventPlanBox", "eventPlanBox.eventBox"],
        });
        freshOrder.status = "Refunded";
        freshOrder.refund_amount = freshOrder.total_price;
        freshOrder.refund_at = new Date();
        await orderRepo.save(freshOrder);

        // 扣除報名人數
        const event = freshOrder.eventPlanBox.eventBox;
        const people = freshOrder.eventPlanBox.people_capacity || 1;

        if (event) {
          const eventRepo = dataSource.getRepository("EventInfo");
          await eventRepo.decrement({ id: event.id }, "total_signup", people);

          // 若是 full，檢查是否可改為 registering
          const updatedEvent = await eventRepo.findOne({ where: { id: event.id } });
          if (
            updatedEvent.status === "full" &&
            updatedEvent.total_signup < updatedEvent.max_participants
          ) {
            updatedEvent.status = "registering";
            await eventRepo.save(updatedEvent);
          }
        }

        // 計算該付款紀錄已退款訂單的退款金額總和
        const refundedOrders = await orderRepo.find({
          where: { order_pay_id: freshOrder.order_pay_id, status: "Refunded" },
        });
        const totalRefunded = refundedOrders.reduce((sum, o) => sum + (o.refund_amount || 0), 0);
        const freshPayRecord = await orderPayRepo.findOne({
          where: { id: freshOrder.order_pay_id },
        });
        if (!freshPayRecord) {
          console.warn("付款紀錄不存在");
          return;
        }
        freshPayRecord.refund_amount = totalRefunded;
        if (freshPayRecord.refund_amount >= freshPayRecord.amount) {
          freshPayRecord.refund_at = new Date();
        }
        await orderPayRepo.save(freshPayRecord);
      } catch (error) {
        console.warn("退款狀態更新失敗:", error);
      }
    }, 60000);

    return res.status(200).json({
      status: "success",
      message: "退款申請已送出，正在處理退款",
      data: {
        orderInfo: {
          id: order.id,
          status: order.status,
          refundAmount: order.refund_amount,
          refundedAt: order.refund_at,
        },
        orderPay: {
          id: payRecord.id,
          paidAmount: payRecord.amount,
          refundAmount: payRecord.refund_amount,
          refundedAt: payRecord.refund_at || null, // 僅全退才會有值
        },
      },
    });
  },

  async getMemberOrder(req, res, next) {
    const memberId = req.user?.id;
    const statusParam = req.params.status || req.query.status;

    if (!memberId) {
      return next(appError(401, "請先登入會員"));
    }

    const OrderRepo = dataSource.getRepository("OrderInfo");

    try {
      let whereClause = { member_info_id: memberId };

      if (statusParam) {
        const statusList = statusParam.split(",").map((s) => s.trim());
        const invalid = statusList.filter((s) => !ALLOWED_STATUSES.includes(s));
        if (invalid.length > 0) {
          return next(appError(400, `無效的狀態參數：${invalid.join(", ")}`));
        }

        whereClause.status = In(statusList);
      }

      const existOrder = await OrderRepo.find({
        where: whereClause,
        relations: {
          eventPlanBox: {
            eventBox: {
              eventPhotoBox: true,
            },
          },
          memberBox: true,
        },
        order: { created_at: "DESC" },
      });

      const formattedOrders = existOrder.map((order) => {
        const eventInfo = order.eventPlanBox?.eventBox;
        const coverPhotos = (order.eventPlanBox?.eventBox?.eventPhotoBox || [])
          .filter((photo) => photo.type === "cover")
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        const latestCoverPhoto = coverPhotos[0] || null;

        return {
          id: order.id,
          event_info: {
            id: eventInfo?.id || null,
            name: eventInfo?.title || null,
            date: eventInfo?.start_time || null,
            image: latestCoverPhoto?.photo_url || null,
          },
          event_plan: {
            id: order.eventPlanBox?.id || null,
            title: order.eventPlanBox?.title || null,
            price: order.eventPlanBox?.price || null,
          },
          quantity: order.quantity,
          total_price: order.total_price,
          book_at: order.book_at,
          created_at: order.created_at,
          event_addons: order.event_addons || [],
          status: order.status,
        };
      });

      return res.status(200).json({
        status: "success",
        message: "會員訂單取得成功",
        data: {
          orders: formattedOrders,
        },
      });
    } catch (err) {
      return next(appError(500, "查詢訂單失敗", err));
    }
  },

  async postMemberOrder(req, res, next) {
    const memberId = req.user?.id;
    if (!memberId) {
      return next(appError(401, "請先登入會員"));
    }

    const { event_plan_id, quantity, event_addons = [] } = req.body;

    const eventPlanRepo = dataSource.getRepository("EventPlan");
    const addonRepo = dataSource.getRepository("EventPlanAddon");
    const verifiedAddons = [];

    try {
      // 查詢活動方案
      const eventPlan = await eventPlanRepo.findOne({ where: { id: event_plan_id } });
      if (!eventPlan) {
        return next(appError(400, "查無此活動方案"));
      }

      // 強制轉型為數字
      const parsedQuantity = Number(quantity);
      const parsedPlanPrice = Number(eventPlan.price);

      if (isNotValidInteger(parsedQuantity) || isNotValidInteger(parsedPlanPrice)) {
        logger.warn("訂單建立失敗：quantity 或 price 格式錯誤", {
          quantity,
          parsedQuantity,
          price: eventPlan.price,
          parsedPlanPrice,
        });
        return next(appError(400, "金額不是整數或者小於等於 0"));
      }

      let addonsTotal = 0;
      if (!Array.isArray(event_addons)) {
        return next(appError(400, "加購項目格式錯誤，應為陣列"));
      }

      // 驗證加購項目
      for (const addon of event_addons) {
        if (!addon.id) {
          return next(appError(400, `加購項目缺少 ID：${JSON.stringify(addon)}`));
        }

        const existAddon = await addonRepo.findOne({ where: { id: addon.id } });
        if (!existAddon) {
          return next(appError(404, `查無加購項目 ID: ${addon.id}`));
        }

        verifiedAddons.push({
          id: existAddon.id,
          name: existAddon.name,
          price: existAddon.price,
        });

        addonsTotal += Number(existAddon.price);
      }

      // 計算總金額
      const totalPrice = parsedPlanPrice * parsedQuantity + addonsTotal;
      logger.debug("總金額計算", {
        parsedPlanPrice,
        parsedQuantity,
        addonsTotal,
        totalPrice,
      });

      const OrderRepo = dataSource.getRepository("OrderInfo");
      const newOrder = OrderRepo.create({
        member_info_id: memberId,
        event_plan_id,
        quantity: parsedQuantity,
        event_addons: verifiedAddons,
        total_price: totalPrice,
      });

      await OrderRepo.save(newOrder);

      return res.status(200).json({
        status: "success",
        message: "會員訂單新增成功",
        data: {
          order_info: {
            orderid: newOrder.id,
            event_plan_id: newOrder.event_plan_id,
            event_title: eventPlan.title,
            event_plan_price: parsedPlanPrice,
            quantity: parsedQuantity,
            total_price: newOrder.total_price,
            book_at: newOrder.book_at,
            created_at: newOrder.created_at,
            event_addons: verifiedAddons,
          },
        },
      });
    } catch (error) {
      logger.error("建立會員訂單時發生錯誤", {
        message: error.message,
        stack: error.stack,
        errorObj: error,
      });
      console.error("建立會員訂單時發生錯誤 >>>", error);
      return next(appError(500, "伺服器錯誤，請稍後再試"));
    }
  },

  async patchMemberOrder(req, res, next) {
    const memberId = req.user.id;
    const orderId = req.params.orderid;

    if (!memberId) {
      return next(appError(401, "請先登入會員"));
    }

    const { event_plan_id, quantity, event_addons = [] } = req.body;
    const orderRepo = dataSource.getRepository("OrderInfo");
    const eventPlanRepo = dataSource.getRepository("EventPlan");
    const addonRepo = dataSource.getRepository("EventPlanAddon");
    const verifiedAddons = [];

    try {
      const patchorder = await orderRepo.findOne({
        where: { id: orderId, member_info_id: memberId },
      });

      if (!patchorder) {
        return next(appError(404, "查無此會員訂單"));
      }

      const eventPlan = await eventPlanRepo.findOne({
        where: { id: event_plan_id },
      });

      if (!eventPlan) {
        logger.warn(`查無此活動方案 event_plan_id: ${event_plan_id}`);
        return next(appError(400, "查無此活動方案"));
      }

      const parsedQuantity = Number(quantity);
      const parsedPlanPrice = Number(eventPlan.price);

      if (isNotValidInteger(parsedQuantity) || isNotValidInteger(parsedPlanPrice)) {
        return next(appError(400, "金額不是整數或者大於0"));
      }

      let addonsTotal = 0;
      if (!Array.isArray(event_addons)) {
        return next(appError(400, "event_addons 必須為陣列"));
      }

      for (const addon of event_addons) {
        if (!addon.id) {
          return next(appError(400, `加購項目 id 格式錯誤：${addon.id}`));
        }

        const existAddon = await addonRepo.findOne({ where: { id: addon.id } });
        if (!existAddon) {
          return next(appError(404, `查無此加購項目 id: ${addon.id}`));
        }

        verifiedAddons.push({
          id: existAddon.id,
          name: existAddon.name,
          price: existAddon.price,
        });

        addonsTotal += existAddon.price;
      }

      patchorder.event_plan_id = event_plan_id;
      patchorder.event_addons = verifiedAddons;
      patchorder.total_price = eventPlan.price * parsedQuantity + addonsTotal;
      patchorder.updated_at = new Date();
      patchorder.quantity = parsedQuantity;
      await orderRepo.save(patchorder);

      return res.status(200).json({
        status: "success",
        message: "會員訂單更新成功",
        data: {
          order_info: {
            orderid: patchorder.id,
            event_plan_id: patchorder.event_plan_id,
            event_title: eventPlan.title,
            event_plan_price: parsedPlanPrice,
            quantity: patchorder.quantity,
            total_price: patchorder.total_price,
            updated_at: patchorder.updated_at,
            event_addons: verifiedAddons,
          },
        },
      });
    } catch (error) {
      console.error("訂單取消失敗:", error);
      return next(appError(500, "伺服器錯誤，請稍後再試"));
    }
  },

  async deleteMemberOrder(req, res, next) {
    const memberId = req.user.id;
    const orderId = req.params.orderid;
    const orderRepo = dataSource.getRepository("OrderInfo");
    const { reason } = req.body;
    if (!memberId) {
      return next(appError(401, "請先登入會員"));
    }

    if (!orderId) {
      return next(appError(400, "請提供訂單 ID"));
    }

    try {
      const order = await orderRepo.findOne({
        where: { id: orderId, member_info_id: memberId },
      });

      if (!order) {
        return next(appError(404, "查無此會員訂單"));
      }

      order.status = "Cancelled";
      order.cancelled_at = new Date();
      order.cancellation_reason = reason || "會員取消訂單";

      await orderRepo.save(order);

      return res.status(200).json({
        status: "success",
        message: "訂單已取消",
        data: {
          id: order.id,
          status: order.status,
          cancelled_at: order.cancelled_at,
          cancellation_reason: order.cancellation_reason,
        },
      });
    } catch (error) {
      console.error("訂單更新失敗:", error);
      return next(appError(500, "伺服器錯誤，請稍後再試"));
    }
  },

  async postOrderTicket(req, res, next) {
    const memberId = req.user.id;
    const orderId = req.params.orderid;

    if (!memberId) {
      return next(appError(401, "請先登入會員"));
    }

    const orderRepo = dataSource.getRepository("OrderInfo");
    const payRepo = dataSource.getRepository("OrderPay");
    const ticketRepo = dataSource.getRepository("OrderTicket");
    const memberRepo = dataSource.getRepository("MemberInfo");

    try {
      const order = await orderRepo.findOne({
        where: { id: orderId, member_info_id: memberId },
        relations: ["eventPlanBox"],
      });

      if (!order) {
        return next(appError(404, "查無此會員訂單"));
      }

      const hasPaid = await payRepo.findOne({
        where: {
          orderInfoBox: { id: orderId },
          paid_at: Not(TypeORMIsNull()),
          refund_at: TypeORMIsNull(),
        },
      });

      if (!hasPaid) {
        return next(appError(400, "訂單尚未付款"));
      }

      const existedTicket = await ticketRepo.findOne({
        where: { orderInfoBox: { id: orderId } },
      });

      if (existedTicket) {
        return res.status(200).json({
          status: "success",
          message: "票券已存在，寄送至會員信箱",
          data: {
            orders: [
              {
                ticket_code: existedTicket.ticket_code,
                event_title: order.eventPlanBox?.title || "未命名活動",
                order_id: orderId,
                quantity: order.quantity,
                total_price: order.total_price,
                issued_at: existedTicket.issued_at,
                qr_image_url: existedTicket.qr_image_url,
                event_plan: {
                  title: order.eventPlanBox?.title,
                  price: order.eventPlanBox?.price,
                  description: order.eventPlanBox?.description,
                },
                event_addons: order.event_addons || [],
              },
            ],
          },
        });
      }

      const ticketCode = uuid().replace(/-/g, "").slice(0, 20).toUpperCase();
      const fileName = `${ticketCode}.png`;

      const qrPayload = { ticket_code: ticketCode };
      //const qrContent = `http://localhost:3000/api/v1/member/orders/ticket/view?q=${encodeURIComponent(JSON.stringify(qrPayload))}`;
      const qrContent = `https://everforest-backend.zeabur.app/api/v1/member/orders/ticket/view?q=${encodeURIComponent(JSON.stringify(qrPayload))}`;

      const qrBuffer = await QRCode.toBuffer(qrContent, {
        errorCorrectionLevel: "M",
        margin: 2,
        scale: 6,
        type: "png",
      });

      const tmpDir = os.tmpdir();
      const tmpFilePath = path.join(tmpDir, fileName);
      await fs.writeFile(tmpFilePath, qrBuffer);

      const imageFile = {
        mimetype: "image/png",
        size: qrBuffer.length,
        filepath: tmpFilePath,
        originalFilename: fileName,
      };

      if (!ALLOWED_FILE_TYPES[imageFile.mimetype]) {
        return next(appError(400, "圖片格式錯誤，僅支援 JPG、PNG 格式"));
      }

      const imageUrl = await uploadImageFile(imageFile, "event-detail");
      await fs.unlink(tmpFilePath);

      const qrDataUri = await QRCode.toDataURL(qrContent);

      const ticket = ticketRepo.create({
        ticket_code: ticketCode,
        qr_data_uri: qrDataUri,
        qr_image_url: imageUrl,
        issued_at: new Date(),
        orderInfoBox: order,
      });

      await ticketRepo.save(ticket);

      const member = await memberRepo.findOne({ where: { id: memberId } });
      const memberEmail = member?.email;
      if (!memberEmail) {
        return next(appError(400, "找不到會員信箱"));
      }

      await sendTicketEmail({
        toEmail: memberEmail,
        orderId,
        ticketCode: ticket.ticket_code,
        eventTitle: order.eventPlanBox?.title || "未命名活動",
        qrImageUrl: ticket.qr_image_url,
      });

      res.status(201).json({
        status: "success",
        message: "票券已成功產生並寄送至會員信箱",
        data: {
          orders: [
            {
              ticket_code: ticket.ticket_code,
              event_title: order.eventPlanBox?.title || "未命名活動",
              order_id: orderId,
              quantity: order.quantity,
              total_price: order.total_price,
              issued_at: ticket.issued_at,
              qr_image_url: ticket.qr_image_url,
              event_plan: {
                title: order.eventPlanBox?.title,
                price: order.eventPlanBox?.price,
                description: order.eventPlanBox?.description,
              },
              event_addons: order.event_addons || [],
            },
          ],
        },
      });
    } catch (error) {
      logger.error("產生票券失敗", {
        message: error.message,
        stack: error.stack,
        errorObj: error,
      });
      console.error("產生票券失敗 >>>", error);
      return next(appError(500, "伺服器錯誤，請稍後再試"));
    }
  },

  async getOrderTicket(req, res, next) {
    const memberId = req.user.id;
    const orderId = req.params.orderid;
    const ticketRepo = dataSource.getRepository("OrderTicket");
    const orderRepo = dataSource.getRepository("OrderInfo");
    const memberRepo = dataSource.getRepository("MemberInfo");

    try {
      const ticket = await ticketRepo.findOne({
        where: { orderInfoBox: { id: orderId } },
        relations: ["orderInfoBox"],
      });

      if (!ticket) {
        return next(appError(404, "查無此票券"));
      }

      const order = await orderRepo.findOne({
        where: { id: orderId, member_info_id: memberId },
        relations: ["eventPlanBox"],
      });

      if (!order) {
        return next(appError(404, "查無此會員訂單"));
      }

      const member = await memberRepo.findOne({ where: { id: memberId } });
      const memberEmail = member?.email;
      if (!memberEmail) {
        return next(appError(400, "找不到會員信箱"));
      }

      await sendTicketEmail({
        toEmail: memberEmail,
        orderId,
        ticketCode: ticket.ticket_code,
        eventTitle: order.eventPlanBox?.title || "未命名活動",
        qrImageUrl: ticket.qr_image_url,
      });

      res.status(200).json({
        status: "success",
        message: "票券已寄送至您的信箱",
        data: {
          orders: [
            {
              ticket_code: ticket.ticket_code,
              event_title: order.eventPlanBox?.title || "未命名活動",
              order_id: orderId,
              quantity: order.quantity,
              total_price: order.total_price,
              issued_at: ticket.issued_at,
              qr_image_url: ticket.qr_image_url,
              event_plan: {
                title: order.eventPlanBox?.title,
                price: order.eventPlanBox?.price,
                description: order.eventPlanBox?.description,
              },
              event_addons: order.event_addons || [],
            },
          ],
        },
      });
    } catch (error) {
      logger.error("取得票券失敗", {
        message: error.message,
        stack: error.stack,
        errorObj: error,
      });
      console.error("取得票券失敗 >>>", error);
      return next(appError(500, "伺服器錯誤，請稍後再試"));
    }
  },

  async verifyTicket(req, res, next) {
    const { ticket_code } = req.body;
    const ticketRepo = dataSource.getRepository("OrderTicket");
    const ticket = await ticketRepo.findOne({
      where: { ticket_code },
    });

    if (!ticket) {
      return next(appError(404, "找不到票券"));
    }

    if (ticket.status === "已使用") {
      return next(appError(400, "票券已使用，無法再次核銷"));
    }

    if (ticket.status === "有效") {
      // ✅ 更新票券狀態為已使用
      ticket.status = "已使用";
      ticket.used_at = new Date();
      await ticketRepo.save(ticket);
      return res.status(200).json({
        status: "success",
        message: "票券已成功核銷",
        data: {
          ticket_code: ticket.ticket_code,
          used_at: ticket.used_at,
        },
      });
    }
  },

  async viewTicketPage(req, res) {
    try {
      const { q } = req.query;
      if (!q) return res.status(400).send("❌ 無效票券資訊");

      const { ticket_code } = JSON.parse(decodeURIComponent(q));

      const ticketRepo = dataSource.getRepository("OrderTicket");
      const ticket = await ticketRepo.findOne({
        where: { ticket_code },
        relations: ["orderInfoBox", "orderInfoBox.eventPlanBox"],
      });

      if (!ticket) return res.status(404).send("❌ 找不到票券");

      const eventTitle = ticket.orderInfoBox?.eventPlanBox?.title || "未命名活動";
      const createdAt = ticket.created_at?.toLocaleString() || "未知";
      const usedAt = ticket.used_at?.toLocaleString() || "尚未使用";

      const statusDisplay =
        {
          有效: '<span class="status-valid">有效</span>',
          已使用: '<span class="status-used">已使用 ✅</span>',
          作廢: '<span class="status-void">作廢 ❌</span>',
        }[ticket.status] || '<span style="color: gray;">未知狀態</span>';

      const html = `
        <!DOCTYPE html>
        <html lang="zh-Hant">
        <head>
          <meta charset="UTF-8" />
          <title>票券資訊</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              background: #f0f0f0;
              padding: 0;
              margin: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
            }
            .card {
              background: white;
              padding: 32px;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              max-width: 480px;
              width: 90%;
              text-align: center;
            }
            h2 {
              margin-bottom: 24px;
            }
            .info {
              margin-bottom: 12px;
              font-size: 16px;
              text-align: left;
            }
            .label {
              font-weight: bold;
            }
            .status-valid {
              color: orange;
              font-weight: bold;
            }
            .status-used {
              color: green;
              font-weight: bold;
            }
            .status-void {
              color: red;
              font-weight: bold;
            }
            .note {
              margin-top: 20px;
              font-size: 14px;
              color: #666;
            }
            .btn {
              display: inline-block;
              margin-top: 28px;
              padding: 12px 20px;
              font-size: 16px;
              background-color: #007BFF;
              color: white;
              border: none;
              border-radius: 8px;
              text-decoration: none;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>🎫 票券資訊</h2>

            <div class="info"><span class="label">活動名稱：</span> ${eventTitle}</div>
            <div class="info"><span class="label">票券代碼：</span> ${ticket.ticket_code}</div>
            <div class="info"><span class="label">狀態：</span> ${statusDisplay}</div>
            <div class="info"><span class="label">發出時間：</span> ${createdAt}</div>
            <div class="info"><span class="label">使用時間：</span> ${usedAt}</div>

            <div class="note">此票券僅限本人使用，請勿截圖或轉傳他人</div>

            ${
              ticket.status === "有效"
                ? `<form id="verify-form">
                    <input type="hidden" name="ticket_code" value="${ticket.ticket_code}">
                    <button type="submit" class="btn">✅ 使用票券</button>
                  </form>`
                : ""
            }
          </div>

          ${
            ticket.status === "有效"
              ? `<script>
                  document.getElementById("verify-form")?.addEventListener("submit", async function(e) {
                    e.preventDefault();
                    const ticketCode = e.target.ticket_code.value;

                    const res = await fetch("https://everforest-backend.zeabur.app/api/v1/member/orders/verify-ticket", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ticket_code: ticketCode }),
                      credentials: "include", // ✅ 若使用 cookie/token 認證，這一定要加
                    });

                    const result = await res.json();
                    if (res.ok) {
                      alert("✅ 票券核銷成功！");
                      location.reload();
                    } else {
                      alert("❌ 核銷失敗：" + (result.message || "未知錯誤"));
                    }
                  });
                </script>`
              : ""
          }

        </body>
        </html>
      `;

      res.setHeader("Content-Type", "text/html");
      res.send(html);
    } catch (err) {
      console.error("ticket view error:", err);
      res.status(500).send("❌ 系統錯誤");
    }
  },
};

module.exports = orderController;
