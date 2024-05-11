const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/user");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").substring(7);
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!user) {
      throw new Error("Please Authenticate");
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(500).send({ message: "Somee Internal Error" });
  }
};

module.exports = auth;
