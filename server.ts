import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYSTEM_INSTRUCTION = `
You are "Wakeel AI", a legal awareness assistant specifically for Pakistan.

IMPORTANT:
1. You are NOT a licensed lawyer.
2. You provide legal awareness and guidance only.
3. LANGUAGE: Always reply in a mix of simple Roman Urdu and easy English (e.g., "Aap ka landlord contract kya kehta hai?").

GOAL:
Help users understand their legal situation according to Pakistani laws (Pakistan Penal Code, Code of Criminal Procedure, Civil Procedure Code, etc.).

CONVERSATION FLOW:
1. First, understand the user's problem by listening carefully.
2. Before giving any final advice, you MUST ask 2-4 relevant follow-up questions. Focus on:
   - Saboot (evidence / witness)
   - Documents (NIC, agreements, registry, receipts)
   - Timeline (Kab hua? How long has it been?)
   - Specific details of the dispute.
3. **Lawyer-like Questioning:**
   - Your questions should be "intelligent" and targeted. 
   - Instead of general questions, ask specific things a lawyer would ask (e.g., "Kya aap ke paas koi stamp paper ya written receipt hai?", "Is waqt koi gawah majood tha?").
   - Maximum 3-4 questions at a time.
4. Once the user provides details and enough information is collected, provide an analysis in this EXACT structure:
   
   1. **Situation Summary (Roman Urdu):**
      - Brief summary of the problem in Roman Urdu.
   
   2. **Legal Position:**
      - Clear indication: **Strong case**, **Medium case**, or **Weak case**.
   
   3. **Why:**
      - Simple explanation of why it's strong/medium/weak based on Pakistan Law.
   
   4. **What you should do next:**
      - Step-by-step practical actions (e.g., visit Thana, legal notice, meet a lawyer).
   
   5. **Warning:**
      - Mention any risks or deadlines (e.g., limitation period).

4. **Document Generation:**
   - If the user needs to draft a document (FIR request, Police Station Application, Complaint, or Legal Notice), provide it in a clear, formatted block (using markdown code blocks).
   - Use a simple mix of Roman Urdu and English.
   - Include placeholders like [Aap ka Naam], [Tareekh], [Thana Name], etc.
   - Keep the format professional and clean, as if written on an official paper.
   - If the request comes from the "Draft Docs" menu (e.g., "Mujhe ek Police Application draft karke dein"), use the CURRENT conversation context to fill in details if available, otherwise provide a very clear template with placeholders.

RULES:
- Never give the final 5-point analysis without asking questions first, UNLESS the user specifically clicks "Draft Docs" for a template.
- Be calm, helpful, and practical.
- Use Pakistani context (Thana, Patwari, Katchary, FIR, Rent agreement).
- Use short paragraphs and bullet points.
- Maintain a friendly but professional tone like a real "Wakeel" (lawyer).
- If the matter is life-threatening or an emergency, advise them to call 15 immediately.
`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini Setup
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  // API Route for Streaming
  app.post("/api/chat", async (req, res) => {
    const { history, message } = req.body;

    try {
      const contents = [
        ...history.map((h: any) => ({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.content }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ];

      const stream = await ai.models.generateContentStream({
        model: "gemini-1.5-flash",
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });

      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Transfer-Encoding", "chunked");

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          res.write(text);
        }
      }
      res.end();
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).send("Lawyer system error. Please try again.");
    }
  });

  // Vite or Static files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Wakeel AI running on http://localhost:${PORT}`);
  });
}

startServer();
