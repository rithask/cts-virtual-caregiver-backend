const userDataRouter = require("express").Router();
const { authenticate } = require("../utils/middleware");
const UserData = require("../models/userData");

userDataRouter.post("/", authenticate, async (req, res) => {
  try {
    const userData = new UserData(req.body, {
      userId: req.user.id,
    });
    await userData.save();

    res.status(200).json({ message: "Data saved successfully!" });
    console.log("saved data : ", userData);
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ message: "Failed to save data", error });
  }
});

userDataRouter.get("/", authenticate, async (req, res) => {
  try {
    const userData = await UserData.findOne({
      userId: req.user.id,
    });
    if (userData) {
      res.status(200).json(userData);
    } else {
      res.status(404).json({ message: "No saved data found" });
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Failed to fetch data", error });
  }
});

module.exports = userDataRouter;
