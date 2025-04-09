const express = require("express");
const router = express.Router();
const { isAuth } = require("../middlewares/isAuth");
const errorAsync = require("../utils/errorAsync");
const hostController = require("../controllers/hostController");

//建立主辦方資料
router.post("/profile", isAuth, errorAsync(hostController.postHostProfile));

//取得主辦方資料
router.get("/profile", isAuth, errorAsync(hostController.getHostProfile));

//更改主辦方資料
router.put("/profile", isAuth, errorAsync(hostController.updateHostProfile));

module.exports = router;
