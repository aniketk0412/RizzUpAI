import { GoogleGenAI, Type } from '@google/genai';

export interface AIProviderResponse {
  text: string;
  providerUsed: string;
  modelUsed: string;
}

/**
 * Priority order of free AI providers:
 * 1. NVIDIA NIM (1M context Nemotron-3 / Llama-4 Multimodal) -> if NVIDIA_API_KEY is set
 * 2. Groq Cloud (Ultra-fast Llama 4 Scout / Llama 3.3 70B Free Tier) -> if GROQ_API_KEY is set
 * 3. OpenRouter (:free 1M context models) -> if OPENROUTER_API_KEY is set
 * 4. Google Gemini 2.5 Flash (1M context Free Tier) -> if GEMINI_API_KEY is set
 */
export async function generateStructuredJSON(params: {
  prompt: string;
  systemInstruction?: string;
  imageDataUri?: string;
  geminiSchema?: any;
}): Promise<AIProviderResponse> {
  const errors: string[] = [];

  // 1. Try NVIDIA NIM (build.nvidia.com - Free 1M Context Models)
  if (process.env.NVIDIA_API_KEY) {
    const nvidiaModel = process.env.NVIDIA_MODEL || (
      params.imageDataUri
        ? 'meta/llama-4-maverick-17b-128e-instruct'
        : 'nvidia/nemotron-3-super-120b-a12b'
    );
    try {
      const text = await callOpenAICompatible({
        baseUrl: 'https://integrate.api.nvidia.com/v1/chat/completions',
        apiKey: process.env.NVIDIA_API_KEY,
        model: nvidiaModel,
        prompt: params.prompt,
        systemInstruction: params.systemInstruction,
        imageDataUri: params.imageDataUri,
      });
      return { text, providerUsed: 'nvidia', modelUsed: nvidiaModel };
    } catch (err: any) {
      console.warn('NVIDIA NIM fallback triggered:', err.message);
      errors.push(`NVIDIA: ${err.message}`);
    }
  }

  // 2. Try Google Gemini 2.5 Flash (1M Context Window)
  const geminiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.GOOGLE_API_KEY;

  if (geminiKey) {
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const contents: any[] = [];

      if (params.imageDataUri) {
        const match = params.imageDataUri.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          contents.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      }
      contents.push({ text: params.prompt });

      const result = await ai.models.generateContent({
        model: geminiModel,
        contents,
        config: {
          responseMimeType: 'application/json',
          ...(params.geminiSchema && { responseSchema: params.geminiSchema }),
        },
      });

      if (result.text) {
        return { text: result.text, providerUsed: 'gemini', modelUsed: geminiModel };
      }
    } catch (err: any) {
      console.warn('Gemini fallback triggered:', err.message);
      errors.push(`Gemini: ${err.message}`);
    }
  }

  // 3. Try Groq Free Tier (14,400 req/day - Llama 4 Scout 17B Vision + Text)
  if (process.env.GROQ_API_KEY) {
    const groqModel =
      process.env.GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';
    try {
      const text = await callOpenAICompatible({
        baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: process.env.GROQ_API_KEY,
        model: groqModel,
        prompt: params.prompt,
        systemInstruction: params.systemInstruction,
        imageDataUri: params.imageDataUri,
      });
      return { text, providerUsed: 'groq', modelUsed: groqModel };
    } catch (err: any) {
      console.warn('Groq fallback triggered:', err.message);
      errors.push(`Groq: ${err.message}`);
    }
  }

  // 4. Try OpenRouter Free Tier (:free models)
  if (process.env.OPENROUTER_API_KEY) {
    const openRouterModel =
      process.env.OPENROUTER_MODEL || 'meta-llama/llama-4-maverick:free';
    try {
      const text = await callOpenAICompatible({
        baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
        apiKey: process.env.OPENROUTER_API_KEY,
        model: openRouterModel,
        prompt: params.prompt,
        systemInstruction: params.systemInstruction,
        imageDataUri: params.imageDataUri,
      });
      return { text, providerUsed: 'openrouter', modelUsed: openRouterModel };
    } catch (err: any) {
      console.warn('OpenRouter fallback triggered:', err.message);
      errors.push(`OpenRouter: ${err.message}`);
    }
  }

  throw new Error(
    errors.length > 0
      ? `All configured AI providers failed (${errors.join(' | ')})`
      : 'No AI API key configured. Add NVIDIA_API_KEY, GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY.'
  );
}

async function callOpenAICompatible(opts: {
  baseUrl: string;
  apiKey: string;
  model: string;
  prompt: string;
  systemInstruction?: string;
  imageDataUri?: string;
}): Promise<string> {
  const userContent: any = opts.imageDataUri
    ? [
        { type: 'text', text: opts.prompt },
        { type: 'image_url', image_url: { url: opts.imageDataUri } },
      ]
    : opts.prompt;

  const messages: any[] = [
    {
      role: 'system',
      content:
        (opts.systemInstruction || 'You are a helpful assistant.') +
        '\nIMPORTANT: Respond ONLY with valid, raw JSON matching the requested schema. Do not wrap in markdown code fences.',
    },
    {
      role: 'user',
      content: userContent,
    },
  ];

  const res = await fetch(opts.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model,
      messages,
      temperature: 0.75,
      max_tokens: 1500,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  let raw = data.choices?.[0]?.message?.content || '';

  // Strip <think>...</think> blocks if using a reasoning model
  raw = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  // Strip ```json ... ``` fences if present
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  return raw;
}
