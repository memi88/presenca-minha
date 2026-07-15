import "server-only";

import Anthropic from "@anthropic-ai/sdk";

/**
 * Client único da API Anthropic — lê ANTHROPIC_API_KEY do ambiente
 * automaticamente. Server-only por design, mesmo espírito de lib/embed.ts:
 * a chave nunca pode chegar no bundle do browser.
 */
export const anthropic = new Anthropic();
