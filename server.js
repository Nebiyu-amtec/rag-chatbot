const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const OPENAI_API_KEY = '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'; // ⛔ Replace with your actual API key

app.post('/', async (req, res) => {
  const tag = req.body.fulfillmentInfo?.tag;
  
  if (tag === 'chatgpt-fallback') {
    const userQuery = req.body.text || req.body.queryResult?.text || "What do you want to know?";

    try {
      const openaiRes = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            { role: "system", content: "You are a helpful IT assistant working for Amtec Links." },
            { role: "user", content: userQuery }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const reply = openaiRes.data.choices[0].message.content;

      res.json({
        fulfillment_response: {
          messages: [{ text: { text: [reply] } }]
        }
      });
    } catch (err) {
      console.error('OpenAI Error:', err.message);
      res.json({
        fulfillment_response: {
          messages: [{ text: { text: ["Sorry, something went wrong."] } }]
        }
      });
    }
  } else {
    res.json({
      fulfillment_response: {
        messages: [{ text: { text: ["Invalid or missing fulfillment tag."] } }]
      }
    });
  }
});


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`ChatGPT webhook running on http://localhost:${PORT}`));
