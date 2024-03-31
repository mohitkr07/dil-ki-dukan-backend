const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // content: { type: String, required: true },
  likes: [likeSchema],
  quoteUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
});

postSchema.virtual("populatedComments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "post",
  justOne: false,
  populate: [
    {
      path: "replies",
      model: "Comment",
    },
    {
      path: "user",
      model: "User",
    },
  ],
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
