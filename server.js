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
const STRICT_RULES = `
<<< STRICT INSTRUCTIONS >>>
1. YOU ARE AMTEC LINKS' OFFICIAL BOT. ONLY ANSWER QUESTIONS ABOUT:
   - IT solutions (hardware/software/cloud)
   - Company info (mission, vision, leadership)
   - Contact/support details

2. FOR ALL OTHER TOPICS, RESPOND:
   "I specialize in Amtec Links inquiries. Ask about our IT solutions, company info, or support options."

3. NEVER DISCUSS:
   - Health/wellness (snacks, ergonomics)
   - Unrelated topics (weather, sports, etc.)
   - Other companies
<<< END RULES >>>
`;

const AMTEC_KNOWLEDGE = `
<<< COMPANY DATA >>>

=== ABOUT AMTEC LINKS ===
IT Solutions company established in 2007. We provide comprehensive IT products/services under one roof, serving global clients with tailored solutions.

=== MISSION ===
Develop products with positive global impact through sustainable technology innovation.

=== VISION ===
Become a foremost innovator in technology products/services that change how we use tech.

=== IT HARDWARE ===
- Authorized reseller for: Dell, Lenovo, Microsoft, Seagate, Zebra, Prime Computer (Switzerland)
- Services: Procurement, installation, maintenance

=== SOFTWARE ===
- Ready-made & custom solutions
- Value-added services: IT support, integrations, implementations, training

=== CLOUD SOLUTIONS ===
- Partners: Google Cloud, AWS, Microsoft Azure
- Full digital transformation integration

=== CONSULTANCY SERVICES ===
- Web Development
- Mobile App Development
- Corporate Branding
- Digital Transformation
- IT Infrastructure Design
- Software Design
- Smart City Design
- Cyber Security
- Staff Training
- Sustainability Auditing

=== LEADERSHIP ===
- CEO: Muhammad Ismail
  • Leads with innovation vision
  • BSc (Hons) Computing & IT, University of Derby
- Chief Legal Officer: Intissar Abdallah
  • Oversees legal/compliance
  • LLB (Bayero University), PG Cert Law (University of London)

=== CONTACT DETAILS ===
- Email: info@amteclinks.com
- Phone: +971 7 207 8158
- WhatsApp: +971 7 207 8158
- Address: Office 310 BC2 RAKEZ HQ, Al Nakheel, Ras Al Khaimah, UAE
- Website: www.amteclinks.com

=== WORKING HOURS ===
Mon-Thu: 9AM-5PM | Fri: 9AM-12:30PM | Sat-Sun: Closed
<<< END KNOWLEDGE >>>
`;

// =================================================================
// WEBHOOK ENDPOINT WITH ACTIVE RULE REINFORCEMENT
// =================================================================
app.post('/', async (req, res) => {
  const userQuery = req.body.queryText || req.body.text || "";

  try {
    // Step 1: Initial attempt with full context
    let messages = [
      { 
        role: "system", 
        content: `${STRICT_RULES}\n\n${AMTEC_KNOWLEDGE}\n\nREMEMBER: ${STRICT_RULES}` 
      },
      { role: "user", content: userQuery }
    ];

    let completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.0, // Zero creativity
      max_tokens: 150
    });

    let aiReply = completion.choices[0].message.content;

    // Step 2: Detect and correct off-topic responses
    const isOffTopic = ![
      "amtec", "hardware", "software", "cloud", "contact", 
      "mission", "vision", "muhammad", "intissar", "uae"
    ].some(keyword => aiReply.toLowerCase().includes(keyword));

    if (isOffTopic) {
      // Reinforce rules and retry
      messages.push(
        { role: "assistant", content: aiReply },
        { 
          role: "user", 
          content: "CORRECTION: Your previous response was off-topic. " + 
                  "Remember: ONLY discuss Amtec Links' products, services, or company info."
        }
      );

      completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        temperature: 0.0,
        max_tokens: 150
      });
      aiReply = completion.choices[0].message.content;
    }

    // Final response
    res.json({
      fulfillmentResponse: {
        messages: [{ text: { text: [aiReply] } }]
      }
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ 
      fulfillmentResponse: {
        messages: [{ text: { text: ["Please contact info@amteclinks.com"] } }]
      }
    });
  }
});

// =================================================================
// SERVER START
// =================================================================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Amtec Links bot running with COMPLETE knowledge`);
  console.log("🔒 100% strict mode - No off-topic responses");
});
