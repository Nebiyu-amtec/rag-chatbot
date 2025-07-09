import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import fs from "fs";
import { OpenAI } from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Load embeddings
const embeddingsData = JSON.parse(
  fs.readFileSync("./embeddings/embeddings.json", "utf8")
);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function: Compute cosine similarity
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Function: Find top N relevant chunks above threshold
async function findRelevantChunks(queryEmbedding, topN = 3, threshold = 0.5) {
  const similarities = embeddingsData.map((item) => ({
    text: item.text,
    similarity: cosineSimilarity(queryEmbedding, item.embedding),
  }));

  similarities.sort((a, b) => b.similarity - a.similarity);

  const filtered = similarities.filter(
    (chunk) => chunk.similarity >= threshold
  );

  console.log(`🔍 Found ${filtered.length} relevant chunks`);

  return filtered.slice(0, topN);
}

// Function: Generate response using GPT
async function generateAnswer(question, context) {
  const prompt = `
You are Amtec Links AI Assistant, a friendly and knowledgeable virtual assistant.

- Answer user questions confidently based on the provided information.
- Share details like emails, phone numbers, and website URLs if they are available.
- If the user asks an unrelated or personal question, politely say: 
  "I’m Amtec Links AI Assistant, and I can only assist with Amtec Links-related queries."
- Never mention "context" or "provided information" in your response.

Information:
${context}

User Question: ${question}

Friendly and Polite Answer:
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are Amtec Links AI Assistant, a friendly virtual IT assistant. Answer user questions using the provided information and make a best effort to help. Be polite, concise, and helpful.",
      },
      { role: "user", content: prompt },
    ],
  });

  const answer = completion.choices[0].message.content.trim();

  // Fallback for empty responses
  if (!answer || answer.length === 0) {
    return "I’m Amtec Links AI Assistant. Can you clarify what you’d like to know about Amtec Links?";
  }

  return answer;
}

app.use(bodyParser.json());

// Test route for browser
app.get("/", (req, res) => {
  res.send("✅ RAG Chatbot Backend with Retrieval is running!");
});

// Chat endpoint for Postman
app.post("/chat", async (req, res) => {
  try {
    const userQuery = req.body.query;
    console.log(`💬 Postman Query: ${userQuery}`);

    // Embed and retrieve
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: userQuery,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    const topChunks = await findRelevantChunks(queryEmbedding);
    let context = "";

    if (topChunks.length > 0) {
      context = topChunks.map((c) => c.text).join("\n");
    }

    const answer = await generateAnswer(userQuery, context);

    res.json({ answer });
  } catch (err) {
    console.error("❌ Error in /chat:", err.message);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Webhook endpoint for Dialogflow
app.post("/webhook", async (req, res) => {
  try {
    const userQuery = req.body.queryResult.queryText;
    console.log(`🤖 Dialogflow Query: ${userQuery}`);

    // Embed and retrieve
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: userQuery,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    const topChunks = await findRelevantChunks(queryEmbedding);
    let context = "";

    if (topChunks.length > 0) {
      context = topChunks.map((c) => c.text).join("\n");
    }

    const answer = await generateAnswer(userQuery, context);

    // Return in Dialogflow format
    res.json({
      fulfillmentText: answer,
    });
  } catch (err) {
    console.error("❌ Error in /webhook:", err.message);
    res.json({
      fulfillmentText:
        "I’m Amtec Links AI Assistant. I wasn’t able to process that request right now.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
