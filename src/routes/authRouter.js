const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.route("/").get(authController.test);
router.route("/signup").post(authController.register);
router.route("/login").post(authController.login);

module.exports = router;
