require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const connectDb = require("./src/db/db");
const userRouter = require("./src/routes/userRouter");
const authRouter = require("./src/routes/authRouter");
const feedRouter = require("./src/routes/feedRouter");
const CloudinaryConfig = require("./src/db/Cloudinary");
const Auth = require("./src/middleware/Auth");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const PORT = process.env.PORT || 5000;

CloudinaryConfig();

app.use("/api/auth", authRouter);
app.use("/api/user", Auth, userRouter);
app.use("/api/feed", Auth, feedRouter);

app.use((req, res) => {
  res.status(404).send({ message: "No such route exists" });
});

connectDb().then(() => {
  app.listen(PORT, () => {
    console.log("Port is running at ", PORT);
  });
});
