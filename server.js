require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');
const fs = require('fs/promises');
const path = require('path');
const app = express();

app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const AMTEC_FILE = path.join(__dirname, 'amtec_docs', 'about_amtec.txt'); // Your document file

async function getFileContent() {
    try {
        return await fs.readFile(AMTEC_FILE, 'utf-8');
    } catch (error) {
        console.error('Error reading file:', error);
        throw new Error('Failed to load company information');
    }
}

app.post('/chat', async (req, res) => {
    try {
        const { query } = req.body;
        
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: "Invalid query format" });
        }

        const fileContent = await getFileContent();

        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo", // Use gpt-4 for better instruction following
            messages: [
                {
                    role: "system",
                    content: `You are an assistant for Amtec Links. STRICTLY ONLY use the following information to answer questions:
                    
                    ${fileContent}
                    
                    RULES:
                    1. ONLY use the provided text - never invent answers
                    2. If the answer isn't in the text, say "I don't have that information in my records"
                    3. Keep answers concise (1-2 sentences)
                    4. For contact questions, direct to info@amteclinks.com`
                },
                {
                    role: "user",
                    content: query
                }
            ],
            temperature: 0, // Minimize creativity
            max_tokens: 200
        });

        res.json({
            response: response.choices[0].message.content,
            source: 'about_amtec.txt' // Always show which file was used
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: "Unable to process your request" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Amtec chatbot running on port ${PORT}`);
});
