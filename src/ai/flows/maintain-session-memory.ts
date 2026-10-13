'use server';

import { Type } from '@google/genai';
import { eq, sql } from 'drizzle-orm';
import { generateStructuredJSON } from '@/ai/gemini';
import { db, isDatabaseConfigured } from '@/db';
import { users } from '@/db/schema';
import { checkFreeTierRateLimit } from '@/lib/rate-limit';
import type { ReplyOption, SubtextAnalysis } from '@/types';

export interface MaintainSessionMemoryInput {
  relation: string;
  tone: string;
  currentMessage: string;
  userId: string;
  image?: string;
  spicier?: boolean;
}

export interface MaintainSessionMemoryOutput {
  response: string;
  explanation: string;
  options: ReplyOption[];
  subtextAnalysis?: SubtextAnalysis;
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
        .select({ credits: users.credits, isPaid: users.isPaid })
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

      // 2. Strict Rate Limiting for Free Tier users (Paid users automatically bypass)
      const rateCheck = await checkFreeTierRateLimit({
        userId: input.userId,
        isPaidUser: Boolean(userRecord.isPaid),
        maxRequests: 5,
        windowSeconds: 60,
      });

      if (!rateCheck.allowed) {
        return {
          response: '',
          explanation: '',
          options: [],
          error: rateCheck.message || 'Free tier rate limit reached. Please wait a moment.',
        };
      }
    }

    const isGhosted = input.tone === 'Ghosted';
    const isSpicier = Boolean(input.spicier);

    const systemInstruction = `You are RizzUp, the world's most socially calibrated texting wingman. You write magnetic, effortless text replies for real conversations on iMessage, Instagram DMs, Hinge, and Tinder.

ABSOLUTE MANDATES:
1. NEVER SOUND LIKE AN AI: No ChatGPT corporate flirtations, no HR-approved banter, no cheesy pickup lines, and no stiff romance novel dialogue.
2. TEXTING REALISM: Real texts are brief (4 to 16 words max). Use natural lowercase or casual capitalization. Avoid stuffy formal punctuation (no semicolons, no textbook periods ending single-sentence casual texts).
3. SUBTEXT OVER EXPLAINING: Confident texters don't over-explain jokes or seek approval. Use playful misdirection, push-pull banter, and understated confidence.
4. MAXIMUM 1 EMOJI: 0 or 1 natural emoji max (like 👀, 💀, 😭, 😌, 😏). Never spam heart-eyes or corny emojis.
5. DECODE THE SUBTEXT: Read the psychological subtext of what they sent (shit-test, genuine curiosity, low-effort check-in, dry text, or flirty bait).
6. STRICTLY BANNED CLICHÉS:
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

Return strictly valid JSON matching {
  response: string,
  explanation: string,
  subtextAnalysis: { dynamic: string, subtext: string, powerBalance: "Their court" | "Balanced" | "Your court" },
  options: [{ label: string, text: string, vibeReason: string }]
}.`;

    const promptText = `Generate 3 distinct, ready-to-send text replies and a tactical subtext decode for this situation:

SITUATION:
- Who they are: ${input.relation}
- Selected Vibe: ${input.tone}${isSpicier ? ' (🔥 SPICIER / MAXIMUM HEAT MODE)' : ''}
- Context / Their Text: "${input.currentMessage || 'Analyze the attached screenshot and craft 3 tactical replies.'}"

${
  isGhosted
    ? `SPECIAL PROTOCOL: EMERGENCY REVIVE / ANTI-GHOSTING
The other person has gone silent, left on read, or gave a dead dry text ('k', 'haha', 'cool').
RULES:
- Zero needy energy (no 'still alive?', no 'did you forget about me', no double-text guilt).
- Option 1 (Playful Tease): Call out the radio silence with effortless, dry humor.
- Option 2 (Intrigue Hook): A random funny observation or cliffhanger that compels an immediate reply.
- Option 3 (Unbothered Reframe): Complete frame flip with high-status nonchalance.`
    : isSpicier
    ? `SPECIAL PROTOCOL: SPICIER / MAXIMUM BOLD RE-ROLL
Turn the confidence and flirtatious tension up to 10. Give 3 punchy, audacious, magnetic alternatives with razor-sharp wit and electric tension.`
    : `TONE SPECIFICS:
${
  input.tone === 'Rizz'
    ? '- Tone = High Rizz: High-status nonchalance, witty push-pull, magnetic banter that makes them qualify themselves. Unbothered, intriguing, zero try-hard energy.'
    : input.tone === 'Flirty'
    ? '- Tone = Flirty: Teasing spark, flirty tension, playful challenge that builds instant chemistry.'
    : input.tone === 'Romantic'
    ? '- Tone = Romantic: Understated charm, genuine warmth, magnetic attraction without being sappy or stiff.'
    : '- Tone = Playful: Dry wit, inside-joke energy, hilarious banter with zero awkwardness.'
}`
}

RELATION DYNAMICS:
- Target is "${input.relation}". Calibrate familiarity and boundaries.

THE 3 DISTINCT PLAYBOOK ANGLES:
1. Option 1 ("Chill"): Dry humor, playful tease, or low-investment banter. Unbothered cool.
2. Option 2 ("Smooth"): Confident charm, clever subtext, or witty reframe that turns their text into romantic momentum.
3. Option 3 ("Bold"): High-conviction spark, direct flirting, or seamlessly locking in the date/hangout without desperation.

OUTPUT REQUIREMENTS:
- "response": Top recommended reply.
- "explanation": Concise 5-8 word tactical read.
- "subtextAnalysis":
  - "dynamic": Short 2-4 word diagnosis (e.g. "Playful Shit-Test", "Low-Investment Check-In", "Flirty Deflection", "Curiosity Bait", "Radio Silence").
  - "subtext": 1 sharp sentence revealing what they actually mean beneath the surface.
  - "powerBalance": "Their court", "Balanced", or "Your court".
- "options": Array of 3 objects with { label, text, vibeReason }.
- Each "text" MUST be under 18 words and sound like a real person typing on iMessage right now.`;

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
          subtextAnalysis: {
            type: Type.OBJECT,
            properties: {
              dynamic: {
                type: Type.STRING,
                description: 'Short 2-4 word tag: e.g. "Playful Shit-Test", "Low-Investment Bait", "Curious Tease"',
              },
              subtext: {
                type: Type.STRING,
                description: 'One crisp sentence explaining the psychological subtext of what they sent.',
              },
              powerBalance: {
                type: Type.STRING,
                description: '"Their court", "Balanced", or "Your court"',
              },
            },
            required: ['dynamic', 'subtext', 'powerBalance'],
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
        required: ['response', 'explanation', 'subtextAnalysis', 'options'],
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
      subtextAnalysis: output.subtextAnalysis || undefined,
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
