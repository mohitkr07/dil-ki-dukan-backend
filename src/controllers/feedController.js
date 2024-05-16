const User = require("../models/user");
const cloudinary = require("cloudinary").v2;
const Post = require("../models/post");

const feedPost = async (req, res) => {
  try {
    const userId = req.user._id;
    const following = req.user.following;
    const feedPosts = await Post.find({
      // author: { $in: following }
    })
      .sort({ createdAt: -1 })
      .populate("author", "name email profilePicture")
      .populate("likes.user")
      .sort({ createdAt: -1 });

    const withLikes = feedPosts.map((post) => {
      const liked = post.likes.some((like) => like.user.equals(userId));

      return {
        ...post.toObject(),
        liked,
      };
    });

    res.status(200).json({ posts: withLikes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  feedPost,
};
