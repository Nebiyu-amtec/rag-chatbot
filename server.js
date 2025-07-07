require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Your fine-tuned model ID (replace with your actual model ID after training)
const FINE_TUNED_MODEL = process.env.FINE_TUNED_MODEL || "ft:gpt-3.5-turbo-0613:your-org::your-model-id";

// Keywords that must appear in valid Amtec Links responses
const AMTEC_KEYWORDS = [
  "amtec", "hardware", "software", "cloud", "consultancy",
  "mission", "vision", "muhammad", "intissar", "uae", 
  "ras al khaimah", "dell", "lenovo", "microsoft", "seagate",
  "zebra", "aws", "azure", "google cloud", "support"
];

// Strict validation function
const isAboutAmtec = (response) => {
  const lowerResponse = response.toLowerCase();
  return AMTEC_KEYWORDS.some(keyword => lowerResponse.includes(keyword));
};

// Webhook endpoint
app.post('/', async (req, res) => {
  const userQuery = req.body.queryText || req.body.text || "";
  
  try {
    // Get response from fine-tuned model
    const completion = await openai.chat.completions.create({
      model: FINE_TUNED_MODEL,
      messages: [
        { 
          role: "system", 
          content: "You are Amtec Links' official support bot. " +
                  "ONLY answer questions about Amtec Links' products, services, or company information. " +
                  "Reject all other topics with: " +
                  "\"I specialize in Amtec Links inquiries. Please ask about our IT solutions or company info.\""
        },
        { role: "user", content: userQuery }
      ],
      temperature: 0.0, // No creativity
      max_tokens: 150
    });

    let aiReply = completion.choices[0].message.content;

    // Final validation - ensure response is about Amtec Links
    if (!isAboutAmtec(aiReply)) {
      aiReply = "I specialize in Amtec Links inquiries. Please ask about our IT solutions or company info.";
    }

    // Dialogflow CX response format
    res.json({
      fulfillmentResponse: {
        messages: [{
          text: {
            text: [aiReply]
          }
        }]
      }
    });

  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({
      fulfillmentResponse: {
        messages: [{
          text: {
            text: ["Sorry, I'm having trouble responding. Please contact info@amteclinks.com directly."]
          }
        }]
      }
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Amtec Links bot server running on port ${PORT}`);
  console.log(`🔒 Using fine-tuned model: ${FINE_TUNED_MODEL}`);
  
  // Warning if using default model ID
  if (FINE_TUNED_MODEL.includes("your-model-id")) {
    console.warn("⚠️ WARNING: Using placeholder model ID. Replace with your actual fine-tuned model ID!");
  }
});
