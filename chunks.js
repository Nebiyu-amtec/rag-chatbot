import fs from "fs";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

// Load the document text
const rawText = fs.readFileSync("./data/about_us.txt", "utf8");

// Set up the text splitter
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500, // or adjust as needed
  chunkOverlap: 50,
});

// Split and save
async function splitDocument() {
  const documents = await splitter.createDocuments([rawText]);
  console.log(`✅ Created ${documents.length} chunks`);

  // Create "chunks" folder if it doesn't exist
  if (!fs.existsSync("./chunks")) {
    fs.mkdirSync("./chunks", { recursive: true });
  }

  // Save chunks
  const chunkContents = documents.map(doc => doc.pageContent);
  fs.writeFileSync(
    "./chunks/chunks.json",
    JSON.stringify(chunkContents, null, 2)
  );

  console.log("📁 Chunks saved to chunks/chunks.json");
}

splitDocument();
