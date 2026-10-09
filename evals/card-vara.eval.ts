import { defineEval } from "eve/evals";
import { satisfies } from "eve/evals/expect";
import { cardResultSchema, workResultSchema } from "../src/lib/schemas";
import { cardMessage } from "../src/lib/prompts";
import { bakeryWork } from "./fixtures";

export default defineEval({
  description: "The card names the Vara and picks the look that fits the job.",
  async test(t) {
    // One session for every turn: t.send() alone would start a new session each time.
    const session = await t.session();
    await session.send(bakeryWork, { outputSchema: workResultSchema });
    const card = await session.send(cardMessage(), { outputSchema: cardResultSchema });
    t.succeeded();
    const data = card.data as { name?: string; look?: string };
    t.check(data.look, satisfies((l) => l === "orders", "look is orders for cake orders"));
    t.check(
      data.name,
      satisfies(
        (n) => typeof n === "string" && n.length <= 24 && /vara$/i.test(n),
        "name ends in Vara and fits 24 characters",
      ),
    );
  },
});
