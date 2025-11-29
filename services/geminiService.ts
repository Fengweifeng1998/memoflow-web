import { GoogleGenAI, Type } from "@google/genai";
import { Note } from "../types";

// Lazy initialization of the API client
// This prevents the application from crashing at startup if the API key is missing or invalid
let aiClient: GoogleGenAI | null = null;

const getAIClient = () => {
  if (!aiClient) {
    // process.env.API_KEY is replaced by Vite during build
    // Default to empty string to avoid undefined errors
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) {
      console.warn("Gemini API Key is missing. AI features will not work.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

export const analyzeNoteWithAI = async (note: Note): Promise<{ reflection: string; suggestedTags: string[] }> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following note. Provide a brief, one-sentence philosophical or practical reflection/insight based on it. Also suggest up to 3 relevant tags (excluding existing ones).
      
      Note Content: "${note.content}"
      Existing Tags: ${note.tags.join(", ")}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reflection: { type: Type.STRING, description: "A short insight or reflection about the note." },
            suggestedTags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of suggested tags (strings) without the hash symbol."
            }
          },
          required: ["reflection", "suggestedTags"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return { reflection: "Could not generate insight at this time.", suggestedTags: [] };
  }
};