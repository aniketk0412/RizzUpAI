'use server';

import { Type } from '@google/genai';
import { eq, sql } from 'drizzle-orm';
import { generateStructuredJSON } from '@/ai/gemini';
import { db, isDatabaseConfigured } from '@/db';
import { users } from '@/db/schema';
import type { ReplyOption } from '@/types';

export interface MaintainSessionMemoryInput {
  relation: string;
  tone: string;
  currentMessage: string;
  userId: string;
  image?: string;
}

export interface MaintainSessionMemoryOutput {
  response: string;
  explanation: string;
  options: ReplyOption[];
  remainingCredits?: number;
  error?: string;
}

export async function maintainSessionMemory(
  input: MaintainSessionMemoryInput
): Promise<MaintainSessionMemoryOutput> {
  try {
    let remainingCredits: number | undefined;

    // 1. Verify credits BEFORE calling AI (do not deduct until AI succeeds)
    if (isDatabaseConfigured() && input.userId) {
      const [userRecord] = await db
        .select({ credits: users.credits })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!userRecord || userRecord.credits < 1) {
        return {
          response: '',
          explanation: '',
          options: [],
          error: 'Insufficient credits. Wait for the daily refill or top up.',
        };
      }
    }

    const systemInstruction = `You are RizzUp, the world's most socially calibrated texting wingman. You write magnetic, effortless text replies for real conversations on iMessage, Instagram DMs, Hinge, and Tinder.

ABSOLUTE MANDATES:
1. NEVER SOUND LIKE AN AI: No ChatGPT corporate flirtations, no HR-approved banter, no cheesy pickup lines, and no stiff romance novel dialogue.
2. TEXTING REALISM: Real texts are brief (4 to 16 words max). Use natural lowercase or casual capitalization. Avoid stuffy formal punctuation (no semicolons, no textbook periods ending single-sentence casual texts).
3. SUBTEXT OVER EXPLAINING: Confident texters don't over-explain jokes or seek approval. Use playful misdirection, push-pull banter, and understated confidence.
4. MAXIMUM 1 EMOJI: 0 or 1 natural emoji max (like 👀, 💀, 😭, 😌, 😏). Never spam heart-eyes or corny emojis.
5. STRICTLY BANNED CLICHÉS:
   - "partner in crime"
   - "strict NDA"
   - "vodka rigatoni"
   - "careful what you wish for"
   - "playing with fire"
   - "challenge accepted"
   - "raise the stakes"
   - "connoisseur"
   - "is that an invitation"
   - "troublemaker"
   - "you might just get your wish"
   - "I must admit" / "I have to confess"
   - "Well well well"
   - "Touché"
   - Any corny greeting like "Hey there stranger" or "Look who decided to text"

CALIBRATION ANCHORS:
- Corporate AI Slop: "Well well, looks like someone is adventurous! What kind of mischief are we getting into?"
  -> Real Rizz: "trouble finds you or what?" or "don't start something you can't finish haha"
- Corporate AI Slop: "Haha I must confess, your dog is adorable! But your smile definitely sealed the deal."
  -> Real Rizz: "the dog got you the interview, you gotta earn the hire" or "100%, you're just the package deal"
- Corporate AI Slop: "No worries at all! Life gets so busy. Let me know when you're free next week."
  -> Real Rizz: "all good, don't work too hard" or "sounds like a deal, don't disappear on me"

Return strictly valid JSON matching { response, explanation, options: [{ label, text, vibeReason }] }.`;

    const promptText = `Generate 3 distinct, ready-to-send text replies for this situation:

SITUATION:
- Who they are: ${input.relation}
- Selected Vibe: ${input.tone}
- Context / Their Text: "${input.currentMessage || 'Analyze the attached screenshot and craft 3 tactical replies.'}"

TONE SPECIFICS:
${
  input.tone === 'Rizz'
    ? '- Tone = High Rizz: High-status nonchalance, witty push-pull, magnetic banter that makes them qualify themselves. Unbothered, intriguing, zero try-hard energy.'
    : input.tone === 'Flirty'
    ? '- Tone = Flirty: Teasing spark, flirty tension, playful challenge that builds instant chemistry.'
    : input.tone === 'Romantic'
    ? '- Tone = Romantic: Understated charm, genuine warmth, magnetic attraction without being sappy or stiff.'
    : '- Tone = Playful: Dry wit, inside-joke energy, hilarious banter with zero awkwardness.'
}

RELATION DYNAMICS:
- Target is "${input.relation}". Calibrate the familiarity and boundaries accordingly.

THE 3 DISTINCT PLAYBOOK ANGLES:
1. Option 1 ("Chill"): Dry humor, playful tease, or low-investment banter. Unbothered cool.
2. Option 2 ("Smooth"): Confident charm, clever subtext, or witty reframe that turns their text into romantic momentum.
3. Option 3 ("Bold"): High-conviction spark, direct flirting, or seamlessly locking in the date/hangout without desperation.

OUTPUT REQUIREMENTS:
- "response": The single best reply from the 3 options.
- "explanation": Ultra-concise 5-8 word tactical read (e.g., "Playful reframe flips the frame").
- "options": Array of 3 objects with { "label": "Chill" | "Smooth" | "Bold", "text": "...", "vibeReason": "4-6 word reason" }.
- Each "text" MUST be under 18 words and sound like a real person typing on their phone right now.`;

    const result = await generateStructuredJSON({
      prompt: promptText,
      systemInstruction,
      imageDataUri: input.image,
      geminiSchema: {
        type: Type.OBJECT,
        properties: {
          response: {
            type: Type.STRING,
            description: 'The top recommended reply.',
          },
          explanation: {
            type: Type.STRING,
            description: 'Brief 1-sentence strategic takeaway.',
          },
          options: {
            type: Type.ARRAY,
            description: 'Exactly 3 distinct reply options.',
            items: {
              type: Type.OBJECT,
              properties: {
                label: {
                  type: Type.STRING,
                  description: 'Short vibe title: "Chill", "Smooth", or "Bold"',
                },
                text: {
                  type: Type.STRING,
                  description: 'The exact message reply ready to copy and send',
                },
                vibeReason: {
                  type: Type.STRING,
                  description: '4-7 word note on why this line works',
                },
              },
              required: ['label', 'text', 'vibeReason'],
            },
          },
        },
        required: ['response', 'explanation', 'options'],
      },
    });

    const output = JSON.parse(result.text || '{}');

    const options: ReplyOption[] =
      Array.isArray(output.options) && output.options.length > 0
        ? output.options
        : [
            {
              label: 'Chill',
              text: output.response || 'tell me more 👀',
              vibeReason: output.explanation || 'Casual and low pressure',
            },
            {
              label: 'Smooth',
              text: output.response || 'tell me more 👀',
              vibeReason: 'Confident and natural',
            },
            {
              label: 'Bold',
              text: output.response || 'tell me more 👀',
              vibeReason: 'Direct and memorable',
            },
          ];

    // 2. Deduct 1 credit ONLY after AI successfully generated the 3 replies
    if (isDatabaseConfigured() && input.userId) {
      const [updated] = await db
        .update(users)
        .set({
          credits: sql`GREATEST(0, ${users.credits} - 1)`,
        })
        .where(eq(users.id, input.userId))
        .returning({ credits: users.credits });

      remainingCredits = updated?.credits;
    }

    return {
      response: output.response || options[1]?.text || options[0]?.text,
      explanation: output.explanation || 'Pick the line that fits your move:',
      options,
      remainingCredits,
    };
  } catch (e: any) {
    console.error('Error in maintainSessionMemory:', e);
    return {
      response: '',
      explanation: '',
      options: [],
      error: e.message || 'Failed to generate AI response.',
    };
  }
}
