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
