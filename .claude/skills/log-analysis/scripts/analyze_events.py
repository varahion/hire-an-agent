#!/usr/bin/env python3
"""Summarise a JSONL event log into a digest for the log-analysis skill.

Each line is a JSON object with at least: ts, type, name. Optional: traceId,
durationMs, ok, error, model, costUsd. Unknown fields are ignored.
"""
import argparse
import glob
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone


def parse_since(value):
    match = re.fullmatch(r"(\d+)([hdw])", value or "")
    if not match:
        return None
    amount, unit = int(match.group(1)), match.group(2)
    hours = {"h": 1, "d": 24, "w": 168}[unit] * amount
    return datetime.now(timezone.utc) - timedelta(hours=hours)


def parse_ts(value):
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def percentile(values, pct):
    if not values:
        return None
    ordered = sorted(values)
    index = min(len(ordered) - 1, int(round(pct / 100 * (len(ordered) - 1))))
    return ordered[index]


def load(directory, since):
    files = sorted(glob.glob(os.path.join(directory, "events-*.jsonl")))
    events, bad = [], 0
    for path in files:
        with open(path, encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                try:
                    event = json.loads(line)
                except json.JSONDecodeError:
                    bad += 1
                    continue
                ts = parse_ts(event.get("ts"))
                if since and (ts is None or ts < since):
                    continue
                event["_ts"] = ts
                events.append(event)
    return files, events, bad


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dir", default="logs")
    parser.add_argument("--since")
    args = parser.parse_args()

    files, events, bad = load(args.dir, parse_since(args.since))
    if not files:
        print(f"No events-*.jsonl files in {args.dir!r}. The app may not write an event log yet.")
        sys.exit(1)

    stamps = [e["_ts"] for e in events if e["_ts"]]
    print("# Event log digest")
    print(f"files: {len(files)}  events: {len(events)}  unparseable lines: {bad}")
    if stamps:
        print(f"window: {min(stamps).isoformat()} → {max(stamps).isoformat()}")

    print("\n## By type")
    for kind, count in Counter(e.get("type", "?") for e in events).most_common():
        print(f"- {kind}: {count}")

    print("\n## By call (count, errors, p50/p95 ms)")
    by_name = defaultdict(list)
    for event in events:
        by_name[(event.get("type", "?"), event.get("name", "?"))].append(event)
    rows = []
    for (kind, name), group in by_name.items():
        durations = [e["durationMs"] for e in group if isinstance(e.get("durationMs"), (int, float))]
        errors = sum(1 for e in group if e.get("ok") is False or e.get("error"))
        rows.append((len(group), kind, name, errors, percentile(durations, 50), percentile(durations, 95)))
    for count, kind, name, errors, p50, p95 in sorted(rows, reverse=True)[:25]:
        print(f"- {kind}/{name}: {count} calls, {errors} errors, p50 {p50} ms, p95 {p95} ms")

    print("\n## Top errors")
    error_text = Counter(
        f"{e.get('name', '?')}: {str(e.get('error'))[:120]}" for e in events if e.get("error")
    )
    for text, count in error_text.most_common(10) or [("none", 0)]:
        print(f"- {count}× {text}" if count else "- none")

    llm = [e for e in events if str(e.get("type", "")).startswith("llm")]
    if llm:
        print("\n## LLM usage")
        for model, count in Counter(e.get("model", "?") for e in llm).most_common():
            print(f"- {model}: {count} calls")
        cost = sum(e.get("costUsd") or 0 for e in llm)
        print(f"- total cost: ${cost:.4f}")

    traces = defaultdict(list)
    for event in events:
        if event.get("traceId"):
            traces[event["traceId"]].append(event)
    if traces:
        sizes = [len(group) for group in traces.values()]
        print("\n## Traces")
        print(f"- traces: {len(traces)}  events per trace p50 {percentile(sizes, 50)}, p95 {percentile(sizes, 95)}, max {max(sizes)}")
        biggest = sorted(traces.items(), key=lambda item: len(item[1]), reverse=True)[:5]
        for trace_id, group in biggest:
            failed = sum(1 for e in group if e.get("ok") is False or e.get("error"))
            print(f"- {trace_id}: {len(group)} events, {failed} failed")


if __name__ == "__main__":
    main()
