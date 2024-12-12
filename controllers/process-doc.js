const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const config = require("../utils/config");
const app = require("express").Router();
const { authenticate } = require("../utils/middleware");
const Pdf = require("../models/pdf");
const axios = require("axios");

app.post("/", authenticate, async (request, response) => {
  try {
    const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const pdfs = await Pdf.findOne({ uploadedBy: request.user.id }).sort({
      createdAt: -1,
    });
    fileUrl = pdfs.s3Url;

    const pdfResponse = await axios({
      method: "GET",
      url: fileUrl,
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
    const resultDataJson = JSON.parse(resultData.replace(/```json\n|```/g, ""));

    response.status(200).json({ data: resultDataJson });
  } catch (error) {
    console.log(error);
    response.status(500).json({ error: "Internal server error" });
  }
});

module.exports = app;
