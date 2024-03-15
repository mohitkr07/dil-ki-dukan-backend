const express = require("express");
const router = express.Router();
const feedController = require("../controllers/feedController");

router.route("/feedPosts").get(feedController.feedPost);

module.exports = router;
