const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  dailyMedicineStatus: [
    {
      date: {
        type: Date,
        required: true,
      },
      morning: Array,
      noon: Array,
      evening: Array,
      night: Array,
    },
  ],
});

const Medicine = mongoose.model("Medicine", medicineSchema);
