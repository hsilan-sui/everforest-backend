const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");

/**
 * 檢查活動是否處於可編輯狀態（僅 draft、rejected 可編輯，且報名未截止）
 */

const EVENT_STATUS_LABELS = {
  draft: "草稿",
  pending: "待審核",
  rejected: "已退回",
  published: "已上架",
  archived: "已結束",
};

const checkEventEditable = async (req, res, next) => {
  const { eventId } = req.params;

  if (!eventId) {
    return next(appError(400, "缺少活動ID"));
  }

  const eventRepo = dataSource.getRepository("EventInfo");
  const event = await eventRepo.findOne({ where: { id: eventId } });

  if (!event) {
    return next(appError(404, "找不到對應的活動"));
  }

  //rejected
  const lockedStatus = ["pending", "published", "archived"];
  const statusLabel = EVENT_STATUS_LABELS[event.active] || event.active;
  if (lockedStatus.includes(event.active)) {
    return next(appError(403, `活動狀態為『${statusLabel}』，無法進行編輯操作`));
  }

  // 報名截止時間已過，禁止編輯
  const now = new Date();
  if (event.registration_close_time && new Date(event.registration_close_time) < now) {
    return next(appError(403, "報名已截止，無法再編輯活動內容"));
  }

  // 如果需要後面 controller 用到 event，可以掛上 req
  req.event = event;

  next();
};

module.exports = checkEventEditable;
