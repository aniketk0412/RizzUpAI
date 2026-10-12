'use server';

import { Type } from '@google/genai';
import { generateStructuredJSON } from '@/ai/gemini';

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
    const result = await generateStructuredJSON({
      prompt: `Generate a short, catchy title (3 to 6 words max) for a dating/chat assistant session based on the user's first message:\n\n"${input.firstUserMessage}"\n\nReturn strictly valid JSON: { "title": "Short Title Here" }`,
      systemInstruction: 'Return only JSON with a "title" string field.',
      geminiSchema: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: 'Short session title (3-6 words)',
          },
        },
        required: ['title'],
      },
    });

    const parsed = JSON.parse(result.text || '{}');
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
