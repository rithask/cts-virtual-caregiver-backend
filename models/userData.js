const mongoose = require("mongoose");

const userDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    PlanActivatedDate: {
      type: String,
      required: true,
    },
    discharge_details: {
      diet_recommendation: {
        breakfast: {
          type: Array,
          default: [],
        },
        lunch: {
          type: Array,
          default: [],
        },
        dinner: {
          type: Array,
          default: [],
        },
      },
      exercise_recommendation: {
        type: Object,
        default: {},
      },
      follow_up_date: {
        type: String,
        default: null,
      },
      prescribed_illness: {
        type: String,
        default: null,
      },
      prescription: {
        type: Array,
        default: [],
      },
    },
    treating_consultant: {
      hospital: {
        type: String,
        default: null,
      },
      name: {
        type: String,
        default: null,
      },
      specialty: {
        type: String,
        default: null,
      },
    },
    userDetails: {
      age: {
        type: String,
        required: true,
      },
      dateOfBirth: {
        type: String,
        required: true,
      },
      gender: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

userDataSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("UserData", userDataSchema);
