const express = require("express");
const router = express.Router();
//引入checkAuth middlewares
const checkAuth = require("../middlewares/checkAuth");
const errorAsync = require("../utils/errorAsync");

const eventTagController = require("../controllers/eventTagController");

router.post("/event-tags", checkAuth, errorAsync(eventTagController.createEventTag));

router.get("/event-tags", checkAuth, errorAsync(eventTagController.getEventTags));

router.delete("/event-tags/:tagId", checkAuth, errorAsync(eventTagController.deleteEventTag));
module.exports = router;
