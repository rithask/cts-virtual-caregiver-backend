const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const config = require("../utils/config");
const validator = require("email-validator");
const usersRouter = require("express").Router();
const User = require("../models/user");

usersRouter.post("/", async (request, response, next) => {
  const { username, email, password } = request.body;

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new User({
    username,
    email,
    passwordHash,
  });

  if (!validator.validate(email)) {
    return response.status(400).json({ error: "invalid email" });
  }

  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    return response.status(400).json({ error: "username already exists" });
  }

  try {
    const savedUser = await user.save();

    const userForToken = {
      username: savedUser.username,
      id: savedUser._id,
    };

    const token = jwt.sign(userForToken, config.JWT_SECRET, {
      expiresIn: "7d",
    });

    response.status(200).send({ token, username: savedUser.username });
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/", async (request, response) => {
  const users = await User.find({});

  response.json(users);
});

module.exports = usersRouter;
