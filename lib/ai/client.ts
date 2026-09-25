import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";

export const isGeminiConfigured = Boolean(
  apiKey &&
  apiKey.length > 10 &&
  !apiKey.includes("your-gemini-api-key")
);

let aiClientInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (!isGeminiConfigured) return null;
  if (!aiClientInstance) {
    aiClientInstance = new GoogleGenAI({ apiKey });
  }
  return aiClientInstance;
}

const DEFAULT_CHAT_MODELS = [
  process.env.GEMINI_CHAT_MODEL,
  "gemini-3.1-flash-lite-preview",
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest",
].filter((model): model is string => Boolean(model));

/**
 * Generate grounded text with the Gemini chat models, trying current then fallback IDs.
 */
export async function generateGroundedText(prompt: string): Promise<string | null> {
  const ai = getGeminiClient();
  if (!ai || !isGeminiConfigured) return null;

  let lastError: unknown = null;
  for (const model of DEFAULT_CHAT_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      const text = (response.text || "").trim();
      if (text) return text;
    } catch (err) {
      lastError = err;
      console.warn(`Gemini model ${model} failed, trying next fallback:`, err);
    }
  }

  if (lastError) {
    console.warn("All Gemini chat models failed:", lastError);
  }
  return null;
}
