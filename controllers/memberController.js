const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const logger = require("../utils/logger")("member");
const { isNotValidString, isValidURL, isValidDate } = require("../utils/validUtils");

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
};

module.exports = memberController;
