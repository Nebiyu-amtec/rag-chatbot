import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import fs from "fs";
import { OpenAI } from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());

// Load embeddings
const embeddingsData = JSON.parse(
  fs.readFileSync("./embeddings/embeddings.json", "utf8")
);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cosine similarity
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Retrieve relevant chunks
async function findRelevantChunks(queryEmbedding, topN = 3, threshold = 0.3) {
  const similarities = embeddingsData.map((item) => ({
    text: item.text,
    similarity: cosineSimilarity(queryEmbedding, item.embedding),
  }));
  similarities.sort((a, b) => b.similarity - a.similarity);
  const filtered = similarities.filter((chunk) => chunk.similarity >= threshold);
  console.log(`🔍 Found ${filtered.length} relevant chunks`);
  return filtered.slice(0, topN);
}

// Generate GPT answer
async function generateAnswer(question, context) {
  const prompt = `
You are Amtec Links AI Assistant, a friendly and knowledgeable virtual assistant.

- Answer user questions confidently based on the provided information.
- Share details like emails, phone numbers, and website URLs if they are available.
- If you are unsure, politely say: 
  "I'm Amtec Links AI Assistant, and I can only assist with Amtec Links-related queries."

Information:
${context}

User Question: ${question}

Friendly and Polite Answer:
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are Amtec Links AI Assistant. Be polite, concise, and helpful. Never mention 'context' in your replies.",
        },
        { role: "user", content: prompt },
      ],
    });

    const answer = completion.choices[0].message.content.trim();

    return answer || "I'm Amtec Links AI Assistant. Can you clarify your question?";
  } catch (err) {
    console.error("❌ GPT Error:", err.message);
    return "I'm Amtec Links AI Assistant. Sorry, something went wrong. Please try again.";
  }
}

// ✅ Dialogflow CX Webhook
app.post("/webhook", async (req, res) => {
  console.log("📦 Webhook Body:", JSON.stringify(req.body, null, 2));

  const userQuery = req.body.text;
  console.log(`🤖 Dialogflow CX Query: ${userQuery}`);

  if (!userQuery) {
    return res.json({
      fulfillment_response: {
        messages: [
          {
            text: {
              text: ["I'm Amtec Links AI Assistant. Can you please ask your question again?"],
            },
          },
        ],
      },
    });
  }

  try {
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: userQuery,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    const topChunks = await findRelevantChunks(queryEmbedding);
    const context = topChunks.map((c) => c.text).join("\n");

    const answer = await generateAnswer(userQuery, context);

    res.json({
      fulfillment_response: {
        messages: [
          {
            text: {
              text: [answer],
            },
          },
        ],
      },
    });
  } catch (err) {
    console.error("❌ Webhook Error:", err.message);
    res.json({
      fulfillment_response: {
        messages: [
          {
            text: {
              text: ["I'm Amtec Links AI Assistant. Sorry, something went wrong. Please try again."],
            },
          },
        ],
      },
    });
  }
});

// ✅ /chat endpoint (for Postman/local testing)
app.post("/chat", async (req, res) => {
  try {
    const userQuery = req.body.query;
    console.log(`💬 Postman Query: ${userQuery}`);

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: userQuery,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    const topChunks = await findRelevantChunks(queryEmbedding);
    const context = topChunks.map((c) => c.text).join("\n");

    const answer = await generateAnswer(userQuery, context);

    res.json({ answer });
  } catch (err) {
    console.error("❌ Error in /chat:", err.message);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
