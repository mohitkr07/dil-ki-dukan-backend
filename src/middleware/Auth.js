const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/user");

const auth = async (req, res, next) => {
  console.log(req.header("Authorization"));
  try {
    const token = req.header("Authorization").substring(7);
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    console.log("decoded", decoded);

    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!user) {
      throw new Error("Please Authenticate");
    }

    req.user = user;
    req.token = token;

    // console.log(user);

    next();
  } catch (error) {
    res.status(500).send({ message: "Somee Internal Error" });
  }
};

module.exports = auth;
