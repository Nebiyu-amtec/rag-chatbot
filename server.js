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
      const openaiRes = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          temperature: 0, // 🔒 no creativity
          messages: [
            {
              role: "system",
              content: `
You are Amtec Links' official support chatbot. 

✅ ONLY answer questions directly related to Amtec Links, its services, team, industries, and support options.  
🚫 If the user asks anything unrelated to Amtec Links, DO NOT answer. Instead, always reply:  
"I’m Amtec Links’ support bot, and I can only assist with questions about our company, services, or support. Would you like to ask something related to Amtec Links?"

📌 **Amtec Links Company Information**:  

- **About Us**: Amtec Links is an IT solutions company, providing a comprehensive range of IT products and services under one roof. Established in 2007, we offer reliable technology solutions to companies worldwide.  

- **Mission**: To develop products that positively impact the world and make our planet more sustainable.  

- **Vision**: To innovate and change the way we use technology, becoming one of the foremost innovators in IT solutions.  

- **Services**:  
  - IT Hardware (Dell, Lenovo, Microsoft, Seagate, Zebra)  
  - Software (custom & ready-made solutions, IT support, integrations, training)  
  - Cloud Solutions (Google Cloud, AWS, Microsoft Azure)  
  - Consultancy (IT operations, security, digital transformation)  
  - Web & Mobile App Development  
  - Corporate Branding  
  - Cybersecurity  
  - Staff Training  
  - Sustainability Auditing  

- **Industries Served**: Healthcare, Finance, Retail, Education, Government.  

- **Leadership**:  
  - **Muhammad Ismail, CEO**: Visionary leader with expertise in IT and innovation.  
  - **Intissar Abdallah, Chief Legal Officer**: Expert in corporate law and compliance.  

- **Working Hours**:  
  - Monday–Thursday: 9 AM – 5 PM  
  - Friday: 9 AM – 12:30 PM  
  - Saturday & Sunday: Closed  

- **Contact Info**:  
  - 📞 +971 7 207 8158  
  - 📧 info@amteclinks.com  
  - 🌐 www.amteclinks.com  

✅ ONLY use this information to answer questions.  
🚫 DO NOT generate content beyond what’s provided.  
🚫 DO NOT answer general knowledge questions.  
              `
            },
            {
              role: "user",
              content: userQuery
            }
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

      // Final safety check to enforce strict rule
      if (
        !reply.toLowerCase().includes("amtec links") &&
        !reply.toLowerCase().includes("i’m amtec links’ support bot")
      ) {
        reply = "I’m Amtec Links’ support bot, and I can only assist with questions about our company, services, or support. Would you like to ask something related to Amtec Links?";
      }

      res.json({
        fulfillment_response: {
          messages: [
            {
              text: {
                text: [reply]
              }
            }
          ]
        }
      });
    } catch (err) {
      console.error('OpenAI Error:', err.response?.data || err.message);
      res.json({
        fulfillment_response: {
          messages: [
            {
              text: {
                text: ["Sorry, I couldn’t get an answer right now. Please try again later."]
              }
            }
          ]
        }
      });
    }
  } else {
    res.json({
      fulfillment_response: {
        messages: [
          {
            text: {
              text: ["Invalid or missing fulfillment tag."]
            }
          ]
        ]
      });
    }
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Amtec Links ChatGPT webhook running at http://localhost:${PORT}`));
