const config = require("../utils/config");
const jwt = require("jsonwebtoken");
const uploadRouter = require("express").Router();
const user = require("../models/user");
const Pdf = require("../models/pdf");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
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
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["application/pdf"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type"));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5 MB
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

      // const pdf = new Pdf({
      //   filename: request.file.originalname,
      //   s3Url: request.file.location,
      //   uploadedBy: request.user.id,
      // });

      // await pdf.save();
      // await user.findByIdAndUpdate(request.user.id, {
      //   $push: { pdfs: pdf._id },
      // });

      // response.status(201).json({ pdf, message: "File uploaded successfully" });

      const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // const latestPDF = await Pdf.findOne({ uploadedBy: request.user.id }).sort(
      //   {
      //     createdAt: -1,
      //   }
      // );

      // const pdfResponse = await axios({
      //   method: "GET",
      //   url: latestPDF.s3Url,
      //   responseType: "arraybuffer",
      // });

      const pdfPart = {
        inlineData: {
          data: request.file.buffer.toString("base64"),
          mimeType: "application/pdf",
        },
      };

      const prompt = `Extract the following details from the medical document and return them in a structured JSON format:
      {
        "patient": {
          "name": "<patient's name>",
          "age": "<patient's age>"
        },
        "treating_consultant": {
          "name": "<doctor's name>",
          "specialty": "<doctor's specialty>",
          "hospital": "<hospital name>"
        },
        "discharge_details": {
          "prescribed_illness": "<diagnosed illness>",
          "prescription": [
            {
              "medicine_name": "<medicine name>",
              "dosage": "<dosage instructions>",
              "time": <a string of 4 characters, each '1' or '0', representing whether medication is to be taken on that time. For example, '1111' means medication is to be taken on morning, noon, and evening, night, if no such details are available,then fill default as 1101.>"
              "duration": "<how long to take>",
              "days":"<a string of 7 characters, each '1' or '0', representing whether medication is to be taken on that day. For example, '1100100' means medication is to be taken on Sunday, Monday, and Thursday, but not on other days.if no details mentioned about day, then default value will be 1111111>"
              }
          ],
          "follow_up_date": "<follow-up date>",
          "diet_recommendation": {
            "breakfast": ["<item 1>", "<item 2>"],
            "lunch": ["<item 1>", "<item 2>"],
            "dinner": ["<item 1>", "<item 2>"]
          },
          "exercise_recommendation": {
            "exercise_1": "<exercise details>"
          }
        }
      }
      `;

      const result = await model.generateContent([prompt, pdfPart]);

      const resultData = result.response.candidates[0].content.parts[0].text;
      const resultDataJson = JSON.parse(
        resultData.replace(/```json\n|```/g, "")
      );

      response.status(200).json({ data: resultDataJson });
    } catch (error) {
      console.error("Error uploading file:", error.message);
      response.status(500).json({ error: error.message });
    }
  }
);

module.exports = uploadRouter;
