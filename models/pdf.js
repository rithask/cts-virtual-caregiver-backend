const mongoose = require("mongoose");

const pdfSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    s3Url: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

pdfSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Pdf", pdfSchema);
