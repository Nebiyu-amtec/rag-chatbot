const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// 🔐 Replace this with your real OpenAI key (keep it secret in production!)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post('/', async (req, res) => {
  // Extract the Dialogflow fulfillment tag
  const tag = req.body.fulfillmentInfo?.tag;

  // Only respond if this is the correct fallback tag
  if (tag === 'chatgpt-fallback') {
    // Try to extract the user query from the session or raw payload
    const userQuery =
      req.body.sessionInfo?.parameters?.text || 
      req.body.text || 
      req.body.queryResult?.text || 
      "What would you like to know?";

    try {
      // Send the query to the OpenAI ChatGPT API
      const openaiRes = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a friendly and professional IT assistant at Amtec Links. Answer clearly and concisely.',
            },
            {
              role: 'user',
              content: userQuery,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Extract GPT's response
      const reply = openaiRes.data.choices[0].message.content;

      // Send response back to Dialogflow CX
      res.json({
        fulfillment_response: {
          messages: [
            {
              text: {
                text: [reply],
              },
            },
          ],
        },
      });
    } catch (err) {
      // Log detailed error for debugging
      console.error('OpenAI Error:', err.response?.data || err.message);

      // Send fallback error message to user
      res.json({
        fulfillment_response: {
          messages: [
            {
              text: {
                text: ['Sorry, I couldn’t get an answer right now. Please try again.'],
              },
            },
          ],
        },
      });
    }
  } else {
    // If tag is missing or doesn't match, return a default reply
    res.json({
      fulfillment_response: {
        messages: [
          {
            text: {
              text: ['Invalid or missing fulfillment tag.'],
            },
          },
        ],
      },
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ ChatGPT webhook running at http://localhost:${PORT}`));
