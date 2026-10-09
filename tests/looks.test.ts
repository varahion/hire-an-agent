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

test("no accessory uses <text>, which the share image can't draw", async () => {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");
  for (const look of VARA_LOOKS) {
    const svg = renderToStaticMarkup(createElement("svg", null, ACCESSORIES[look]));
    assert.equal(svg.includes("<text"), false, look);
  }
});
