const mongoose = require("mongoose");

const symptomSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  symptoms: [
    {
      date: {
        type: Date,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
    },
  ],
});

const Symptom = mongoose.model("Symptom", symptomSchema);
