const { dataSource } = require("../db/data-source");

// const { isUndefined, isNotValidString, isValidPassword } = require("../utils/validUtils");
const appError = require("../utils/appError");
const logger = require("../utils/logger")("Admin");

const adminController = {
  async getAdminData(req, res, next) {
    try {
      const MemberInfo = dataSource.getRepository("MemberInfo");

      const admin = await MemberInfo.findOne({
        where: { id: req.user.id },
        select: ["id", "email", "username", "role", "firstname", "lastname"],
      });

      if (!admin || admin.role !== "admin") {
        return next(appError(403, "你沒有權限存取此資源"));
      }

      res.status(200).json({
        status: "success",
        data: {
          id: admin.id,
          email: admin.email,
          username: admin.username,
          role: admin.role,
          firstname: admin.firstname,
          lastname: admin.lastname,
        },
      });
    } catch (err) {
      logger.error("取得 admin 資料失敗", err);
      next(err);
    }
  },
};

module.exports = adminController;
