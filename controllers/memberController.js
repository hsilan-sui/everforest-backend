const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const logger = require("../utils/logger")("member");
const {
  isNotValidString,
  isValidURL,
  isValidDate,
  isNotValidUUID,
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
      isNotValidString(firstname) ||
      isNotValidString(lastname) ||
      isNotValidString(gender) ||
      !isValidDate(birth) ||
      !isValidURL(photo_url)
    ) {
      return next(appError(400, "欄位未填寫正確"));
    }

    existMember.firstname = firstname;
    existMember.lastname = lastname;
    existMember.gender = gender;
    existMember.birth = new Date(birth); // 確保 birth 被轉換為 Date 類型
    existMember.photo_url = photo_url;

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
    const memberID = req.user.id;
    const orderRepo = dataSource.getRepository("OrderInfo");

    const order = await orderRepo.find({
      //member_info_id,event_plan_id,order_pay_id,quantity,total_price,book_at,created_at

      where: { member_info_id: memberID },
      order: { created_at: "DESC" },
      relations: {
        eventBox: true,
      },
    });

    if (order.length === 0) {
      logger.warn("找不到會員訂單");
      return next(appError(400, "找不到會員訂單"));
    }

    return res.status(200).json({
      status: "success",
      message: "會員訂單取得成功",
      /*
      data: {
        orders:order.map(order =>({
            id:order.id,
            member_info_id:order.member_info_id,
            quantity:'1',
            total_price:order.total_price,
            Event:{
                id:order.event_plan_id,
                title:order.title,
            },
            order_pay:{
              id:order.order_pay_id,
              status:order.status,
            },
            
        })),
        
      },
      */
    });
  },

  async postMemberOrder(req, res, next) {
    const memberId = req.user.id; //從middleware取出目前登入的會員uuid

    if (!memberId) {
      //401-未授權
      return next(appError(401, "請先登入會員"));
    }
    const orderRepo = dataSource.getRepository("OrderInfo");
    const { event_plan_id, total_price } = req.body;

    //驗證必填欄位
    if (isNotValidUUID(event_plan_id)) {
      //400 - 發生錯誤(未寫必填欄位)
      return next(appError(400, "請選擇方案"));
    } else if (isNotValidInteger(total_price)) {
      return next(appError(400, "金額要大於0"));
    }

    //建立組好要存入Order_Info的一筆主辦方資料物件
    const newOrder = orderRepo.create({
      member_info_id: memberId,
      event_plan_id,
      quantity: "1",
      total_price,
    });

    //將訂單存入資料庫
    const savedOrder = await orderRepo.save(newOrder);
    logger.info(`savedOrder ${savedOrder} `);
  },

  async patchMemberOrder(req, res, next) {
    const memberId = req.user.id;

    if (!memberId) {
      return next(appError(401, "請先登入會員"));
    }

    const orderRepo = dataSource.getRepository("OrderInfo");

    try {
      const { orderid, event_plan_id, total_price } = req.body;

      const existMemberOrder = await orderRepo.findOne({
        where: {
          id: orderid,
        },
      });

      if (!existMemberOrder) {
        logger.warn("找不到會員訂單資料");
        return next(appError(400, "找不到會員訂單資料"));
      }

      existMemberOrder.event_plan_id = event_plan_id;
      existMemberOrder.total_price = total_price;

      await orderRepo.save(existMemberOrder);

      return res.status(200).json({
        status: "success",
        message: "會員訂單更新成功",
        data: {
          order_info: {
            orderid: existMemberOrder.orderid,
            event_plan_id: "",
            quantity: "1",
            total_price: existMemberOrder.total_price,
            book_at: existMemberOrder.book_at,
          },
        },
      });
    } catch (err) {
      logger.error("會員訂單更新錯誤", err);
      return next(appError(500, "伺服器錯誤，無法更新會員訂單資料"));
    }
  },
};

module.exports = memberController;
