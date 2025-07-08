require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { MemoryVectorStore } = require('langchain/vectorstores/memory');
const fs = require('fs/promises');
const path = require('path');
const app = express();

app.use(express.json());

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Configuration
const DOCS_DIR = path.join(__dirname, 'amtec_docs');
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const MAX_RESPONSE_TOKENS = 150;
const SIMILARITY_SEARCH_LIMIT = 3;

// Enhanced keyword list with categories
const AMTEC_KEYWORDS = {
  company: ['amtec links', 'amteclinks', 'amtec'],
  products: ['hardware', 'software', 'cloud', 'solutions'],
  brands: ['dell', 'lenovo', 'microsoft', 'seagate', 'zebra', 'prime computer'],
  services: [
    'consultancy', 'web development', 'mobile app', 'branding',
    'digital transformation', 'infrastructure', 'cyber security',
    'training', 'sustainability', 'procurement', 'licensing'
  ],
  cloud: ['aws', 'azure', 'google cloud', 'cloud services'],
  people: ['muhammad ismail', 'intissar abdallah', 'ceo', 'legal'],
  location: ['uae', 'ras al khaimah', 'rak', 'united arab emirates'],
  contact: ['info@amteclinks.com', 'contact', 'support', 'email'],
  about: ['mission', 'vision', 'about us', 'history']
};

// Text splitter with improved chunking
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: CHUNK_SIZE,
  chunkOverlap: CHUNK_OVERLAP,
  separators: ['\n\n', '\n', ' ', ''], // Better handling of document structure
});

// Create vector store with caching
let vectorStoreCache = null;
async function createVectorStore() {
  if (vectorStoreCache) return vectorStoreCache;
  
  try {
    const docs = [];
    const files = await fs.readdir(DOCS_DIR);
    
    for (const file of files) {
      if (!file.endsWith('.txt') && !file.endsWith('.md') && !file.endsWith('.docx')) continue;
      
      const content = await fs.readFile(path.join(DOCS_DIR, file), 'utf-8');
      const chunks = await splitter.createDocuments([content]);
      
      chunks.forEach(chunk => {
        chunk.metadata = { 
          source: file,
          lastModified: fs.statSync(path.join(DOCS_DIR, file)).mtime.toISOString()
        };
        docs.push(chunk);
      });
    }

    vectorStoreCache = await MemoryVectorStore.fromDocuments(
      docs,
      new OpenAIEmbeddings({ 
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: "text-embedding-3-small" // More efficient embedding model
      })
    );
    
    return vectorStoreCache;
  } catch (error) {
    console.error('Vector store creation failed:', error);
    throw new Error('Failed to initialize knowledge base');
  }
}

// Enhanced keyword validation
function isAboutAmtec(query) {
  const queryLower = query.toLowerCase();
  return Object.values(AMTEC_KEYWORDS).some(category => 
    category.some(keyword => queryLower.includes(keyword.toLowerCase()))
  );
}

// Chat endpoint with improved validation and error handling
app.post('/chat', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: "Invalid query format" });
    }

    // 1. Enhanced keyword check
    if (!isAboutAmtec(query)) {
      return res.json({
        response: "I specialize in Amtec Links IT solutions and services. Could you clarify your question about our offerings?",
        sources: []
      });
    }

    const vectorStore = await createVectorStore();
    const relevantDocs = await vectorStore.similaritySearch(query, SIMILARITY_SEARCH_LIMIT);

    // 2. Generate with strict constraints and improved prompt
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125", // Newer, more efficient model
      messages: [{
        role: "system",
        content: `You are an official Amtec Links assistant. Respond professionally using ONLY these facts:
        ${relevantDocs.map(d => d.pageContent).join('\n\n')}
        
        Rules:
        - Use "we" when referring to Amtec Links
        - Keep responses under ${MAX_RESPONSE_TOKENS} tokens
        - Never invent information not in the provided context
        - For contact details, always direct to info@amteclinks.com`
      }, {
        role: "user",
        content: `Question: ${query}\nAnswer concisely (2-3 sentences max):`
      }],
      temperature: 0.1, // Slightly higher for more natural responses
      max_tokens: MAX_RESPONSE_TOKENS
    });

    const answer = response.choices[0].message.content;

    // 3. Final validation with stricter checks
    const isValid = /Amtec Links|we |our |contact info@amteclinks.com/i.test(answer) && 
                  answer.length <= MAX_RESPONSE_TOKENS * 4; // Approximate char count

    res.json({
      response: isValid ? answer : "For detailed information, please contact us at info@amteclinks.com",
      sources: [...new Set(relevantDocs.map(d => d.metadata.source))],
      confidence: isValid ? "high" : "medium"
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: "Our technical team has been notified. Please try again later or contact info@amteclinks.com for immediate assistance."
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Amtec Links RAG bot running on port ${PORT}`);
  console.log(`Document directory: ${DOCS_DIR}`);
});
