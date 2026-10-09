import assert from "node:assert/strict";
import test from "node:test";
import { ACCESSORIES, ORBIT_ICONS } from "../src/components/vara/looks";
import { VARA_LOOKS } from "../src/lib/schemas";

test("every look has an orbit set of 4 icons", () => {
  for (const look of VARA_LOOKS) assert.equal(ORBIT_ICONS[look].length, 4, look);
});

test("every look except other has an accessory", () => {
  for (const look of VARA_LOOKS)
    if (look === "other") assert.equal(ACCESSORIES[look], null);
    else assert.ok(ACCESSORIES[look], look);
});
