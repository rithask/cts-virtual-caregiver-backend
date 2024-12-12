const config = require("../utils/config");
const jwt = require("jsonwebtoken");
const uploadRouter = require("express").Router();
const user = require("../models/user");
const Pdf = require("../models/pdf");
const { authenticate } = require("../utils/middleware");

const {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");

const s3 = new S3Client({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: config.S3_BUCKET,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, `${Date.now().toString()}-${file.originalname}`);
    },
    acl: "public-read",
  }),
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["application/pdf"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type"));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

uploadRouter.get("/", authenticate, async (request, response) => {
  try {
    const pdfs = await Pdf.find({ uploadedBy: request.user.id }).sort({
      createdAt: -1,
    });

    response.status(200).json(
      pdfs.map((pdf) => ({
        id: pdf._id,
        filename: pdf.filename,
        s3Url: pdf.s3Url,
        createdAt: pdf.createdAt,
      }))
    );
  } catch (error) {
    console.error("Error fetching files:", error.message);
    response.status(500).json({ error: error.message });
  }
});

uploadRouter.post(
  "/",
  authenticate,
  upload.single("file"),
  async (request, response) => {
    try {
      if (!request.file) {
        return response.status(400).json({ error: "No file uploaded" });
      }

      const pdf = new Pdf({
        filename: request.file.originalname,
        s3Url: request.file.location,
        uploadedBy: request.user.id,
      });

      await pdf.save();
      await user.findByIdAndUpdate(request.user.id, {
        $push: { pdfs: pdf._id },
      });

      response.status(201).json({ pdf, message: "File uploaded successfully" });
    } catch (error) {
      console.error("Error uploading file:", error.message);
      response.status(500).json({ error: error.message });
    }
  }
);

module.exports = uploadRouter;
