---
name: llm-bench
description: "Benchmark and compare LLM providers and models on this project's real AI calls, then recommend which to use. Use whenever the user asks which model to use, whether a cheaper or local model is good enough, to compare models, test a model before switching, or when AI calls are slow, failing or returning bad structured output and the model choice is suspect. This skill only measures and recommends; it never changes the live configured model."
---

# LLM benchmark

Measure how well a **provider + model** handles this project's real AI calls before trusting it in production.

## Two things that surprise people

1. **Routing matters as much as the model.** The same model can pass through one provider and fail through another, because each provider translates tools and structured output differently. Always benchmark through the route you'll actually deploy. "Is model X good?" is the wrong question; "is provider + X good for our calls?" is the right one.
2. **The hard scenarios decide it.** Easy cases make every model look fine. The verdict comes from the stress cases: long context with a tool loop, cases where the right answer is to decline or say "not enough information", and multi-part structured JSON.

## The harness

If `<scripts/llm-bench>` doesn't exist yet, offer to build it. It should:

- **Import the live prompts and schemas** from the app's source, never copies, so the benchmark tests what actually ships.
- **Fake everything external** (databases, APIs, tools) with fixed fixtures, so runs are repeatable and free of side effects.
- **Run a matrix:** each provider+model × each call kind × each scenario (easy, typical, stress), several runs per cell.
- **Score each cell** on reliability (valid output, schema passes, no error), rule checks written for that call (e.g. "never invents a price", "declines when data is missing"), latency, and cost.
- **Override provider and model only inside its own process.** The live app's configuration is never touched.
- **Print a comparison table and write a JSON report** (`<bench-results/YYYY-MM-DD-HHMM.json>`) so runs can be diffed over time.

## Running it

```bash
<npm run llm-bench -- --models "openrouter/<model>,anthropic/<model>,ollama/<model>" --runs 3>
```

API keys come from the environment (`.env.local` etc.). Don't print them.

## Report

1. **Recommendation:** which provider+model to use per call kind, in one line each. Mixing is fine: a small model for simple calls, a stronger one for the agent loop.
2. **The table:** pass rate, p50/p95 latency and cost per 1,000 calls, for each provider+model.
3. **Where each one failed,** with the scenario and an example output.
4. **Fallback order:** if the first choice fails at runtime, what to try next.

Changing the live model is a settings change for the user to make, not part of this skill.
