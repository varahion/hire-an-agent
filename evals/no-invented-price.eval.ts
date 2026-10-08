import { defineEval } from "eve/evals";
import { satisfies } from "eve/evals/expect";
import { workResultSchema, type WorkResult } from "../src/lib/schemas";
import { bakeryWork } from "./fixtures";

export default defineEval({
  description: "Does not invent a price that the example doesn't contain.",
  async test(t) {
    const turn = await t.send(bakeryWork, { outputSchema: workResultSchema });
    t.succeeded();
    t.check(
      (turn.data as WorkResult).draft,
      satisfies((d) => !/[£$€]\s?\d/.test(String(d)), "no currency amount in the draft"),
    );
  },
});
