import { GoogleGenAI } from '@google/genai';

export function getGeminiClient(): GoogleGenAI {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Missing GEMINI_API_KEY in environment variables. Add it to your .env.local file.'
    );
  }

  return new GoogleGenAI({ apiKey });
}

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
