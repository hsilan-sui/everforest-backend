const express = require("express");
const router = express.Router();
//引入checkAuth middlewares
const checkAuth = require("../middlewares/checkAuth");
const { restrictTo } = require("../middlewares/restrictTo");
const errorAsync = require("../utils/errorAsync");

const eventController = require("../controllers/eventController");

// 創辦活動 /api/v1/events (controller => 用 CRUD 的方式來命名)
router.post("/", checkAuth, restrictTo("host"), errorAsync(eventController.createEvent));

module.exports = router;
