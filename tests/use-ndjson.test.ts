import assert from "node:assert/strict";
import test from "node:test";
import { readNdjson } from "../src/components/interview/use-ndjson";

function responseFrom(chunks: string[]) {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    }),
  );
}

async function collect(response: Response) {
  const out = [];
  for await (const event of readNdjson(response)) out.push(event);
  return out;
}

test("readNdjson joins an object split across two chunks", async () => {
  const out = await collect(responseFrom(['{"type":"del', 'ta","text":"Hi"}\n']));
  assert.deepEqual(out, [{ type: "delta", text: "Hi" }]);
});

test("readNdjson ignores blank lines and reads a last line without a newline", async () => {
  const out = await collect(responseFrom(['{"type":"status","text":"a"}\n\n', '{"type":"delta","text":"b"}']));
  assert.equal(out.length, 2);
});

test("readNdjson throws on a malformed line", async () => {
  await assert.rejects(collect(responseFrom(["{not json}\n"])));
});
