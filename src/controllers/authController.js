const bcrypt = require("bcryptjs");
const User = require("../models/user");

const test = async (req, res) => {
  res.send({ message: "hi" });
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(406).send({ message: "All Fields are required" });
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({
        message: "Email Already Registered",
      });
    }
    const userCreated = await User.create({
      name,
      email,
      password,
    });

    res.status(201).json({
      message: "User created successfully",
      user: userCreated,
    });
  } catch (error) {
    res.status(500).send({ message: "Some Internal Error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User Not Found",
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (isPasswordValid) {
      const token = await user.generateToken();

      res.status(200).json({
        message: "User logged in successfully",
        user,
        token,
      });
    } else {
      res.status(400).json({
        message: "Invalid credentials",
      });
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

module.exports = { register, login, test };
