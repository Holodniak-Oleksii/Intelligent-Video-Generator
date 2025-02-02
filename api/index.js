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

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsFolder),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${file.fieldname}-${timestamp}.${file.mimetype.split("/")[1]}`);
  },
});
const upload = multer({ storage });

app.get("/", (req, res) => {
  res.send("Сервер працює! 🚀");
});

// ✅ Генерація аудіо через ElevenLabs
app.post("/api/generate-audio", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res
        .status(400)
        .json({ success: false, message: "Текст відсутній" });
    }

    const timestamp = Date.now();
    const audioFilePath = path.join(uploadsFolder, `audio_${timestamp}.mp3`);

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
    console.error(
      "Помилка генерації аудіо:",
      error.response?.data || error.message
    );
    res
      .status(500)
      .json({ success: false, message: "Помилка генерації аудіо" });
  }
});

// ✅ Запуск сервера тільки локально
if (process.env.NODE_ENV !== "production") {
  const PORT = 3000;
  app.listen(PORT, () =>
    console.log(`Локальний сервер запущено на http://localhost:${PORT}`)
  );
}

// Експортуємо для Vercel
module.exports = app;
