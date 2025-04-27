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

module.exports = router;
