const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage }); // This is where files will be temporarily stored

router.route("/test").get(userController.test);
router.route("/getUser").get(userController.getUser);
router.route("/update").patch(userController.updateUser);
router.route("/create").post(upload.single("image"), userController.createPost);
router.route("/posts").get(userController.getPosts);
router.route("/like/:id").patch(userController.likePost);
router.route("/follow/:id").patch(userController.followUser);
router.route("/followers").get(userController.getFollowers);
router.route("/following").get(userController.getFollowing);
router.route("/search/:query").get(userController.searchUser);

module.exports = router;
