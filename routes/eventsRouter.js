const express = require("express");
const router = express.Router();
//引入checkAuth middlewares
const checkAuth = require("../middlewares/checkAuth");
const { restrictTo } = require("../middlewares/restrictTo");
const errorAsync = require("../utils/errorAsync");

const eventController = require("../controllers/eventController");

// 創辦活動 /api/v1/events (controller => 用 CRUD 的方式來命名)
router.post("/", checkAuth, restrictTo("host"), errorAsync(eventController.createEvent));

// 創辦/更新活動標籤 與 行前提醒  /api/v1/events/:eventId/notices-tags
router.patch(
  "/:eventId/notices-tags",
  checkAuth,
  restrictTo("host"),
  errorAsync(eventController.updateNoticesTags)
);

// 取得【某活動】所有圖片（公開，不用登入）
router.get(
  "/:eventId/images",
  errorAsync(eventController.getEventPhotos) // ← 查所有圖片
);

//新增露營活動圖片detail(最多六張)
router.post(
  "/:eventId/images",
  checkAuth,
  restrictTo("host"),
  errorAsync(eventController.uploadEventPhotos)
);

// 取得單一圖片資訊（公開）
router.get("/:eventId/images/:imageId", errorAsync(eventController.getSingleEventPhoto));

// 更新圖片描述
router.patch(
  "/:eventId/images/:imageId",
  checkAuth,
  restrictTo("host"),
  errorAsync(eventController.updateImageDescription)
);

// 刪除圖片
router.delete(
  "/:eventId/images/:imageId",
  checkAuth,
  restrictTo("host"),
  errorAsync(eventController.deleteImage)
);

// 設定活動的封面圖片（指定一張 cover）
router.patch(
  "/:eventId/images/:imageId/set-cover",
  checkAuth,
  restrictTo("host"),
  errorAsync(eventController.setCoverImage)
);

// 建立活動方案 活動方案內容 活動加購
router.post(
  "/:eventId/plans",
  checkAuth,
  restrictTo("host"),
  errorAsync(eventController.createEventPlans)
);

module.exports = router;
