const { dataSource } = require("../db/data-source");

// const { isUndefined, isNotValidString, isValidPassword } = require("../utils/validUtils");
const appError = require("../utils/appError");
const logger = require("../utils/logger")("Admin");

const { sendEventReviewResultEmail } = require("../utils/emailUtils");

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
    const {
      active = "all",
      page = "1",
      limit = "10",
      sort_by = "created_at",
      order = "DESC",
    } = req.query;

    const validStatus = ["draft", "rejected", "pending", "published", "archived", "all"];
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

    // 組 where 條件
    let whereCondition = {};
    if (active === "rejected") {
      whereCondition = { active: "draft", is_rejected: true };
    } else if (active === "draft") {
      whereCondition = { active: "draft", is_rejected: false };
    } else if (active !== "all") {
      whereCondition = { active };
    }

    try {
      const [data, total] = await eventRepo.findAndCount({
        where: whereCondition,
        relations: [
          "eventPhotoBox",
          "eventPlanBox",
          "eventPlanBox.eventPlanAddonBox",
          "eventPlanBox.eventPlanContentBox",
        ],
        order: { [sort_by]: order.toUpperCase() },
        skip,
        take: pageSize,
      });

      // 狀態標籤函式
      const getActiveStatusLabel = (event) => {
        if (event.active === "draft" && event.is_rejected) return "已退回";
        if (event.active === "draft") return "草稿";
        if (event.active === "pending") return "待審核";
        if (event.active === "published") return "已上架";
        if (event.active === "archived") return "已結束";
        return event.active;
      };

      const data_lists = data.map((event) => {
        const cover = event.eventPhotoBox?.find((p) => p.type === "cover")?.photo_url ?? null;
        const photo_count = event.eventPhotoBox?.length ?? 0;
        const max_price = event.eventPlanBox?.length
          ? Math.max(...event.eventPlanBox.map((p) => p.price ?? 0))
          : null;

        return {
          id: event.id,
          title: event.title,
          cover_photo_url: cover,
          photo_count,
          start_date: event.start_time,
          end_date: event.end_time,
          max_participants: event.max_participants,
          max_price,
          active_status: getActiveStatusLabel(event),
        };
      });

      res.status(200).json({
        status: "success",
        total_data: total,
        current_page: currentPage,
        page_size: pageSize,
        total_page: Math.ceil(total / pageSize),
        data_lists,
      });
    } catch (error) {
      console.error("[getAdminEvents] 錯誤：", error);
      next(appError(500, "查詢活動失敗"));
    }
  },
  // @route GET /api/admin/events/:id
  // @desc 取得指定活動（完整內容）
  async getAdminEventById(req, res, next) {
    const eventRepo = dataSource.getRepository("EventInfo");
    const { id } = req.params;

    try {
      const event = await eventRepo.findOne({
        where: { id },
        relations: [
          "eventPhotoBox",
          "eventPlanBox",
          "eventPlanBox.eventPlanAddonBox",
          "eventPlanBox.eventPlanContentBox",
        ],
      });

      if (!event) {
        return next(appError(404, "找不到該活動"));
      }

      // 統一狀態標籤
      const getActiveStatusLabel = (event) => {
        if (event.active === "draft" && event.is_rejected) return "已退回";
        if (event.active === "draft") return "草稿";
        if (event.active === "pending") return "待審核";
        if (event.active === "published") return "已上架";
        if (event.active === "archived") return "已結束";
        return event.active;
      };

      res.status(200).json({
        status: "success",
        active_status: getActiveStatusLabel(event),
        data: {
          ...event,
        },
      });
    } catch (error) {
      console.error("[getAdminEventById] 錯誤：", error);
      next(appError(500, "查詢活動失敗"));
    }
  },
  //  審核通過活動並上架活動
  async approveEvent(req, res, next) {
    const { id } = req.params;
    const eventRepo = dataSource.getRepository("EventInfo");
    const hostRepo = dataSource.getRepository("HostInfo");

    try {
      const event = await eventRepo.findOne({ where: { id } });

      if (!event) return next(appError(404, "找不到該活動"));

      if (event.active !== "pending") {
        return next(appError(400, "僅可審核狀態為『待審核』的活動"));
      }

      // 找出主辦方資料以取得 Email
      const host = await hostRepo.findOne({ where: { id: event.host_id } });

      if (!host || !host.email) {
        return next(appError(400, "無法取得主辦方信箱，請確認活動主辦方資料"));
      }

      // 更新活動狀態
      event.active = "published";
      event.is_rejected = false;
      await eventRepo.save(event);

      // 寄送審核成功通知信
      await sendEventReviewResultEmail({
        toEmail: [host.email, "hsilanyu@gmail.com"], //host.email
        eventTitle: event.title,
        isApproved: true,
      });

      console.warn("活動審核信件寄出成功：");
      res.status(200).json({
        status: "success",
        message: "活動已通過審核並成功上架",
      });
    } catch (error) {
      console.error("[approveEvent] 錯誤：", error);
      next(appError(500, "活動審核有誤"));
    }
  },
  //退件活動
  // PATCH /api/admin/events/:id/reject
  // PATCH /api/admin/events/:id/reject
  async rejectEvent(req, res, next) {
    try {
      const eventId = req.params.id;
      const { reason = "請依據平台規範修正活動資訊後，再重新將活動送出審核。" } = req.body;

      const eventRepo = dataSource.getRepository("EventInfo");
      const memberRepo = dataSource.getRepository("MemberInfo");

      const event = await eventRepo.findOne({ where: { id: eventId }, relations: ["hostBox"] });

      if (!event) return next(appError(404, "找不到該活動"));
      if (event.active !== "pending") {
        return next(appError(400, "只有待審核的活動才能退回"));
      }

      event.active = "draft";
      event.is_rejected = true;
      event.updated_at = new Date();
      await eventRepo.save(event);

      const host = await memberRepo.findOne({ where: { id: event.hostBox.member_id } });

      await sendEventReviewResultEmail({
        toEmail: host.email,
        eventTitle: event.title,
        isApproved: false, // 這裡設為 false 表示是退回審核
        reason: reason, // 可自定義理由
      });

      res.status(200).json({ message: "活動審核『不通過』，已退回活動並通知主辦方" });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = adminController;
