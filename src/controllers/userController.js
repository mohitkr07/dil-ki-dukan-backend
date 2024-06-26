const User = require("../models/user");
const cloudinary = require("cloudinary").v2;
const Post = require("../models/post");
const Comment = require("../models/comment");

// test api to upload image to cloudinary
const test = async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(
      "https://images.unsplash.com/photo-1515138692129-197a2c608cfd?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      { public_id: "Bark_girlllll", overwrite: true } // Add overwrite: true to force using the specified public_id
    );
    res.send({ message: "done" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Some Internal Error");
  }
};

// get user
const getUser = async (req, res) => {
  try {
    const user = req.user;

    const followers = await user.populate("followers", "name email");

    await user.populate("following", "name email");

    // add followers to user and send, make separate object, combile user and followers
    delete user.password;
    delete user.tokens;

    const userMod = {
      ...user.toObject(),
      followers: user.followers,
    };

    res.status(200).send({ message: "User fetched", user: userMod });
  } catch (error) {
    res.send({ msg: "error" });
  }
};

const getPeople = async (req, res) => {
  try {
    const _id = req.params.id;

    const user = await User.findById(_id).populate("following", "name email");

    const followers = await user.populate("followers", "name email");

    const userMod = {
      ...user.toObject(),
      followers: user.followers,
    };

    res.status(200).send({ message: "User fetched", user: userMod });
  } catch (error) {
    res.send({ msg: "error" });
  }
};

// update user
const updateUser = async (req, res) => {
  try {
    const { name, email, bio, link } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({ msg: "User not found" });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (bio) user.bio = bio;
    if (link) user.link = link;

    await user.save();

    res.status(200).send({ msg: "User updated successfully", user });
  } catch (error) {
    res.status(500).send({ msg: "Internal server error" });
  }
};

// create post
const createPost = async (req, res) => {
  try {
    const authorId = req.user._id;
    if (!req.file) return res.status(400).send({ error: "No file uploaded" });
    const file = req.file;

    const fileBuffer = req.file.buffer;

    const fileStream = cloudinary.uploader.upload_stream(
      { folder: "posts" },
      async function (error, result) {
        if (error) {
          console.error("Error uploading file to Cloudinary:", error);
          res.status(500).send({ error: "Error uploading file" });
        } else {
          const newPost = await Post.create({
            author: authorId,
            quoteUrl: result.secure_url,
          });

          await newPost.save();

          res.status(201).send({ message: "Post created" });
        }
      }
    );

    fileStream.write(fileBuffer);
    fileStream.end();

    // const result = await cloudinary.uploader.upload(file.path, {
    //   folder: "posts",
    // });

    // const newPost = await Post.create({
    //   author: authorId,
    //   quoteUrl: result.secure_url,
    // });

    // await newPost.save();

    // res.status(201).send({ message: "Post created" });
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    res.status(500).json({ error: "Failed to upload image to Cloudinary" });
  }
};

// get all posts by the particular author only
const getPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const posts = await Post.find({ author: req.user._id })
      .populate("likes.user")
      .populate("author")
      .sort({ createdAt: -1 });

    const withLikes = posts.map((post) => {
      const liked = post.likes.some((like) => like.user.equals(userId));

      return {
        ...post.toObject(),
        liked,
      };
    });

    res.status(200).send({ message: "Posts fetched", posts: withLikes });
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
  }
};

const getPeoplePosts = async (req, res) => {
  try {
    const peopldId = req.params.id;
    const userId = req.user._id;

    const posts = await Post.find({ author: peopldId })
      .populate("likes.user")
      .populate("author")
      .sort({ createdAt: -1 });

    const withLikes = posts.map((post) => {
      const liked = post.likes.some((like) => like.user.equals(userId));

      return {
        ...post.toObject(),
        liked,
      };
    });

    res.status(200).send({ message: "Posts fetched", posts: withLikes });
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
  }
};

const likePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).send({ message: "Post not found" });
    }

    const alreadyLiked = post.likes.findIndex((like) =>
      like.user.equals(userId)
    );

    if (alreadyLiked !== -1) {
      post.likes.splice(alreadyLiked, 1);
      await post.save();

      const updatedPost = await Post.findById(postId)
        .populate("likes.user")
        .populate("author");
      return res
        .status(200)
        .send({ message: "Post unliked", post: updatedPost });
    } else {
      post.likes.push({ user: userId });
      await post.save();
      const updatedPost = await Post.findById(postId)
        .populate("likes.user")
        .populate("author");
      return res
        .status(200)
        .json({ message: "Post liked successfully", post: updatedPost });
    }
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
  }
};

const followUser = async (req, res) => {
  try {
    const user = req.user;
    const userId = req.params.id;

    const isFollowing = user.following.includes(userId);

    if (isFollowing) {
      await user.unfollow(userId);
      const updatedUser = await User.findById(user._id).populate("followers");

      return res
        .status(200)
        .send({ message: "Successfully unfollowed user", updatedUser });
    } else {
      await user.follow(userId);

      const updatedUser = await User.findById(user._id).populate("followers");

      return res
        .status(200)
        .send({ message: "Successfully followed user", updatedUser });
    }
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
};

const getFollowers = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate(
      "followers",
      "name email"
    ); // Populate followers with only name and email fields

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    res.status(200).send(user.followers);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};
const getFollowing = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate(
      "following",
      "name email"
    ); // Populate following with only name and email fields

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    res.status(200).send(user.following);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

const searchUser = async (req, res) => {
  try {
    const query = req.params.query;
    if (!query) {
      return res
        .status(400)
        .send({ error: 'Search query parameter "q" is required' });
    }

    let users = await User.find({
      $or: [{ name: { $regex: new RegExp(query, "i") } }],
    }).select("name profilePicture");

    users.sort((a, b) => {
      const indexA = a.name.toLowerCase().indexOf(query.toLowerCase());
      const indexB = b.name.toLowerCase().indexOf(query.toLowerCase());
      return indexA - indexB;
    });

    users = users.slice(0, 20);

    res.status(200).send(users);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

const updateProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ error: "No file uploaded" });
    }

    const fileBuffer = req.file.buffer;
    const userId = req.user._id;
    const user = req.user;

    const fileStream = cloudinary.uploader.upload_stream(
      { folder: "profile" },
      async function (error, result) {
        if (error) {
          console.error("Error uploading file to Cloudinary:", error);
          res.status(500).send({ error: "Error uploading file" });
        } else {
          user.profilePicture = result.secure_url;
          await user.save();

          res.status(200).send({
            message: "Profile picture updated",
            user,
          });
        }
      }
    );

    fileStream.write(fileBuffer);
    fileStream.end();
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).send({ error: error.message });
  }
};

const updateCoverPic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ error: "No file uploaded" });
    }

    const fileBuffer = req.file.buffer;
    const userId = req.user._id;
    const user = req.user;

    const fileStream = cloudinary.uploader.upload_stream(
      { folder: "cover" },
      async function (error, result) {
        if (error) {
          console.error("Error uploading file to Cloudinary:", error);
          res.status(500).send({ error: "Error uploading file" });
        } else {
          user.coverPic = result.secure_url;
          await user.save();

          res.status(200).send({
            message: "Cover picture updated",
            user,
          });
        }
      }
    );

    fileStream.write(fileBuffer);
    fileStream.end();

    // res.status(200).send({ message: "Profile picture updated" });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).send({ error: error.message });
  }
};

const comment = async (req, res) => {
  try {
    const { content } = req.body;
    const commentId = req.body.commentId;
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById({ _id: postId });

    if (!post) {
      return res.status(404).send({ message: "Post not found" });
    }

    if (commentId) {
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).send({ message: "Comment not found" });
      }
      const reply = await Comment.create({
        content,
        user: userId,
        post: post._id,
        isReply: true,
      });
      comment.replies.push(reply._id);
      await comment.save();
      return res.status(201).send({ message: "Reply created" });
    }

    const newComment = await Comment.create({
      content,
      user: userId,
      post: post._id,
    });

    res.status(201).send({ message: "Comment created", newComment });
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
  }
};

const getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate({
        path: "populatedComments",
        match: { isReply: false },
        populate: {
          path: "user",
          model: "User",
          select: "name profilePicture",
        },
      })
      .exec();

    if (!post) {
      return res.status(404).send({ message: "Post not found" });
    }

    res.status(200).send({
      message: "Comments fetched",
      comments: post.populatedComments,
      postId: post._id,
    });
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
  }
};

const getReplies = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId)
      .populate("replies")
      .populate({
        path: "replies",
        populate: {
          path: "user",
          model: "User",
          select: "name profilePicture",
        },
      });

    if (!comment) {
      return res.status(404).send({ message: "Comment not found" });
    }

    res.status(200).send({
      message: "Comments fetched",
      comment: comment,
    });
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
  }
};

const likeComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).send({ message: "Comment not found" });
    }

    const alreadyLiked = comment.likes.findIndex((like) =>
      like.user.equals(userId)
    );

    if (alreadyLiked !== -1) {
      comment.likes.splice(alreadyLiked, 1);
      await comment.save();

      const updatedComment = await Comment.findById(commentId)
        // .populate("likes.user")
        .populate("user");
      return res
        .status(200)
        .send({ message: "Comment unliked", comment: updatedComment });
    } else {
      comment.likes.push({ user: userId });
      await comment.save();
      const updatedComment = await Comment.findById(commentId)
        // .populate("likes.user")
        .populate("user");
      return res.status(200).json({
        message: "Comment liked successfully",
        comment: updatedComment,
      });
    }
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
  }
};

module.exports = {
  test,
  getUser,
  updateUser,
  createPost,
  getPosts,
  likePost,
  followUser,
  getFollowers,
  getFollowing,
  searchUser,
  getPeople,
  getPeoplePosts,
  updateProfilePic,
  updateCoverPic,
  comment,
  getComments,
  getReplies,
  likeComment,
};
