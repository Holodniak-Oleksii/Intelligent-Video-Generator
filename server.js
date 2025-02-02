require("dotenv").config();
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = 3000;

// Статична папка
app.use(express.static("public"));
app.use(express.json());

const uploadsFolder = "public/uploads";

// Налаштування для збереження файлів
const uploadDir = path.join(__dirname, uploadsFolder);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${file.fieldname}-${timestamp}.${file.mimetype.split("/")[1]}`);
  },
});
const upload = multer({ storage });

const generateTimestamp = () => {
  const now = new Date();
  return now.toISOString().replace(/[-:]/g, "").split(".")[0];
};

app.post("/api/generate-audio", async (req, res) => {
  const { text } = req.body;
  const timestamp = generateTimestamp();
  const audioFilePath = path.join(
    __dirname,
    uploadsFolder,
    `audio_${timestamp}.mp3`
  );

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.VOICE_ID}`, // Replace with your voice ID
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
    response.data.on("end", () => {
      res.json({
        success: true,
        audioUrl: `/uploads/audio_${timestamp}.mp3`,
      });
    });
  } catch (error) {
    console.error("Error generating audio:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to generate audio" });
  }
});

// 🔵 Генерація відео через Adobe Express
app.post("/api/generate-video", async (req, res) => {
  try {
    const { audioUrl } = req.body;
    console.log("audioUrl :", audioUrl);
    const response = await axios.post(
      "https://new.express.adobe.com/api/video/generate",
      { audioUrl },
      {
        headers: {
          Authorization: `Bearer ${process.env.ADOBE_EXPRESS_API_KEY}`,
        },
      }
    );
    console.log("response :", response);

    const videoPath = path.join(uploadDir, `video-${Date.now()}.mp4`);
    fs.writeFileSync(videoPath, response.data);

    res.json({
      success: true,
      videoUrl: `/${uploadsFolder}/${path.basename(videoPath)}`,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Помилка генерації відео" });
  }
});

// 🟡 Додавання тексту на відео через Canva
app.post("/api/add-title", async (req, res) => {
  try {
    const { videoUrl, title } = req.body;
    const response = await axios.post(
      "https://api.canva.com/v1/video/add-text",
      { videoUrl, title },
      { headers: { Authorization: `Bearer ${process.env.CANVA_API_KEY}` } }
    );

    const finalVideoPath = path.join(uploadDir, `fullset-${Date.now()}.mp4`);
    fs.writeFileSync(finalVideoPath, response.data);

    res.json({
      success: true,
      finalVideoUrl: `/uploads/${path.basename(finalVideoPath)}`,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Помилка додавання тексту" });
  }
});

app.listen(PORT, () =>
  console.log(`Сервер запущено на http://localhost:${PORT}`)
);
