import { defineEval } from "eve/evals";
import { matches, satisfies } from "eve/evals/expect";
import { workResultSchema, type WorkResult } from "../src/lib/schemas";
import { bakeryWork } from "./fixtures";

export default defineEval({
  description: "Works on the visitor's own example and lists what's missing.",
  async test(t) {
    const turn = await t.send(bakeryWork, { outputSchema: workResultSchema });
    t.succeeded();
    t.check(turn.data, matches(workResultSchema));
    const data = turn.data as WorkResult;
    t.check(data.draft, satisfies((d) => String(d).trim().length > 40, "non-empty draft"));
    t.check(data.missing, satisfies((m) => Array.isArray(m) && m.length >= 1, "lists at least one missing detail"));
    t.check(data.draft, satisfies((d) => /chocolate|cake/i.test(String(d)), "about the customer's cake"));
  },
});
