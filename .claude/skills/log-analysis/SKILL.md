---
name: log-analysis
description: "Analyse this project's event log and give a diagnostic report on how the app and its agents are behaving: errors, slow or failing calls, LLM and tool usage, cost, and odd patterns. Use whenever the user asks to check the logs, see if the app or agent is healthy, find out why something is slow or failing, review what the agent has been doing, or get feedback on runtime behaviour, even if they don't name the log file or the script."
---

# Log analysis

The app writes a unified, append-only event log: one JSON object per line in `<logs/events-YYYY-MM-DD.jsonl>`. It's the flight recorder: every LLM call, tool call, external API call and user-visible action. Events from one agent decision share a `traceId`, so a decision and everything it triggered read back as one trace.

Your job is to **diagnose and recommend**: say what the logs show, then suggest concrete changes with reasons. A bundled script does the counting. Don't re-count by hand or eyeball the raw JSONL; run the script and reason about its output.

## Event shape

Each line should have at least:

```json
{ "ts": "2026-10-08T12:00:00Z", "type": "llm.call", "name": "draftReply", "traceId": "t_123", "durationMs": 840, "ok": true, "error": null, "model": "anthropic/claude-sonnet", "costUsd": 0.0012 }
```

`type` groups events (`llm.call`, `tool.call`, `api.call`, `user.action`, …); `name` is the specific call. Extra fields are fine. If the project has no event log yet, say so and offer to add one before analysing anything.

## Step 1: Run the script

```bash
python3 .claude/skills/log-analysis/scripts/analyze_events.py [--dir <logs>] [--since 24h]
```

- `--dir`: the log folder (default `logs`).
- `--since`: a recent window such as `6h`, `24h`, `3d`, `1w`. Use it when the user asks about "today" or "this week".

Read the whole digest before writing anything.

## Step 2: Interpret

- **Errors:** anything above zero deserves a look. Several errors on one `name` usually share one cause; find it.
- **Latency:** compare p50 with p95. A big gap means retries or a slow path on some inputs. Find the slow traces and say what they have in common.
- **LLM usage:** calls per trace, models used, cost per day. A trace with many more calls than usual often means an agent loop that isn't converging.
- **Patterns:** the same input repeated, one item chosen far more than others, long silences. These show behaviour problems that never raise an error.

## Step 3: Report

Keep it short:

1. **Verdict:** healthy, degraded, or broken, in one line.
2. **Top 3 findings,** each with the evidence (numbers from the digest, trace IDs).
3. **Recommendations,** each tied to a finding, most valuable first.
4. **What to log next,** if a question couldn't be answered from the data.

Don't change code or settings from this skill; recommend, and let the user decide.
