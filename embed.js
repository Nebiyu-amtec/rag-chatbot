import fs from "fs";
import dotenv from "dotenv";
import { OpenAI } from "openai";

dotenv.config();

// Load OpenAI API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Load chunks
const chunks = JSON.parse(fs.readFileSync("./chunks/chunks.json", "utf8"));

// Function to embed a single chunk
async function embedChunk(text, id) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return {
      id,
      embedding: response.data[0].embedding,
      text, // include original text for later
    };
  } catch (err) {
    console.error(`❌ Error embedding chunk ${id}:`, err.message);
    return null;
  }
}

async function embedAllChunks() {
  const embeddedChunks = [];

  for (let i = 0; i < chunks.length; i++) {
    const result = await embedChunk(chunks[i], i);
    if (result) embeddedChunks.push(result);
    console.log(`✅ Embedded chunk ${i + 1}/${chunks.length}`);
  }

  // Save embeddings to file
  fs.mkdirSync("./embeddings", { recursive: true });
  fs.writeFileSync(
    "./embeddings/embeddings.json",
    JSON.stringify(embeddedChunks, null, 2)
  );

  console.log("📁 Embeddings saved to embeddings/embeddings.json");
}

embedAllChunks();
