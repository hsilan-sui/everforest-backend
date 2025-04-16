const { dataSource } = require("../../db/data-source");
const { isUndefined, isNotValidString } = require("../../utils/validUtils");
const appError = require("../../utils/appError");
const logger = require("../../utils/logger")("Host");

const hostController = {
  async postHostProfile(req, res, next) {
    const memberId = req.user.id; //從middleware取出目前登入的會員uuid
    if (!memberId) {
      //401-未授權
      return next(appError(401, "請先登入會員"));
    }

    console.warn(req.user);

    const { name, description, email, phone, photo_url, photo_background_url } = req.body;

    logger.warn("req.body", req.body);

    logger.warn(memberId, name, description, email, phone, photo_url, photo_background_url);

    //驗證必填欄位
    if (
      isUndefined(name) ||
      isNotValidString(name) ||
      isUndefined(email) ||
      isNotValidString(email) ||
      isUndefined(phone) ||
      isNotValidString(phone) ||
      isUndefined(photo_url) ||
      isNotValidString(photo_url)
    ) {
      //400 - 發生錯誤(未寫必填欄位)
      return next(appError(400, "請填寫主辦方名稱、電話、Email、大頭貼等必填欄位"));
    }

    //建立typeorm物件
    const hostRepo = dataSource.getRepository("HostInfo");

    //確認該會員是否已經建立主辦方資料(透過member_info_id外鍵)
    //取HostInfo中找有沒有這位會員id 沒有=> 第一次成為主辦方
    const existHost = await hostRepo.findOneBy({ member_info_id: memberId });

    //取HostInfo若有這位會員id=> 已是主辦方
    if (existHost) {
      //409-資源重複
      return next(appError(409, "您已經創建過主辦方資料"));
    }

    //建立組好要存入HostInfo的一筆主辦方資料物件
    const newHost = hostRepo.create({
      member_info_id: memberId,
      name,
      description,
      email,
      phone,
      photo_url,
      photo_background_url, //允許null
    });

    //將主辦方資料存入資料庫
    const savedHost = await hostRepo.save(newHost);
    logger.info(`savedHost ${savedHost} `);

    if (!savedHost) {
      return next(appError(500, "伺服器錯誤"));
    }

    //這段要更新MemberInfo中的角色
    const memberRepo = dataSource.getRepository("MemberInfo");
    //先找出該名會員
    const existMember = await memberRepo.findOneBy({ id: memberId });

    logger.info(`existMember ${existMember} `);
    if (!existMember) {
      //404-找不到此會員
      return next(appError(404, "找不到此會員"));
    }
    //如果該會員存在 就更新角色
    existMember.role = "host";
    const result = await memberRepo.save(existMember);

    logger.info(`會員 ${memberId} 已成功升級為主辦方`);

    if (!result) {
      return next(appError(500, "伺服器錯誤"));
    }

    res.status(201).json({
      status: "success",
      message: "主辦方資料建立成功",
      data: {
        host_info: savedHost, //帶入全部的資料 只是測試 在優化
      },
    });
  },
};

module.exports = hostController;
