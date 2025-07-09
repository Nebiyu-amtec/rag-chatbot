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

- Answer user questions confidently based on the provided context.
- If the answer is not directly in the context but related to Amtec Links, make your best effort to provide a helpful reply.
- You **can share website URLs, emails, and phone numbers** if they are available in the provided context.
- If the user asks an unrelated or personal question, politely say: 
  "I’m Amtec Links AI Assistant, and I can only assist with Amtec Links-related queries."
- If you are unsure, ask a clarifying follow-up question like: 
  "Could you clarify which Amtec Links service you’re asking about?"

Context:
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
          "You are Amtec Links AI Assistant, a friendly virtual IT assistant. You ONLY answer questions about Amtec Links. Be polite and ask follow-up questions if needed.",
      },
      { role: "user", content: prompt },
    ],
  });

  const answer = completion.choices[0].message.content.trim();

  // Add fallback for empty responses
  if (!answer || answer.length === 0) {
    return "I’m Amtec Links AI Assistant. Can you clarify what you’d like to know about Amtec Links?";
  }

  return answer;
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
    let context = "";

    if (topChunks.length > 0) {
      context = topChunks.map((c) => c.text).join("\n");
    } else {
      console.log("⚠️ No relevant chunks found. Using empty context.");
    }

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
