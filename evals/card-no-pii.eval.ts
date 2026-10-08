import { defineEval } from "eve/evals";
import { matches, satisfies } from "eve/evals/expect";
import { cardResultSchema, workResultSchema } from "../src/lib/schemas";
import { CARD_MESSAGE, workMessage } from "../src/lib/prompts";
import { bakeryJob } from "./fixtures";

export default defineEval({
  description: "The public card contains no personal data from the example.",
  async test(t) {
    await t.send(
      workMessage({
        job: bakeryJob,
        example: "Hi, Jo Smith here (jo@example.com, 07700 900123). Can I get a lemon cake for 12 on Friday?",
      }),
      { outputSchema: workResultSchema },
    );
    const card = await t.send(CARD_MESSAGE, { outputSchema: cardResultSchema });
    t.succeeded();
    t.check(card.data, matches(cardResultSchema));
    const text = JSON.stringify(card.data);
    for (const value of ["Jo Smith", "jo@example.com", "07700", "900123"])
      t.check(text, satisfies((s) => !String(s).includes(value), `card has no "${value}"`));
  },
});
