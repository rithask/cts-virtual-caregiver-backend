const profileRouter = require("express").Router();
const Profile = require("../models/profile");
const User = require("../models/user");
const { authenticate } = require("../utils/middleware");

profileRouter.get("/", authenticate, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

profileRouter.post("/", authenticate, async (req, res) => {
  const { name, age, dateOfBirth, gender } = req.body;

  if (!name || !age || !dateOfBirth || !gender) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const profile = new Profile({
    name,
    age,
    dateOfBirth,
    gender,
  });

  try {
    const savedProfile = await profile.save();
    const user = await User.findById(req.user.id);
    user.profile = savedProfile._id;
    await user.save();
    res.status(201).json(savedProfile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = profileRouter;
