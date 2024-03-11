const User = require("../models/user");
const cloudinary = require("cloudinary").v2;
const Post = require("../models/post");

// test api to upload image to cloudinary
const test = async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(
      "https://images.unsplash.com/photo-1515138692129-197a2c608cfd?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      { public_id: "Bark_girlllll", overwrite: true } // Add overwrite: true to force using the specified public_id
    );

    console.log(result);
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

    console.log("usermod", userMod);

    console.log("user", user);

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

    console.log("people", user);

    res.status(200).send({ message: "User fetched", user: userMod });
  } catch (error) {
    console.log(error);
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
    const file = req.file;
    console.log("file", req.file);

    const result = await cloudinary.uploader.upload(file.path, {
      folder: "posts",
    });

    const newPost = await Post.create({
      author: authorId,
      quoteUrl: result.secure_url,
    });

    await newPost.save();

    res.status(201).send({ message: "Post created", newPost });
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

    console.log(withLikes);

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

    console.log(withLikes);

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

    console.log(post);

    if (!post) {
      return res.status(404).send({ message: "Post not found" });
    }

    const alreadyLiked = post.likes.findIndex((like) =>
      like.user.equals(userId)
    );

    if (alreadyLiked !== -1) {
      console.log(alreadyLiked);
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
    }).select("name");

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
};
