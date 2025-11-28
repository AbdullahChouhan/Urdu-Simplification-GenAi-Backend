import express, { type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

interface SimplifyRequest {
  sentence: string;
}

app.post('/api/simplify', async (req: Request<{}, {}, SimplifyRequest>, res: Response) => {
  try {
    const { sentence } = req.body;

    if (!sentence) {
       res.status(400).json({ error: 'Sentence is required' });
       return;
    }

    // Robust Prompt Engineering
    const prompt = `
      You are an expert Urdu linguist. 
      Task: Take the following complex Urdu sentence and break it down into multiple, simpler, grammatically correct standalone Urdu sentences.
      
      Complex Sentence: "${sentence}"
      
      Output Requirement: 
      1. Simplify the vocabulary slightly where appropriate.
      2. Return ONLY a valid JSON array of strings. Do not include markdown formatting like \`\`\`json.
      
      Example Input: "اگرچہ موسم خراب تھا لیکن وہ سکول گیا اور اس نے اپنا کام مکمل کیا۔"
      Example Output: ["موسم خراب تھا۔", "وہ سکول گیا۔", "اس نے اپنا کام مکمل کیا۔"]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up potential markdown formatting from AI
    const cleanJson = text.replace(/```json|```/g, '').trim();
    
    const simplifiedParts = JSON.parse(cleanJson);

    res.json({ original: sentence, simplified: simplifiedParts });

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Failed to process sentence' });
  }
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});