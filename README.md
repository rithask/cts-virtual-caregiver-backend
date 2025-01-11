# cts-virtual-caregiver-backend

backend for cts virtual caregiver.

## Getting Started

1. Clone the repository `git clone https://github.com/rithask/cts-virtual-caregiver-backend.git`
2. Copy the `.env.example` file to `.env` and fill in the required values.

- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_REGION` are required for the AWS S3 storage.
- `GEMINI_API_KEY` is required for the Gemini API.
- `JWT_SECRET` can be any random string and can be generated using `openssl rand -hex 32`.
- `MONGO_URI` is the connection string for the MongoDB database.
- `PORT` is the port on which the server will run.
- `S3_BUCKET` and `S3_URL` are required for the AWS S3 storage.

3. Install the dependencies `npm install`
4. Start the server `npm start`
5. Configure the frontend to use the backend by setting the `newURL` in the `src/apiConfig.tsx` file of the frontend to the URL of the backend.

The server will run on the port specified in the `.env` file.
