const transcribeRouter = require("express").Router();
const config = require("../utils/config");
const { authenticate } = require("../utils/middleware");
const { AssemblyAI } = require("assemblyai");

app.post(
  "/transcribe",
  authenticate,
  upload.single("audio_file"),
  async (req, res) => {
    try {
      const filePath = req.file.path;
      const data = {
        audio: fs.createReadStream(filePath),
      };

      const client = new AssemblyAI({ apikey: config.ASSEMBLY_API_KEY });
      const transcript = await client.transcripts.transcribe(data);

      res.status(200).json({
        text: transcript.text,
      });

      fs.unlinkSync(filePath);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to process transcription" });
    }
  }
);

module.exports = transcribeRouter;
