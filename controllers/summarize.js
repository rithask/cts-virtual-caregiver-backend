const summarizeRouter = require("express").Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { authenticate } = require("../utils/middleware");
const config = require("../utils/config");

summarizeRouter.post("/summarize", authenticate, async (req, res) => {
  try {
    const { summaryObject } = req.body;

    if (!summaryObject) {
      return res
        .status(400)
        .json({ error: "Missing summaryObject in request body." });
    }

    const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Summarize the following patient data into a brief, concise report suitable for medical professionals. Return the result in plain text: ${JSON.stringify(
      summaryObject,
      null,
      2
    )}`;

    const result = await model.generateContent([prompt]);
    console.log("Generated summary: ", result);

    const rawResponse = result.response.text();

    res.json({ summary: rawResponse });
  } catch (error) {
    console.error("Error generating summary:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = summarizeRouter;
