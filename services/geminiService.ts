import { GoogleGenAI, Type } from "@google/genai";
import { Note } from "../types";

// Initialize the API client
// Note: In a production capacitor app, you'd likely proxy this or inject the key securely.
// For this demo, we assume process.env.API_KEY is available or handled by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeNoteWithAI = async (note: Note): Promise<{ reflection: string; suggestedTags: string[] }> => {
  try {
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