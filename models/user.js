const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  pdfs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pdf",
    },
  ],
  userData: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserData",
  },
});

userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.passwordHash;
    return returnedObject;
  },
});

module.exports = mongoose.model("User", userSchema);
