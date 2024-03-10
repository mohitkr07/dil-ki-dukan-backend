require("dotenv").config();
const mongoose = require("mongoose");

const { MONGO_URL } = process.env;

const connectDb = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Database connected to: ", MONGO_URL);
  } catch (error) {
    console.log(error);
    process.exit(0);
  }
};

module.exports = connectDb;
