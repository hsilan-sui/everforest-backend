const { dataSource } = require("../db/data-source");
const { isUndefined, isNotValidString, isNotValidUUID } = require("../utils/validUtils");
const appError = require("../utils/appError");

const memberController = {
  async getMemberProfile(req, res, next) {
    const memberId = req.params.memberId;

    if (isNotValidString(memberId) || isNotValidUUID(memberId)) {
      return next(appError(400, "欄位未填寫正確"));
    }

    const memberRepo = dataSource.getRepository("Member");
    const member = await memberRepo.findOne({
      where: {
        id: memberId,
      },
    });

    if (!member) {
      return next(new appError(404, "找不到該會員"));
    }

    res.status(200).json({
      status: "success",
      data: {
        member: {
          id: memberId,
          country_code: member.country_code,
          phone: member.phone,
          firstname: member.firstname,
          lastname: member.lastname,
          is_verified: member.is_verified,
          gender: member.gender,
        },
      },
    });
  },

  async updateProfile(req, res, next) {
    const memberId = req.params.memberId;
    const { firstname, lastname, birth, nickname, gender } = req.body;
    if (
      isUndefined(firstname) ||
      isNotValidString(firstname) ||
      isUndefined(lastname) ||
      isNotValidString(lastname) ||
      isUndefined(birth) ||
      isUndefined(nickname) ||
      isNotValidString(nickname) ||
      isUndefined(gender) ||
      isNotValidString(gender) ||
      isNotValidString(memberId) ||
      isNotValidUUID(memberId)
    ) {
      return next(appError(400, "欄位未填寫正確"));
    }

    const memberRepo = dataSource.getRepository("Member");
    const member = await memberRepo.findOne({
      where: {
        id: memberId,
      },
    });

    if (!member) {
      return next(new appError(404, "找不到該會員"));
    }

    // 如果新資料與當前資料相同不需更新
    if (
      member.firstname === firstname &&
      member.lastname === lastname &&
      member.birth === birth &&
      member.nickname === nickname &&
      member.gender === gender
    ) {
      return next(appError(400, "會員資料無變更"));
    }

    const updateResult = await memberRepo.update(
      {
        id: memberId,
      },
      {
        firstname,
        lastname,
        birth,
        nickname,
        gender,
      }
    );

    // 更新未成功
    if (updateResult.affected === 0) {
      return next(appError(400, "更新會員資料失敗"));
    }

    const result = await memberRepo.findOne({
      where: {
        id: memberId,
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        member: {
          id: result.id,
          firstname: result.firstname,
          lastname: result.lastname,
          email: result.email,
          birth: result.birth,
          nickname: result.nickname,
          gender: result.gender,
        },
      },
    });
  },
};

module.exports = memberController;
