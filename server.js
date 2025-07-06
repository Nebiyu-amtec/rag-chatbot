require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

// Hardcoded Amtec Links knowledge (from your document)
const AMTEC_KNOWLEDGE = {
  about: "Amtec Links is an IT Solutions company established in 2007, providing a comprehensive range of IT products and services under one roof. We work closely with clients to deliver tailored solutions for businesses worldwide.",
  mission: "To develop products that will have a positive impact on the world. We are constantly inventing new technologies with this goal in mind.",
  vision: "To develop products and services that change the way we use technology and to become one of the foremost innovators of technology products and services.",
  hardware: "We are authorized resellers of IT hardware from Dell, Lenovo, Microsoft, Seagate, Zebra, and Prime Computer (Switzerland). We procure, install, and maintain IT Hardware for corporations of any size.",
  software: "We provide both ready-made and custom-made software solutions, along with IT support, integrations, implementations, and training.",
  cloud: "We offer Cloud Solutions in partnership with Google Cloud, AWS, and Microsoft Azure for digital transformation.",
  services: [
    "Web Development", "Mobile App Development", "Corporate Branding", 
    "Digital Transformation", "IT Infrastructure Design", "Software Design",
    "Smart City Design", "Cyber Security", "Staff Training", "Sustainability Auditing"
  ].join(", "),
  contact: `
    Email: info@amteclinks.com
    Telephone: +971 7 207 8158
    Address: Office 310 BC2 RAKEZ HQ Island Street, Al Nakheel, PO Box 40383, Ras Al Khaimah, UAE
    Website: www.amteclinks.com
  `,
  hours: `
    Monday-Thursday: 9 AM - 5 PM
    Friday: 9 AM - 12:30 PM
    Saturday-Sunday: Closed
  `,
  ceo: "Muhammad Ismail (CEO): Leads the company with a vision for innovation. Holds a BSc (Honours) in Computing and Information Technologies from the University of Derby.",
  legal: "Intissar Abdallah (Chief Legal Officer): Oversees legal functions. Holds an LLB from Bayero University and a Postgraduate Certificate in Law from the University of London."
};

// Keywords that trigger Amtec-related responses
const AMTEC_KEYWORDS = [
  "amtec links", "it solutions", "hardware", "software", "cloud", 
  "consultancy", "web development", "mobile app", "branding",
  "digital transformation", "infrastructure", "smart city", 
  "cyber security", "training", "sustainability", "mission", 
  "vision", "contact", "hours", "muhammad ismail", "intissar abdallah",
  "uae", "ras al khaimah", "ceo", "legal"
];

app.post('/', (req, res) => {
  const userQuery = (req.body.text || req.body.queryResult?.queryText || "").toLowerCase();
  let reply;

  // Check if query is unrelated to Amtec Links
  const isAboutAmtec = AMTEC_KEYWORDS.some(keyword => userQuery.includes(keyword.toLowerCase()));

  if (!isAboutAmtec) {
    reply = "I’m Amtec Links’ support bot, and I can only assist with questions about our company, services, or support. Would you like to ask something related to Amtec Links?";
  } 
  else {
    // Strict Q&A based on your document
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
    else if (userQuery.includes("contact") || userQuery.includes("how to reach")) {
      reply = `You can contact us at:\n${AMTEC_KNOWLEDGE.contact}`;
    } 
    else if (userQuery.includes("hours") || userQuery.includes("open")) {
      reply = `Our working hours are:\n${AMTEC_KNOWLEDGE.hours}`;
    } 
    else if (userQuery.includes("muhammad") || userQuery.includes("ceo")) {
      reply = AMTEC_KNOWLEDGE.ceo;
    } 
    else if (userQuery.includes("intissar") || userQuery.includes("legal")) {
      reply = AMTEC_KNOWLEDGE.legal;
    } 
    else if (userQuery.includes("are you a bot") || userQuery.includes("ai")) {
      reply = "Yes, I’m Amtec Links’ support bot. How can I help you today?";
    } 
    else {
      reply = "I don’t have the answer to that question. Please contact us at info@amteclinks.com for assistance.";
    }
  }

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
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Strict Amtec Links bot running on port ${PORT}`);
});
