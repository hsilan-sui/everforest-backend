const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const logger = require("../utils/logger")("member");
const {
  isNotValidString,
  isValidURL,
  isValidDate,
  isNotValidInteger,
} = require("../utils/validUtils");
const formidable = require("formidable");
const { uploadImageFile, ALLOWED_FILE_TYPES } = require("../utils/uploadImage");

const memberController = {
  async getProfile(req, res, next) {
    const userId = req.user.id;
    const memberRepo = dataSource.getRepository("MemberInfo");
    const existMember = await memberRepo.findOne({
      where: {
        id: userId,
      },
    });

    if (!existMember) {
      logger.warn("找不到會員資料");
      return next(appError(400, "找不到會員資料"));
    }

    return res.status(200).json({
      status: "success",
      message: "會員取得成功",
      data: {
        member: {
          id: existMember.id,
          firstname: existMember.firstname,
          lastname: existMember.lastname,
          username: existMember.username,
          birth: existMember.birth,
          gender: existMember.gender,
          phone: existMember.phone,
          email: existMember.email,
          role: existMember.role,
          photo_url: existMember.photo_url,
          is_verified: existMember.is_verified,
        },
      },
    });
  },

  async updateProfile(req, res, next) {
    const userId = req.user.id;
    const { firstname, lastname, gender, birth, photo_url } = req.body;
    const memberInfo = dataSource.getRepository("MemberInfo");
    const existMember = await memberInfo.findOne({
      where: {
        id: userId,
      },
    });

    if (!existMember) {
      logger.warn("找不到會員資料");
      return next(appError(400, "找不到會員資料"));
    }

    if (
      (firstname && isNotValidString(firstname)) ||
      (lastname && isNotValidString(lastname)) ||
      (gender && isNotValidString(gender)) ||
      (birth && !isValidDate(birth)) ||
      (photo_url && !isValidURL(photo_url))
    ) {
      return next(appError(400, "欄位未填寫正確"));
    }

    if (firstname) existMember.firstname = firstname;
    if (lastname) existMember.lastname = lastname;
    if (gender) existMember.gender = gender;
    if (birth) existMember.birth = new Date(birth); // 確保 birth 被轉換為 Date 類型
    if (photo_url) existMember.photo_url = photo_url;

    await memberInfo.save(existMember);

    return res.status(200).json({
      status: "success",
      message: "會員資料更新成功",
      data: {
        member: {
          id: existMember.id,
          firstname: existMember.firstname,
          lastname: existMember.lastname,
          username: existMember.username,
          birth: existMember.birth,
          gender: existMember.gender,
          phone: existMember.phone,
          email: existMember.email,
          role: existMember.role,
          photo_url: existMember.photo_url,
          is_verified: existMember.is_verified,
        },
      },
    });
  },

  async editMemberAvatar(req, res, next) {
    // 處理前端的檔案上傳請求
    const form = formidable.formidable({
      multiple: false,
    });

    // 解析來自前端的請求
    const [, files] = await form.parse(req);

    // 檢查是否有上傳檔案
    const imageFile = files.file?.[0];
    if (!imageFile) {
      return next(appError(400, "請上傳圖片"));
    }

    if (!ALLOWED_FILE_TYPES[imageFile.mimetype]) {
      return next(appError(400, "圖片格式錯誤，僅支援 JPG、PNG 格式"));
    }

    // 上傳圖片並獲取圖片 URL
    const imageUrl = await uploadImageFile(imageFile, "member-avatar");

    const memberRepo = dataSource.getRepository("MemberInfo");
    const updateMember = await memberRepo.update({ id: req.user.id }, { photo_url: imageUrl });

    if (updateMember.affected === 0) {
      return next(appError(404, "會員資料不存在"));
    }
    return res.status(200).json({
      status: "success",
      message: "會員頭貼更新成功",
      data: {
        avatar_url: imageUrl,
      },
    });
  },

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
          eventPlanBox: true,
          memberBox: true,
        },
        order: { created_at: "DESC" },
      });

      const formattedOrders = existOrder.map((order) => ({
        id: order.id,
        event_plan: {
          id: order.eventPlanBox?.id,
          name: order.eventPlanBox?.name,
          date: order.eventPlanBox?.date,
        },
        quantity: order.quantity,
        total_price: order.total_price,
        book_at: order.book_at,
        created_at: order.created_at,
        event_addons: order.event_addons || [],
      }));

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
    const memberId = req.user.id;
    if (!memberId) {
      return next(appError(401, "請先登入會員"));
    }

    const { event_plan_id, quantity, event_addons = [] } = req.body;

    const eventPlanRepo = dataSource.getRepository("EventPlan");
    const addonRepo = dataSource.getRepository("EventPlanAddon");
    const verifiedAddons = [];

    try {
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

      const OrderRepo = dataSource.getRepository("OrderInfo");
      const newOrder = OrderRepo.create({
        member_info_id: memberId,
        event_plan_id: event_plan_id,
        quantity: quantity,
        event_addons: verifiedAddons,
        total_price: eventPlan.price * quantity + addonsTotal,
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
            event_plan_price: newOrder.event_plan_price,
            quantity: newOrder.quantity,
            total_price: newOrder.total_price,
            book_at: newOrder.book_at,
            created_at: newOrder.created_at,
            event_addons: verifiedAddons,
          },
        },
      });
    } catch (error) {
      logger.error("查詢活動方案時發生錯誤", error);
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
};

module.exports = memberController;
