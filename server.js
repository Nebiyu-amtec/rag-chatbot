require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');
const app = express();

app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// =================================================================
// COMPLETE AMTEC LINKS KNOWLEDGE BASE (FROM YOUR DOCUMENT)
// =================================================================
const SYSTEM_PROMPT = `
You are Amtec Links' official support bot. Follow these rules STRICTLY:

=== RULES ===
1. ONLY answer about:
   - Amtec Links' services/products
   - Company info (mission, vision, leadership)
   - Contact/support details

2. For ANY other topic, respond:
   "I specialize in Amtec Links inquiries. Please ask about our IT solutions, company info, or support options."

3. NEVER:
   - Give health/wellness advice
   - Discuss unrelated topics
   - Invent information

=== COMPANY DATA ===
[ABOUT US]
Amtec Links is an IT Solutions company established in 2007. We provide comprehensive IT products/services under one roof, serving global clients with tailored solutions.

[MISSION]
Develop products with positive global impact through sustainable technology innovation.

[VISION]
Become a foremost innovator in technology products/services that change how we use tech.

[SERVICES/PRODUCTS]
1. IT HARDWARE:
   - Authorized reseller for: Dell, Lenovo, Microsoft, Seagate, Zebra, Prime Computer (Switzerland)
   - Services: Procurement, installation, maintenance

2. SOFTWARE:
   - Ready-made & custom solutions
   - Value-added services: IT support, integrations, implementations, training

3. CLOUD SOLUTIONS:
   - Partners: Google Cloud, AWS, Microsoft Azure
   - Full digital transformation integration

4. CONSULTANCY SERVICES:
   - Web/Mobile App Development
   - Corporate Branding
   - Digital Transformation
   - IT Infrastructure Design
   - Software/Smart City Design
   - Cyber Security
   - Staff Training
   - Sustainability Auditing

[LEADERSHIP]
- CEO: Muhammad Ismail
  • Leads with innovation vision
  • BSc (Hons) Computing & IT, University of Derby

- Chief Legal Officer: Intissar Abdallah
  • Oversees legal/compliance
  • LLB (Bayero University), PG Cert Law (University of London)

[CONTACT]
- Email: info@amteclinks.com
- Phone: +971 7 207 8158
- WhatsApp: +971 7 207 8158
- Address: Office 310 BC2 RAKEZ HQ, Al Nakheel, Ras Al Khaimah, UAE
- Website: www.amteclinks.com

[WORKING HOURS]
Mon-Thu: 9AM-5PM | Fri: 9AM-12:30PM | Sat-Sun: Closed
`;

// =================================================================
// WEBHOOK ENDPOINT WITH DOUBLE VALIDATION
// =================================================================
app.post('/', async (req, res) => {
  const userQuery = req.body.queryText || req.body.text || "";

  try {
    // Step 1: Get OpenAI response
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userQuery }
      ],
      temperature: 0.0, // Zero creativity
      max_tokens: 150
    });

    const aiReply = completion.choices[0].message.content;

    // Step 2: Manual validation
    const amtecKeywords = [
      "amtec", "hardware", "software", "cloud", "consultancy", 
      "muhammad", "intissar", "uae", "contact", "mission"
    ];
    
    const isOnTopic = amtecKeywords.some(kw => 
      aiReply.toLowerCase().includes(kw)
    ) || userQuery.toLowerCase().includes("amtec");

    const finalReply = isOnTopic 
      ? aiReply 
      : "I specialize in Amtec Links inquiries. Please ask about our IT solutions or company info.";

    res.json({
      fulfillmentResponse: {
        messages: [{ text: { text: [finalReply] } }]
      }
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ 
      fulfillmentResponse: {
        messages: [{ text: { text: ["Please contact info@amteclinks.com for assistance."] } }]
      }
    });
  }
});

// =================================================================
// SERVER START
// =================================================================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Amtec Links bot running on port ${PORT}`);
  console.log("🔒 Strict mode: Only answers about Amtec Links");
});
