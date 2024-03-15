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

const storate1 = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, "./profilepic");
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const storate2 = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, "./coverpic");
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });
const profile = multer({ storate1 });
const cover = multer({ storate2 });

router.route("/test").get(userController.test);
router.route("/getUser").get(userController.getUser);
router.route("/update").patch(userController.updateUser);
router.route("/create").post(upload.single("image"), userController.createPost);
router
  .route("/profilepic")
  .patch(profile.single("image"), userController.updateProfilePic);
router
  .route("/coverpic")
  .patch(profile.single("image"), userController.updateCoverPic);
router.route("/posts").get(userController.getPosts);
router.route("/like/:id").patch(userController.likePost);
router.route("/follow/:id").patch(userController.followUser);
router.route("/followers").get(userController.getFollowers);
router.route("/following").get(userController.getFollowing);
router.route("/search/:query").get(userController.searchUser);
router.route("/people/:id").get(userController.getPeople);
router.route("/peoplePosts/:id").get(userController.getPeoplePosts);

module.exports = router;
