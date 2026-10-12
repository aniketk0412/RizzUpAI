'use server';

import { Type } from '@google/genai';
import { eq, sql } from 'drizzle-orm';
import { getGeminiClient, GEMINI_MODEL } from '@/ai/gemini';
import { db, isDatabaseConfigured } from '@/db';
import { users } from '@/db/schema';
import type { Message, ReplyOption } from '@/types';

export interface MaintainSessionMemoryInput {
  relation: string;
  tone: string;
  history: Message[];
  currentMessage: string;
  userId: string;
  image?: string;
}

export interface MaintainSessionMemoryOutput {
  response: string;
  explanation: string;
  options: ReplyOption[];
  remainingCredits?: number;
}

function parseDataUri(dataUri: string): { mimeType: string; data: string } | null {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    data: match[2],
  };
}

export async function maintainSessionMemory(
  input: MaintainSessionMemoryInput
): Promise<MaintainSessionMemoryOutput> {
  try {
    let remainingCredits: number | undefined;

    if (isDatabaseConfigured() && input.userId) {
      const [userRecord] = await db
        .select({ credits: users.credits })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!userRecord || userRecord.credits < 1) {
        throw new Error('Insufficient credits.');
      }

      const [updated] = await db
        .update(users)
        .set({
          credits: sql`${users.credits} - 1`,
        })
        .where(eq(users.id, input.userId))
        .returning({ credits: users.credits });

      remainingCredits = updated?.credits;
    }

    const ai = getGeminiClient();

    const historyText =
      input.history && input.history.length > 0
        ? input.history
            .slice(-10)
            .map((m) => `- ${m.sender === 'user' ? 'User' : 'Wingman'}: ${m.text}`)
            .join('\n')
        : '(No previous history - this is the opening message)';

    const promptText = `You are an elite, charismatic wingman and texting assistant (RizzUp AI).
Your mission is to craft 3 distinct, high-impact reply options that the user can choose from based on the conversation context, their relationship, and desired tone.

Context:
- Relationship with chat partner: ${input.relation} (e.g., GF, BF, Friend)
- Desired overall tone: ${input.tone} (e.g., Friendly, Flirty, Rizz, Romantic)

Conversation History:
${historyText}

User's input / The latest message received:
"${input.currentMessage || 'Analyze the attached screenshot and give me 3 great replies.'}"

Instructions:
1. Generate 3 varied, natural-sounding reply options in the 'options' array:
   - Option 1 (Playful & Casual): Low pressure, fun teasing, easy to answer.
   - Option 2 (Smooth & Charming): The sweet spot — confident, engaging, and magnetic.
   - Option 3 (Bold & High Energy): Daring, witty, memorable, high-rizz energy.
2. Ensure texts sound like authentic, modern human text messages (avoid robotic AI phrasing or corny 1990s pickup lines).
3. Set 'response' to the best all-around recommendation (usually Option 2).
4. Set 'explanation' to a brief 1-sentence strategy breakdown on why this trio works.`;

    const contents: any[] = [];
    if (input.image) {
      const parsedImage = parseDataUri(input.image);
      if (parsedImage) {
        contents.push({
          inlineData: {
            mimeType: parsedImage.mimeType,
            data: parsedImage.data,
          },
        });
      }
    }
    contents.push({ text: promptText });

    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            response: {
              type: Type.STRING,
              description: 'The top recommended reply.',
            },
            explanation: {
              type: Type.STRING,
              description: 'Brief strategic takeaway on why these replies work.',
            },
            options: {
              type: Type.ARRAY,
              description: 'Exactly 3 distinct reply options.',
              items: {
                type: Type.OBJECT,
                properties: {
                  label: {
                    type: Type.STRING,
                    description: 'Short vibe title, e.g. "Playful Banter", "Smooth & Charming", "Bold & Flirty"',
                  },
                  text: {
                    type: Type.STRING,
                    description: 'The exact message reply ready to copy and send',
                  },
                  vibeReason: {
                    type: Type.STRING,
                    description: '1-sentence explanation of why this option works',
                  },
                },
                required: ['label', 'text', 'vibeReason'],
              },
            },
          },
          required: ['response', 'explanation', 'options'],
        },
      },
    });

    const output = JSON.parse(result.text || '{}');

    const options: ReplyOption[] =
      Array.isArray(output.options) && output.options.length > 0
        ? output.options
        : [
            {
              label: 'Playful',
              text: output.response || 'Tell me more 👀',
              vibeReason: output.explanation || 'Casual and lighthearted',
            },
            {
              label: 'Smooth',
              text: output.response || 'Tell me more 👀',
              vibeReason: 'Charming and confident',
            },
            {
              label: 'Bold',
              text: output.response || 'Tell me more 👀',
              vibeReason: 'High energy and memorable',
            },
          ];

    return {
      response: output.response || options[1]?.text || options[0]?.text,
      explanation: output.explanation || 'Here are 3 tailored ways to play this:',
      options,
      remainingCredits,
    };
  } catch (e: any) {
    console.error('Error in maintainSessionMemory:', e);
    throw new Error(e.message || 'Failed to generate AI response.');
  }
}
