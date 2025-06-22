require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');
const app = express();

app.use(express.json());

// Initialize OpenAI with environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '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' // Fallback for testing ONLY
});

// Validate API key on startup
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️ Warning: OPENAI_API_KEY not set in .env');
}

app.post('/', async (req, res) => {
  console.log('Received request:', JSON.stringify(req.body, null, 2)); // Debug logging

  try {
    // Extract user query from Dialogflow CX payload
    const userQuery = req.body.text || 
                     req.body.queryResult?.queryText || 
                     "How can I help you?";
    
    // Get ChatGPT response
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You're an IT consultant for Amtec Links. Answer professionally in 1-2 sentences." 
        },
        { role: "user", content: userQuery }
      ],
      max_tokens: 100
    });

    const reply = completion.choices[0].message.content;

    // Dialogflow CX response format
    res.json({
      fulfillmentResponse: {
        messages: [{
          text: {
            text: [reply]
          }
        }]
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      fulfillmentResponse: {
        messages: [{
          text: {
            text: ["Sorry, I'm having trouble answering. Please try again later."]
          }
        }]
      }
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️ Running in TEST MODE (no real OpenAI key)');
  }
});
