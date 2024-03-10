const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (v) {
        return /\S+@\S+\.\S+/.test(v);
      },
      message: (props) => `${props.value} is not a valid email address!`,
    },
  },
  phone: {
    type: String,
  },
  password: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
  },
  link: {
    type: String,
  },
  tokens: [
    {
      token: {
        type: String,
      },
    },
  ],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.tokens;
  return user;
};

// Add a method to follow another user
userSchema.methods.follow = async function (userIdToFollow) {
  const user = this;
  try {
    if (!user.following.includes(userIdToFollow)) {
      user.following.push(userIdToFollow);
      await user.save();
    }
  } catch (error) {
    throw new Error(`Error following user: ${error.message}`);
  }
};

// Create a virtual field to get followers
userSchema.virtual("followers", {
  ref: "User",
  localField: "_id",
  foreignField: "following",
});

userSchema.pre("save", async function (next) {
  const user = this;
  if (!user.isModified("password")) {
    return next();
  }
  try {
    const saltRound = await bcrypt.genSalt(5);
    const hash_pass = await bcrypt.hash(user.password, saltRound);
    user.password = hash_pass;
    return next();
  } catch (error) {
    return next(error.message);
  }
});

userSchema.methods.generateToken = async function () {
  try {
    const user = this;
    const token = jwt.sign(
      {
        _id: user._id.toString(),
        email: user.email,
      },
      process.env.SECRET_KEY
    );

    user.tokens = user.tokens.concat({ token });
    await user.save();

    return token;
  } catch (error) {
    throw new Error(`Error generating token: ${error.messagge}`);
  }
};

userSchema.methods.comparePassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw new Error(`Something Went Wrong`);
  }
};

const User = mongoose.model("User", userSchema);
module.exports = User;
