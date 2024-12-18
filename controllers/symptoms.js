const symptomsRouter = require("express").Router();
const Symptoms = require("../models/symptoms");
const { authenticate } = require("../utils/middleware");

symptomsRouter.post("/", authenticate, async (req, res) => {
  const { description, date } = req.body;

  if (!description || !date) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const symptomDate = new Date(date);
    let existingSymptoms = await Symptoms.findOne({ userId: req.user.id });

    if (existingSymptoms) {
      const existingSymptomsIndex = existingSymptoms.symptoms.findIndex(
        (entry) =>
          entry.date.toISOString().split("T")[0] ===
          symptomDate.toISOString().split("T")[0]
      );

      if (existingSymptomsIndex !== -1) {
        existingSymptoms.symptoms[
          existingSymptomsIndex
        ].description += `, ${description}`;
      } else {
        existingSymptoms.symptoms.push({ description, date: symptomDate });
      }

      await existingSymptoms.save();
      res.status(200).json({ message: "Symptoms saved successfully!" });
    } else {
      const newSymptoms = new Symptoms({
        userId: req.user.id,
        symptoms: [{ description, date: symptomDate }],
      });

      await newSymptoms.save();
      res.status(200).json({ message: "Symptoms saved successfully!" });
    }
  } catch (error) {
    console.error("Error saving symptoms:", error);
    res.status(500).json({ message: "Failed to save symptoms", error });
  }
});

symptomsRouter.get("/", authenticate, async (req, res) => {
  try {
    const symptoms = await Symptoms.findOne({ userId: req.user.id });
    if (symptoms) {
      res
        .status(200)
        .json({ userId: symptoms.userId, symptoms: symptoms.symptoms });
    } else {
      res.status(404).json({ message: "No saved symptoms found" });
    }
  } catch (error) {
    console.error("Error fetching symptoms:", error);
    res.status(500).json({ message: "Failed to fetch symptoms", error });
  }
});

module.exports = symptomsRouter;
