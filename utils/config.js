require("dotenv").config();

const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT;
const S3_BUCKET = process.env.S3_BUCKET;
const S3_URL = process.env.S3_URL;

module.exports = {
  AWS_ACCESS_KEY,
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY,
  GEMINI_API_KEY,
  JWT_SECRET,
  MONGODB_URI,
  PORT,
  S3_BUCKET,
  S3_URL,
};
