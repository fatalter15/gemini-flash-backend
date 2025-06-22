import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const upload = multer({ dest: 'uploads/' });

const imageToGenerativePart = (filepath) => ({
  inlineData: {
    data: fs.readFileSync(filepath).toString('base64'),
    mimeType: "image/png"
  }
});

async function generateAIResponse(prompt) {
  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
  });

  const text = await result.text();
  return text;
}

app.post("/generate-text", async (req, res) => {
  const { prompt } = req.body;

  try {
    const text = await generateAIResponse(prompt);
    res.json({ result: text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function generateAIImageResponse([prompt, image]) {
  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        parts: [
          image,
          { text: prompt }
        ]
      }
    ],
  });

  const text = await result.text;
  return text;
}

app.post("/generate-from-image", upload.single('image'), async (req, res) => {
  const prompt = req.body.prompt || "Describe the image";
  
  const image = imageToGenerativePart(req.file.path);
  
  try {
    const result = await generateAIImageResponse([prompt, image]);
    fs.unlinkSync(req.file.path); 
    res.json({ result });
  } catch (error) {
    fs.unlinkSync(req.file.path); 
    res.status(500).json({ error: error.message });
  }
});

app.post("/generate-from-document", upload.single('document'), async (req, res) => {
  const filepath = req.file.path
  const buffer = fs.readFileSync(filepath)
  const base64data = buffer.toString('base64')
  const mimeType = req.file.mimetype

  try {
    const contents = [
      { text: "Summarize this document" },
      {
        inlineData: {
          mimeType: mimeType,
          data: base64data,
        },
      },
    ];

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });

    const text = await result.text;
    res.json({ result: text });
    fs.unlinkSync(filepath); 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

})

app.post("/generate-from-audio", upload.single('audio'), async (req, res) => {
  const filepath = req.file.path
  const buffer = fs.readFileSync(filepath)
  const base64data = buffer.toString('base64')
  const mimeType = req.file.mimetype

  try {
    const contents = [
      { text: "Summarize this audio" },
      {
        inlineData: {
          mimeType: mimeType,
          data: base64data,
        },
      },
    ];

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });

    const text = await result.text;
    res.json({ result: text });
    fs.unlinkSync(filepath); 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

})

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
