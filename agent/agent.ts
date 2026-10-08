import { defineAgent } from "eve";

export default defineAgent({
  // A static Gateway model id keeps the config compile-only. Change it with
  // `npx eve set model <id>` after benchmarking with the llm-bench skill.
  model: "openai/gpt-6-luna",
  defaultTools: false,
  tool: false,
  limits: {
    // Every turn re-sends the history, so input grows fast; the cost cap is the real limit.
    maxInputTokensPerSession: 30_000,
    maxOutputTokensPerSession: 4_000,
    maxTokenCostUsdPerSession: 0.05,
    sessionTimeoutMs: 60 * 60 * 1_000,
  },
});
