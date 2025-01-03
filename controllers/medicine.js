const medicineRouter = require("express").Router();
const Medicine = require("../models/medicine");
const User = require("../models/user");
const { authenticate } = require("../utils/middleware");

medicineRouter.get("/", authenticate, async (req, res) => {
  const { date, full } = req.query;
  if (date && full) {
    return res.status(400).json({ error: "Invalid query parameters" });
  }

  try {
    if (full === "true") {
      const medicines = await Medicine.findOne({ userId: req.user.id });
      if (!medicines) {
        return res.status(404).json({ error: "Medicines not found" });
      }

      res.status(200).json(medicines);
    } else if (date) {
      const medicines = await Medicine.findOne({ userId: req.user.id });
      if (!medicines) {
        return res.status(404).json({ error: "Medicines not found" });
      }

      const dailyStatus = medicines.dailyMedicineStatus.find(
        (status) => status.date.toISOString().split("T")[0] === date
      );

      if (!dailyStatus) {
        return res.status(404).json({ error: "Daily status not found" });
      }

      res.status(200).json(dailyStatus);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

medicineRouter.post("/", authenticate, async (req, res) => {
  const { dailyMedicineStatus } = req.body;
  if (!dailyMedicineStatus) {
    return res.status(400).json({ error: "Daily status is required" });
  }
  try {
    let medicines = await Medicine.findOne({ userId: req.user.id });
    if (!medicines) {
      medicines = new Medicine({
        userId: req.user.id,
        dailyMedicineStatus,
      });
    } else {
      const existingDailyStatusIndex = medicines.dailyMedicineStatus.findIndex(
        (status) =>
          status.date.toISOString().split("T")[0] ===
          dailyMedicineStatus[0].date
      );

      if (existingDailyStatusIndex >= 0) {
        medicines.dailyMedicineStatus[existingDailyStatusIndex] =
          dailyMedicineStatus[0];
      } else {
        medicines.dailyMedicineStatus.push(dailyMedicineStatus[0]);
      }
    }

    await medicines.save();
    res.status(201).json({ message: "Daily status added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = medicineRouter;
