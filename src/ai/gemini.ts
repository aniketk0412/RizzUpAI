import { GoogleGenAI } from '@google/genai';

export interface AIProviderResponse {
  text: string;
  providerUsed: string;
  modelUsed: string;
}

/**
 * =========================================================================
 * HYBRID CIRCUIT BREAKER & ERROR CLASSIFIER
 * =========================================================================
 * Prevents waiting on failing / rate-limited / deprecated models.
 * - 404 (Deprecated / Not Found): Permanently blacklisted in-memory (0ms skip).
 * - 429 / 5xx / Timeouts: Trips Circuit OPEN for 60s cooldown.
 * - Probes recovery automatically via HALF-OPEN state.
 */
interface CircuitState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  lastFailureTime: number;
  blacklisted: boolean;
  reason?: string;
}

class CircuitBreakerManager {
  private circuits = new Map<string, CircuitState>();
  private readonly COOLDOWN_MS = 60_000; // 60 seconds cooldown for 429/5xx
  private readonly FAILURE_THRESHOLD = 2; // Trip after 2 consecutive failures

  canExecute(key: string): boolean {
    const circuit = this.circuits.get(key);
    if (!circuit) return true;

    if (circuit.blacklisted) {
      return false; // Instant 0ms skip for deprecated/blacklisted models
    }

    if (circuit.state === 'OPEN') {
      const now = Date.now();
      if (now - circuit.lastFailureTime > this.COOLDOWN_MS) {
        circuit.state = 'HALF_OPEN';
        return true; // Allow 1 probe request
      }
      return false; // Circuit still cooling down; skip instantly (0ms)
    }

    return true;
  }

  recordSuccess(key: string) {
    const circuit = this.circuits.get(key);
    if (circuit) {
      circuit.state = 'CLOSED';
      circuit.failures = 0;
      circuit.lastFailureTime = 0;
      circuit.reason = undefined;
    }
  }

  recordFailure(key: string, error: any) {
    let circuit = this.circuits.get(key);
    if (!circuit) {
      circuit = {
        state: 'CLOSED',
        failures: 0,
        lastFailureTime: 0,
        blacklisted: false,
      };
      this.circuits.set(key, circuit);
    }

    const errStr = (error?.message || String(error || '')).toLowerCase();
    const is404 =
      errStr.includes('404') ||
      errStr.includes('not_found') ||
      errStr.includes('no longer available') ||
      errStr.includes('does not exist');

    if (is404) {
      circuit.blacklisted = true;
      circuit.reason = 'Model deprecated / 404';
      console.warn(`[CircuitBreaker] Blacklisted ${key}: ${circuit.reason}`);
      return;
    }

    circuit.failures += 1;
    circuit.lastFailureTime = Date.now();

    const isRateLimit =
      errStr.includes('429') ||
      errStr.includes('quota') ||
      errStr.includes('resource_exhausted') ||
      errStr.includes('rate limit');

    const isServerDown =
      errStr.includes('500') ||
      errStr.includes('502') ||
      errStr.includes('503') ||
      errStr.includes('504') ||
      errStr.includes('unavailable') ||
      errStr.includes('timeout') ||
      errStr.includes('aborted');

    if (isRateLimit || isServerDown || circuit.failures >= this.FAILURE_THRESHOLD) {
      circuit.state = 'OPEN';
      circuit.reason = isRateLimit ? 'Rate Limited (429)' : 'Server Error / Timeout';
      console.warn(
        `[CircuitBreaker] Tripped OPEN for ${key} (${circuit.reason}). Cooling down for 60s.`
      );
    }
  }

  getStatus() {
    const status: Record<string, any> = {};
    this.circuits.forEach((val, key) => {
      status[key] = { state: val.state, blacklisted: val.blacklisted, reason: val.reason };
    });
    return status;
  }
}

export const circuitBreaker = new CircuitBreakerManager();

/**
 * =========================================================================
 * HYBRID MULTI-PROVIDER AI ROUTER
 * =========================================================================
 * Priority order with Circuit Breaker skip:
 * 1. NVIDIA NIM (build.nvidia.com)
 * 2. Google Gemini (candidate cascade with 404-blacklist & 429-cooldown)
 * 3. Groq Cloud (Ultra-fast Llama 4 Scout)
 * 4. OpenRouter (:free 1M context models)
 */
export async function generateStructuredJSON(params: {
  prompt: string;
  systemInstruction?: string;
  imageDataUri?: string;
  geminiSchema?: any;
}): Promise<AIProviderResponse> {
  const errors: string[] = [];

  // 1. Try NVIDIA NIM
  if (process.env.NVIDIA_API_KEY) {
    const nvidiaModel =
      process.env.NVIDIA_MODEL ||
      (params.imageDataUri
        ? 'meta/llama-4-maverick-17b-128e-instruct'
        : 'nvidia/nemotron-3-super-120b-a12b');
    const key = `nvidia:${nvidiaModel}`;

    if (circuitBreaker.canExecute(key)) {
      try {
        const text = await callOpenAICompatible({
          baseUrl: 'https://integrate.api.nvidia.com/v1/chat/completions',
          apiKey: process.env.NVIDIA_API_KEY,
          model: nvidiaModel,
          prompt: params.prompt,
          systemInstruction: params.systemInstruction,
          imageDataUri: params.imageDataUri,
        });
        circuitBreaker.recordSuccess(key);
        return { text, providerUsed: 'nvidia', modelUsed: nvidiaModel };
      } catch (err: any) {
        circuitBreaker.recordFailure(key, err);
        errors.push(`NVIDIA(${nvidiaModel}): ${err.message}`);
      }
    } else {
      errors.push(`NVIDIA(${nvidiaModel}): Skipped by Circuit Breaker (cooling down)`);
    }
  }

  // 2. Try Google Gemini with Candidate Cascade + Circuit Breaker
  const geminiKey = (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ''
  ).trim();

  if (geminiKey) {
    const candidateModels = process.env.GEMINI_MODEL
      ? [process.env.GEMINI_MODEL, 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-2.0-flash']
      : ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.0-flash', 'gemini-2.0-flash'];

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

    for (const geminiModel of candidateModels) {
      const key = `gemini:${geminiModel}`;

      if (!circuitBreaker.canExecute(key)) {
        continue; // 0ms skip for blacklisted/cooling-down models
      }

      try {
        const result = await Promise.race([
          ai.models.generateContent({
            model: geminiModel,
            contents,
            config: {
              responseMimeType: 'application/json',
              ...(params.geminiSchema && { responseSchema: params.geminiSchema }),
            },
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Gemini API timeout after 10s')), 10000)
          ),
        ]);

        if (result.text) {
          circuitBreaker.recordSuccess(key);
          return { text: result.text, providerUsed: 'gemini', modelUsed: geminiModel };
        }
      } catch (err: any) {
        circuitBreaker.recordFailure(key, err);
        errors.push(`Gemini(${geminiModel}): ${err.message}`);
      }
    }
  }

  // 3. Try Groq Free Tier
  if (process.env.GROQ_API_KEY) {
    const groqModel =
      process.env.GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';
    const key = `groq:${groqModel}`;

    if (circuitBreaker.canExecute(key)) {
      try {
        const text = await callOpenAICompatible({
          baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
          apiKey: process.env.GROQ_API_KEY,
          model: groqModel,
          prompt: params.prompt,
          systemInstruction: params.systemInstruction,
          imageDataUri: params.imageDataUri,
        });
        circuitBreaker.recordSuccess(key);
        return { text, providerUsed: 'groq', modelUsed: groqModel };
      } catch (err: any) {
        circuitBreaker.recordFailure(key, err);
        errors.push(`Groq(${groqModel}): ${err.message}`);
      }
    } else {
      errors.push(`Groq(${groqModel}): Skipped by Circuit Breaker`);
    }
  }

  // 4. Try OpenRouter Free Tier
  if (process.env.OPENROUTER_API_KEY) {
    const openRouterModel =
      process.env.OPENROUTER_MODEL || 'meta-llama/llama-4-maverick:free';
    const key = `openrouter:${openRouterModel}`;

    if (circuitBreaker.canExecute(key)) {
      try {
        const text = await callOpenAICompatible({
          baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
          apiKey: process.env.OPENROUTER_API_KEY,
          model: openRouterModel,
          prompt: params.prompt,
          systemInstruction: params.systemInstruction,
          imageDataUri: params.imageDataUri,
        });
        circuitBreaker.recordSuccess(key);
        return { text, providerUsed: 'openrouter', modelUsed: openRouterModel };
      } catch (err: any) {
        circuitBreaker.recordFailure(key, err);
        errors.push(`OpenRouter(${openRouterModel}): ${err.message}`);
      }
    } else {
      errors.push(`OpenRouter(${openRouterModel}): Skipped by Circuit Breaker`);
    }
  }

  throw new Error(
    errors.length > 0
      ? `All configured AI providers failed (${errors.join(' | ')})`
      : 'No AI API key configured. Add GEMINI_API_KEY, NVIDIA_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY.'
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s deadline

  try {
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
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    let raw = data.choices?.[0]?.message?.content || '';

    // Strip reasoning blocks if model returns them
    raw = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    // Strip markdown fences if present
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    return raw;
  } finally {
    clearTimeout(timeoutId);
  }
}
