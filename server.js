require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

// =====================
// HARDCODED KNOWLEDGE BASE (ONLY FROM YOUR DOCUMENT)
// =====================
const AMTEC_KNOWLEDGE = {
  about: "Amtec Links is an IT Solutions company, we provide a comprehensive range of IT products and services under one roof. Established in 2007, we have grown into a leading organization that provides reliable technology solutions to companies around the world. Our experienced team works closely with clients to understand their needs and provide tailored solutions.",

  mission: "To develop products that will have a positive impact on the world. We are constantly inventing new technologies with this goal in mind, and hope they help make our planet more sustainable overall.",

  vision: "To develop products and services that change the way we use technology and to become one of the foremost innovators of technology products and services.",

  hardware: "We are authorized resellers of some of the best IT Hardware manufacturers like Dell, Lenovo, Microsoft, Seagate, Zebra, and Prime Computer (Switzerland). We procure, install, and maintain IT Hardware for corporations of any size.",

  software: "We provide both ready-made and custom-made software solutions to corporations. In addition to that, we also provide value-added services such as IT support, integrations, implementations, and training.",

  cloud: "Cloud Solutions is one of our core services. We integrate every other aspect with our cloud solutions to achieve digital transformation. We partner with Google Cloud, AWS, and Microsoft Azure as our infrastructure providers to provide reliable and efficient cloud solutions.",

  services: [
    "Web Development", "Mobile App Development", "Corporate Branding", 
    "Digital Transformation", "IT Infrastructure Design", "Software Design",
    "Smart City Design", "Cyber Security", "Staff Training", "Sustainability Auditing"
  ].join(", "),

  contact: `
    Email: info@amteclinks.com
    Telephone: +971 7 207 8158
    WhatsApp: +971 7 207 8158
    Address: Office 310 BC2 RAKEZ HQ Island Street, Al Nakheel, PO Box 40383, Ras Al Khaimah, UAE
    Website: www.amteclinks.com
  `,

  hours: `
    Monday-Thursday: 9 AM - 5 PM
    Friday: 9 AM - 12:30 PM
    Saturday-Sunday: Closed
  `,

  leadership: {
    ceo: "Muhammad Ismail (CEO): Leading the company with a vision for innovation and strategic growth. Holds a BSc (Honours) in Computing and Information Technologies from the University of Derby.",
    legal: "Intissar Abdallah (Chief Legal Officer): Oversees the company's legal functions, ensuring regulatory adherence and strategic risk management. Holds an LLB from Bayero University and a Postgraduate Certificate in Law from the University of London."
  }
};

// =====================
// STRICT QUERY HANDLING
// =====================
const isAboutAmtec = (query) => {
  const amtecKeywords = [
    "amtec links", "it solutions", "hardware", "software", "cloud", 
    "consultancy", "web development", "mobile app", "corporate branding",
    "digital transformation", "it infrastructure", "smart city", 
    "cyber security", "staff training", "sustainability auditing", 
    "mission", "vision", "contact", "working hours", "muhammad ismail", 
    "intissar abdallah", "uae", "ras al khaimah", "ceo", "legal officer",
    "services", "support", "products", "company"
  ];
  return amtecKeywords.some(keyword => query.includes(keyword.toLowerCase()));
};

// =====================
// WEBHOOK ENDPOINT
// =====================
app.post('/', (req, res) => {
  const userQuery = (req.body.text || req.body.queryResult?.queryText || "").toLowerCase();
  let reply;

  // REJECT UNRELATED QUERIES
  if (!isAboutAmtec(userQuery)) {
    reply = "I’m Amtec Links’ support bot and can only assist with questions about our company, products, or services. For example, you could ask about our IT solutions, cloud services, or contact details.";
  } 
  // ANSWER STRICTLY FROM KNOWLEDGE BASE
  else {
    if (userQuery.includes("about") || userQuery.includes("what is amtec")) {
      reply = AMTEC_KNOWLEDGE.about;
    } 
    else if (userQuery.includes("mission")) {
      reply = AMTEC_KNOWLEDGE.mission;
    } 
    else if (userQuery.includes("vision")) {
      reply = AMTEC_KNOWLEDGE.vision;
    } 
    else if (userQuery.includes("hardware")) {
      reply = AMTEC_KNOWLEDGE.hardware;
    } 
    else if (userQuery.includes("software")) {
      reply = AMTEC_KNOWLEDGE.software;
    } 
    else if (userQuery.includes("cloud")) {
      reply = AMTEC_KNOWLEDGE.cloud;
    } 
    else if (userQuery.includes("services") || userQuery.includes("consultancy")) {
      reply = `Our services include: ${AMTEC_KNOWLEDGE.services}`;
    } 
    else if (userQuery.includes("contact") || userQuery.includes("how to reach") || userQuery.includes("support")) {
      reply = `You can reach us at:\n${AMTEC_KNOWLEDGE.contact}`;
    } 
    else if (userQuery.includes("hours") || userQuery.includes("open") || userQuery.includes("time")) {
      reply = `Our working hours are:\n${AMTEC_KNOWLEDGE.hours}`;
    } 
    else if (userQuery.includes("muhammad") || userQuery.includes("ceo")) {
      reply = AMTEC_KNOWLEDGE.leadership.ceo;
    } 
    else if (userQuery.includes("intissar") || userQuery.includes("legal")) {
      reply = AMTEC_KNOWLEDGE.leadership.legal;
    } 
    else if (userQuery.includes("are you a bot") || userQuery.includes("ai")) {
      reply = "Yes, I’m Amtec Links’ support bot. How can I help you today?";
    } 
    else {
      reply = "I don’t have the answer to that specific question. Please email info@amteclinks.com for assistance.";
    }
  }

  // Dialogflow CX Response Format
  res.json({
    fulfillmentResponse: {
      messages: [{ text: { text: [reply] } }]
    }
  });
});

// =====================
// SERVER START
// =====================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Amtec Links bot running on port ${PORT}`);
  console.log("✅ Strict mode: ONLY answers about Amtec Links");
});
