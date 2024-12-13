const config = require("./utils/config");
const express = require("express");
const app = express();
const cors = require("cors");
const signupRouter = require("./controllers/signup");
const loginRouter = require("./controllers/login");
const uploadRouter = require("./controllers/upload");
const processRouter = require("./controllers/process-doc");
const userDataRouter = require("./controllers/userData");

const middleware = require("./utils/middleware");
const logger = require("./utils/logger");
const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

logger.info("Connecting to", config.MONGODB_URI);
mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    logger.info("Connected to MongoDB");
  })
  .catch((error) => {
    logger.error("Error connecting to MongoDB:", error.message);
  });

app.use(cors());
app.use(express.json());
app.use(middleware.requestLogger);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/signup", signupRouter);
app.use("/api/login", loginRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/process-doc", processRouter);
app.use("/api/user-data", userDataRouter);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
