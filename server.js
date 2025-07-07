const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Secure your API key

app.post('/', async (req, res) => {
  const tag = req.body.fulfillmentInfo?.tag;

  if (tag === 'chatgpt-fallback') {
    const userQuery =
      req.body.sessionInfo?.parameters?.text ||
      req.body.text ||
      req.body.queryResult?.text ||
      "What do you want to know?";

    try {
      // Re-inject company rules every fallback
      const systemPrompt = `
You are Amtec Links' official support chatbot.  

✅ ONLY respond to questions directly related to Amtec Links, its services, team, industries, and support options.  
🚫 If the user asks anything unrelated to Amtec Links, DO NOT answer. Instead, always reply:  
"I’m Amtec Links’ support bot, and I can only assist with questions about our company, services, or support. Would you like to ask something related to Amtec Links?"

📌 **Amtec Links Company Information**:  

- **About Us**: Amtec Links is an IT solutions company providing cloud computing, IT infrastructure, and digital transformation services.  
- **Services**: Cloud Solutions, IT Procurement, Consultancy, Cybersecurity, Web & App Development, Corporate Branding, Training.  
- **Industries Served**: Healthcare, Finance, Retail, Education, Government.  
- **Leadership**: Muhammad Ismail (CEO), Intissar Abdallah (CLO).  
- **Working Hours**: Mon–Thu 9 AM–5 PM; Fri 9 AM–12:30 PM; Sat–Sun Closed  
- **Support Options**: Ticketing system, Email, Phone, WhatsApp.  

🚫 DO NOT answer general knowledge questions.  
🚫 DO NOT make up information not in this dataset.  
      `;

      const openaiRes = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          temperature: 0,
          messages: [
            { role: "system", content: systemPrompt },
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

      let reply = openaiRes.data.choices[0].message.content;

      // Hard fallback if GPT still tries to answer unrelated stuff
      if (
        !reply.toLowerCase().includes("amtec links") &&
        !reply.toLowerCase().includes("i’m amtec links’ support bot")
      ) {
        reply = "I’m Amtec Links’ support bot, and I can only assist with questions about our company, services, or support. Would you like to ask something related to Amtec Links?";
      }

      res.json({
        fulfillment_response: {
          messages: [
            { text: { text: [reply] } }
          ]
        }
      });
    } catch (err) {
      console.error('OpenAI Error:', err.response?.data || err.message);
      res.json({
        fulfillment_response: {
          messages: [
            { text: { text: ["Sorry, I couldn’t get an answer right now. Please try again later."] } }
          ]
        }
      });
    }
  } else {
    res.json({
      fulfillment_response: {
        messages: [
          { text: { text: ["Invalid or missing fulfillment tag."] } }
        ]
      }
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Amtec Links ChatGPT webhook running at http://localhost:${PORT}`));
