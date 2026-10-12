'use server';

import { Type } from '@google/genai';
import { getGeminiClient, GEMINI_MODEL } from '@/ai/gemini';

export interface GenerateChatTitleInput {
  firstUserMessage: string;
}

export interface GenerateChatTitleOutput {
  title: string;
}

export async function generateChatTitle(
  input: GenerateChatTitleInput
): Promise<GenerateChatTitleOutput> {
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Generate a short, catchy title (3 to 6 words max) for a dating/chat assistant session based on the user's first message:\n\n"${input.firstUserMessage}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'Short session title (3-6 words)',
            },
          },
          required: ['title'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      title: parsed.title || input.firstUserMessage.slice(0, 32) || 'New Chat',
    };
  } catch (error) {
    console.error('Failed to generate chat title:', error);
    return {
      title: input.firstUserMessage.slice(0, 30) || 'New Chat',
    };
  }
}
