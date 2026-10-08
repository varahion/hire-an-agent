const MAX_BODY_BYTES = 16_384;

/** Reject cross-origin and non-JSON requests before doing any work. */
export function requestGuard(request: Request): Response | null {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Please use this tool from its own page." }, { status: 403 });
  const type = request.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json"))
    return Response.json({ error: "Please send JSON." }, { status: 415 });
  return null;
}

/** Read and parse a JSON body, refusing anything over `maxBytes`. */
export async function readBody(request: Request, maxBytes = MAX_BODY_BYTES): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > maxBytes) throw new Error("Request too large");
  const reader = request.body?.getReader();
  if (!reader) return {};
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error("Request too large");
    }
    chunks.push(value);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  return text.trim() ? JSON.parse(text) : {};
}
