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

      // response.status(201).json({ pdf, message: "File uploaded successfully" });

      const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const latestPDF = await Pdf.findOne({ uploadedBy: request.user.id }).sort(
        {
          createdAt: -1,
        }
      );

      const pdfResponse = await axios({
        method: "GET",
        url: latestPDF.s3Url,
        responseType: "arraybuffer",
      });

      const pdfPart = {
        inlineData: {
          data: Buffer.from(pdfResponse.data).toString("base64"),
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
                    "time": "<when to take>",
                    "duration": "<how long to take>"
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
