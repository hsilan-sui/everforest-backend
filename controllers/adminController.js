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
  //取得活動(依據狀態分:active=all 或 active=pending｜active=
  async getAdminEvents(req, res, next) {
    const eventRepo = dataSource.getRepository("EventInfo");
    //加入page limit sort_by order查詢
    //前端就可以用 ?sort_by=start_time&order=ASC 傳參數
    const {
      active = "all",
      page = "1",
      limit = "10",
      sort_by = "created_at",
      order = "DESC",
    } = req.query;

    //可以查詢的狀態
    const validStatus = ["pending", "published", "archived", "all"];
    //驗證排序參數是否合法
    const validSortFields = [
      "created_at",
      "start_time",
      "end_time",
      "registration_open_time",
      "registration_close_time",
      "title",
      "updated_at",
    ];

    const validOrderTypes = ["ASC", "DESC"];

    if (!validStatus.includes(active)) {
      return next(appError(400, "無效的狀態"));
    }

    if (!validSortFields.includes(sort_by)) {
      return next(appError(400, "無效的排序欄位"));
    }
    if (!validOrderTypes.includes(order.toUpperCase())) {
      return next(appError(400, "排序順序必須是 ASC 或 DESC"));
    }

    const currentPage = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (currentPage - 1) * pageSize;

    const whereCondition = active === "all" ? {} : { active };

    try {
      const [data, total] = await eventRepo.findAndCount({
        where: whereCondition,
        order: { [sort_by]: order.toUpperCase() },
        skip,
        take: pageSize,
      });

      res.status(200).json({
        status: "success",
        total_data: total,
        current_page: currentPage,
        page_size: pageSize,
        total_page: Math.ceil(total / pageSize),
        data_lists: data,
      });
    } catch (error) {
      console.error("[getAdminEvents] 錯誤：", error);
      next(appError(500, "查詢活動失敗"));
    }
  },
};

module.exports = adminController;
