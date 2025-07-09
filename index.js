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

// Function: Find top N relevant chunks
async function findRelevantChunks(queryEmbedding, topN = 3) {
  const similarities = embeddingsData.map((item) => ({
    text: item.text,
    similarity: cosineSimilarity(queryEmbedding, item.embedding),
  }));
  similarities.sort((a, b) => b.similarity - a.similarity);
  return similarities.slice(0, topN);
}

// Function: Generate response using GPT
async function generateAnswer(question, context) {
  const prompt = `
You are a helpful assistant for Amtec Links. Answer the question below using ONLY the provided context.
If the answer is not in the context, reply: "Sorry, I don’t have that information right now."

Context:
${context}

Question: ${question}

Answer:
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
  });

  return completion.choices[0].message.content.trim();
}

app.use(bodyParser.json());

// Test route
app.get("/", (req, res) => {
  res.send("✅ RAG Chatbot Backend with Retrieval is running!");
});

// Chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const userQuery = req.body.query;
    console.log(`💬 User Query: ${userQuery}`);

    // Embed the user query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: userQuery,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Find relevant chunks
    const topChunks = await findRelevantChunks(queryEmbedding);
    const context = topChunks.map((c) => c.text).join("\n");

    // Generate answer
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
