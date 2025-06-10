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
const nodemailer = require("nodemailer");
const { uploadImageFile, ALLOWED_FILE_TYPES } = require("../utils/uploadImage");
const os = require("os");

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

    if (
      isUndefined(order.merchantTradeNo) ||
      isNotValidString(order.merchantTradeNo) ||
      isUndefined(order.total_price) ||
      isNotValidInteger(order.total_price) ||
      isUndefined(order.eventPlan.title) ||
      isNotValidString(order.eventPlan.title)
    ) {
      return next(appError(400, "欄位未填寫正確"));
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

    // 1. 取得訂單
    const orderRepo = dataSource.getRepository("OrderInfo");
    const orderPayRepo = dataSource.getRepository("OrderPay");
    const order = await orderRepo.findOne({
      where: {
        merchantTradeNo: data.MerchantTradeNo,
      },
    });

    console.warn("確認交易正確性：", CheckMacValue === checkValue, CheckMacValue, checkValue);

    // 2. 建立付款資料
    await orderPayRepo.save({
      order_info_id: order.id,
      method: data.PaymentType,
      gateway: "ecpay",
      amount: data.TradeAmt,
      transaction_id: data.TradeNo,
      paid_at: new Date(data.PaymentDate),
    });

    // 3. 如果訂單成功付款，則更新訂單狀態
    if (String(data.RtnCode) === "1") {
      order.status = "已付款";
      await orderRepo.save(order);
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

    const payRecord = await orderPayRepo.findOne({ where: { order_info_id: orderId } });
    if (!payRecord) return next(appError(404, "找不到付款紀錄"));
    if (payRecord.refund_at) {
      return next(appError(400, "該訂單已退款"));
    }
    payRecord.refund_at = new Date();
    await orderPayRepo.save(payRecord);

    order.status = "已退款";
    await orderRepo.save(order);

    return res.status(200).json({
      status: "success",
      message: "退款成功",
      data: {
        orderId: order.id,
        refundedAt: payRecord.refund_at,
      },
    });

  },
  
  <<<<<<< feature/bk-rubio/new_order_ticket

  async getMemberOrder(req, res, next) {
    const memberId = req.user?.id;

    if (!memberId) {
      return next(appError(401, "請先登入會員"));
    }

    const OrderRepo = dataSource.getRepository("OrderInfo");

    try {
      const existOrder = await OrderRepo.find({
        where: { member_info_id: memberId },
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
        return res.status(200).json({ msg: "已產生票券", ticket: existedTicket });
      }

      const ticketCode = uuid().replace(/-/g, "").slice(0, 20).toUpperCase();
      const fileName = `${ticketCode}.png`;

      const qrContent = JSON.stringify({
        order_id: order.id,
        plan_id: order.event_plan_id,
        quantity: order.quantity,
        total_price: order.total_price,
      });

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

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // 設定寄信內容：內嵌 + 附件
      const mailOptions = {
        from: `活動票券中心 <${process.env.SMTP_USER}>`,
        to: memberEmail,
        subject: "您的活動票券已產生",
        html: `
        <p>親愛的會員您好，</p>
        <p>以下是您訂單 <b>${orderId}</b> 的票券資訊：</p>
        <p><b>票券代碼：</b>${ticketCode}</p>
        <p><b>活動名稱：</b>${order.eventPlanBox?.title || "未命名活動"}</p>
        <p><img src="${imageUrl}" alt="QRCode" width="240"/></p>
        <p><a href="${imageUrl}">若無法顯示請點此開啟 QRCode</a></p>
      `,
      };

      await transporter.sendMail(mailOptions);

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

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: `活動票券中心 <${process.env.SMTP_USER}>`,
        to: memberEmail,
        subject: "您的活動票券資訊",
        html: `
        <p>親愛的會員您好，</p>
        <p>以下是您訂單 <b>${orderId}</b> 的票券資訊：</p>
        <p><b>票券代碼：</b>${ticket.ticket_code}</p>
        <p><b>活動名稱：</b>${order.eventPlanBox?.title || "未命名活動"}</p>
        <p><img src="${ticket.qr_image_uri}" alt="QRCode" width="240"/></p>
        <p><a href="${ticket.qr_image_uri}">若無法顯示請點此開啟 QRCode</a></p>
      `,
      };

      await transporter.sendMail(mailOptions);
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
};

module.exports = orderController;
