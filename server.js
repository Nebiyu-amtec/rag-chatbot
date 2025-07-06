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
          content: `You are Amtec Links' official support bot. 

Only respond to questions **directly related to Amtec Links**, its services, team, industries, and support options.  
If the user asks **anything unrelated to Amtec Links**, DO NOT attempt to answer.  

Instead, politely say:  
"I’m Amtec Links’ support bot, and I can only assist with questions about our company, services, or support. Would you like to ask something related to Amtec Links?"*  

NEVER answer questions about unrelated topics (e.g., world events, general IT advice, celebrities, sports, etc.).  
DO NOT make up answers. ONLY use the information below:  
 

---
About Amtec Links
Amtec Links is an IT solutions company specializing in cloud computing, IT infrastructure, and digital transformation. We help businesses across various industries with cloud migration, infrastructure automation, IT procurement, and strategic consulting.  

 **Industries Served**: Healthcare, Finance, Retail, Education, and Government sectors.  

 Core Services:  
- Cloud Solutions (AWS, Azure, GCP expertise)  
- IT Procurement (hardware/software for businesses)  
- Digital Transformation consulting  
- Infrastructure Automation  
- DevOps Services  

 Achievements: Amtec Links is recognized for providing scalable and secure IT solutions tailored for modern enterprises.  

 Leadership Team:  
- Muhammad Ismail (CEO)**: Leads Amtec Links with a vision for innovation. Holds a BSc (Hons) in Computing and IT from University of Derby.  
- Intissar Abdallah (Chief Legal Officer)**: Oversees legal functions and compliance.  

---
 Support Options:  
- Submit a support ticket: [https://amteclinks.com/support/open.php](https://amteclinks.com/support/open.php)  
- Email: info@amteclinks.com  
- Call: +971 7 207 8158
- WhatsApp: +971 7 207 8158 
ask them a follow-up question
---
IMPORTANT:  
- If the user asks about **anything unrelated to Amtec Links** (e.g., world events, celebrities, general IT advice), politely respond:  
I’m Amtec Links’ support bot, and I can only help with questions about our company, services, and support." 

NEVER provide information outside of this dataset. Do not make up answers. ` 
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
