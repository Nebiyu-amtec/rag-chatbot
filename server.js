require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { MemoryVectorStore } = require('langchain/vectorstores/memory');
const fs = require('fs/promises');
const app = express();

app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Custom text splitter for Amtec docs
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200
});

// Strict keyword validation
const AMTEC_KEYWORDS = [
  'amtec', 'hardware', 'dell', 'lenovo', 'microsoft', 'seagate', 'zebra',
  'prime computer', 'software', 'cloud', 'aws', 'azure', 'google cloud',
  'consultancy', 'web development', 'mobile app', 'branding',
  'digital transformation', 'infrastructure', 'cyber security',
  'training', 'sustainability', 'ceo', 'muhammad ismail', 'legal',
  'intissar abdallah', 'uae', 'ras al khaimah', 'contact', 'support',
  'mission', 'vision'
];

async function createVectorStore() {
  const docs = [];
  const files = await fs.readdir('./amtec_docs');
  
  for (const file of files) {
    const content = await fs.readFile(`./amtec_docs/${file}`, 'utf-8');
    const chunks = await splitter.createDocuments([content]);
    chunks.forEach(chunk => {
      chunk.metadata = { source: file };
      docs.push(chunk);
    });
  }

  return await MemoryVectorStore.fromDocuments(
    docs,
    new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY })
  );
}

app.post('/chat', async (req, res) => {
  const { query } = req.body;
  
  // 1. Strict keyword check
  const isAboutAmtec = AMTEC_KEYWORDS.some(keyword => 
    query.toLowerCase().includes(keyword.toLowerCase())
  );

  if (!isAboutAmtec) {
    return res.json({
      response: "I specialize in Amtec Links inquiries only.",
      sources: []
    });
  }

  try {
    const vectorStore = await createVectorStore();
    const relevantDocs = await vectorStore.similaritySearch(query, 3);

    // 2. Generate with strict constraints
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: `You are Amtec Links' assistant. Respond using ONLY these facts:
        ${relevantDocs.map(d => d.pageContent).join('\n\n')}`
      }, {
        role: "user",
        content: `Question: ${query}\nAnswer (use "we", max 3 sentences):`
      }],
      temperature: 0,
      max_tokens: 150
    });

    const answer = response.choices[0].message.content;

    // 3. Final validation
    const isValid = /Amtec Links|we |our /i.test(answer) && 
                  answer.length <= 150;

    res.json({
      response: isValid ? answer : "Please contact info@amteclinks.com for details.",
      sources: [...new Set(relevantDocs.map(d => d.metadata.source))]
    });

  } catch (error) {
    res.status(500).json({ error: "Please try again later" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`RAG bot running on port ${PORT}`));
