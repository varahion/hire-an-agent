import { timingSafeEqual } from "node:crypto";
import { localDev } from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";

// Only this app's server routes may call the agent. Fail closed without a token.
// localDev() is the last fallback: it accepts requests only inside a local
// `eve dev` / `vercel dev` server (used by `eve eval`), never in production.
export default eveChannel({
  auth: [
    (request) => {
      const secret = process.env.EVE_SERVICE_TOKEN;
      const actual = request.headers.get("authorization") ?? "";
      const expected = `Bearer ${secret}`;
      if (
        !secret ||
        actual.length !== expected.length ||
        !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
      )
        return null;
      return {
        authenticator: "hire-an-agent-server",
        principalType: "service",
        principalId: "hire-an-agent",
        attributes: {},
      };
    },
    localDev(),
  ],
});
