import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, type LanguageModel } from "ai";

/**
 * Model access for counsel. Free tiers first: Groq, then Gemini, then
 * OpenRouter's free models. Keys are deploy-level configuration; each is
 * optional, and with none set the court runs only the rehearsed trial.
 */

interface Provider {
  name: string;
  model: () => LanguageModel;
}

function env(name: string): string | undefined {
  // guard:allow-env-credential — deploy-level counsel model keys, set by the operator
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

function providers(): Provider[] {
  const list: Provider[] = [];
  const groqKey = env("GROQ_API_KEY");
  if (groqKey) {
    list.push({
      name: "groq",
      model: () =>
        createGroq({ apiKey: groqKey })(
          env("COUNSEL_GROQ_MODEL") ?? "llama-3.3-70b-versatile",
        ),
    });
  }
  const geminiKey = env("GEMINI_API_KEY") ?? env("GOOGLE_GENERATIVE_AI_API_KEY");
  if (geminiKey) {
    list.push({
      name: "gemini",
      model: () =>
        createGoogleGenerativeAI({ apiKey: geminiKey })(
          env("COUNSEL_GEMINI_MODEL") ?? "gemini-flash-lite-latest",
        ),
    });
  }
  const openRouterKey = env("OPENROUTER_API_KEY");
  if (openRouterKey) {
    list.push({
      name: "openrouter",
      model: () =>
        createOpenRouter({ apiKey: openRouterKey })(
          env("COUNSEL_OPENROUTER_MODEL") ?? "meta-llama/llama-3.3-70b-instruct:free",
        ),
    });
  }
  return list;
}

export function counselAvailable(): { live: boolean; providers: string[] } {
  const names = providers().map((p) => p.name);
  return { live: names.length > 0, providers: names };
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1] ?? text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("No JSON object in reply");
  return JSON.parse(raw.slice(start, end + 1));
}

/** One JSON completion, trying each configured provider in order. */
export async function completeJson(system: string, prompt: string): Promise<{
  value: unknown;
  provider: string;
}> {
  const list = providers();
  if (list.length === 0) throw new Error("No counsel model key is configured");
  const errors: string[] = [];
  for (const p of list) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { text } = await generateText({
          model: p.model(),
          system,
          prompt:
            attempt === 0
              ? prompt
              : `${prompt}\n\nYour previous reply was not valid JSON. Reply with the JSON object only.`,
          temperature: 0.6,
          maxOutputTokens: 900,
          maxRetries: 0,
        });
        return { value: extractJson(text), provider: p.name };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${p.name}: ${message.slice(0, 160)}`);
        // A rate limit or auth failure will not fix itself on retry; move on.
        if (/429|rate|quota|401|403|key/i.test(message)) break;
      }
    }
  }
  throw new Error(`Counsel could not reach a model. ${errors.join(" | ")}`);
}
