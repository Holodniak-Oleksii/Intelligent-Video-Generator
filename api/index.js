require("dotenv").config();

const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();

app.use(express.static("public"));
app.use(express.json());

const uploadsFolder = path.join("/tmp", "uploads");

if (!fs.existsSync(uploadsFolder)) {
  fs.mkdirSync(uploadsFolder, { recursive: true });
}

app.use("/uploads", express.static(uploadsFolder));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsFolder),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${file.fieldname}-${timestamp}.${file.mimetype.split("/")[1]}`);
  },
});

multer({ storage });

app.get("/", (req, res) => {
  res.send("Сервер працює! 🚀");
});
const generateTimestamp = () => {
  return new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
};

app.post("/api/generate-audio", async (req, res) => {
  const { text } = req.body;
  const timestamp = generateTimestamp();
  const audioFilePath = path.join(uploadsFolder, `audio_${timestamp}.mp3`);

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.VOICE_ID}`,
      { text },
      {
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        responseType: "stream",
      }
    );

    response.data.pipe(fs.createWriteStream(audioFilePath));
    const audioUrl = `${req.protocol}://${req.get(
      "host"
    )}/uploads/audio_${timestamp}.mp3`;

    response.data.on("end", () => {
      res.json({ success: true, audioUrl });
    });
  } catch (error) {
    console.error("Error generating audio:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to generate audio" });
  }
});

app.post("/api/generate-video", async (req, res) => {
  try {
    const { audioUrl } = req.body;
    const response = await axios.post(
      "https://new.express.adobe.com/api/video/generate",
      { audioUrl },
      {
        headers: {
          Authorization: `Bearer ${process.env.ADOBE_EXPRESS_API_KEY}`,
        },
      }
    );

    const videoPath = path.join(uploadsFolder, `video-${Date.now()}.mp4`);
    fs.writeFileSync(videoPath, response.data);

    res.json({
      success: true,
      videoUrl: `/uploads/${path.basename(videoPath)}`,
    });
  } catch (error) {
    console.error("Error generating video:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to generate video" });
  }
});

app.post("/api/add-title", async (req, res) => {
  try {
    const { videoUrl, title } = req.body;
    const response = await axios.post(
      "https://api.canva.com/v1/video/add-text",
      { videoUrl, title },
      { headers: { Authorization: `Bearer ${process.env.CANVA_API_KEY}` } }
    );

    const finalVideoPath = path.join(
      uploadsFolder,
      `fullset-${Date.now()}.mp4`
    );
    fs.writeFileSync(finalVideoPath, response.data);

    res.json({
      success: true,
      finalVideoUrl: `/uploads/${path.basename(finalVideoPath)}`,
    });
  } catch (error) {
    console.error("Error adding title:", error);
    res.status(500).json({ success: false, message: "Failed to add title" });
  }
});

module.exports = app;
