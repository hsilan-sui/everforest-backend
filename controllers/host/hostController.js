const { dataSource } = require("../../db/data-source");
const { generateAccessJWT } = require("../../utils/jwtUtils.js");
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

    const { name, description, email, phone, photo_url, photo_background_url } = req.body;

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
    //改寫法 兩件事都要成立 創建主辦方資料 ＆＆ 角色更新為host
    const queryRunner = dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const hostRepo = queryRunner.manager.getRepository("HostInfo");

      const memberRepo = queryRunner.manager.getRepository("MemberInfo");

      const existHost = await hostRepo.findOneBy({ member_info_id: memberId });

      //取HostInfo若有這位會員id=> 已是主辦方
      if (existHost) {
        //409-資源重複
        await queryRunner.rollbackTransaction();
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
        await queryRunner.rollbackTransaction();
        return next(appError(500, "伺服器錯誤"));
      }

      //先找出該名會員
      const existMember = await memberRepo.findOneBy({ id: memberId });

      if (!existMember) {
        //404-找不到此會員
        await queryRunner.rollbackTransaction();
        return next(appError(404, "找不到此會員"));
      }

      //如果該會員存在 就更新角色
      existMember.role = "host";
      const result = await memberRepo.save(existMember);

      //logger.info(`會員 ${memberId} 已成功升級為主辦方`);

      if (!result) {
        await queryRunner.rollbackTransaction();
        return next(appError(500, "伺服器錯誤"));
      }
      //成功 → 提交交易 到資料庫
      await queryRunner.commitTransaction();

      const newAccessToken = generateAccessJWT({
        id: memberId,
        role: "host", //可指定角色的權限驗證 middleware（RBAC）
      });

      res.cookie("access_token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 天
      });

      res.status(201).json({
        status: "success",
        message: "主辦方資料建立成功",
        data: {
          host_info: {
            memberId,
            role: existMember.role,
            name: savedHost.name,
            description: savedHost.description,
            email: savedHost.email,
            phone: savedHost.phone,
            photo_url: savedHost.photo_url,
            photo_background_url: savedHost.photo_background_url ?? null,
          },
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      //logger.error("建立主辦方錯誤", error);
      return next(error);
    } finally {
      await queryRunner.release();
    }
  },
};

module.exports = hostController;
