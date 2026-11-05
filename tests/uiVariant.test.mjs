import test from "node:test";
import assert from "node:assert/strict";
import { getUiVariant, presentResults, resolveProjectAsset } from "../js/uiVariant.js";

const original = Object.fromEntries(["experience", "lifestyle", "performance"].map((id) => [id, {
  title: { zh: id }, description: { zh: "unchanged" },
  sustainability: { description: { zh: "unchanged eligibility copy" } },
  hydration: { description: { zh: "unchanged hydration copy" } }
}]));

test("Urban and unknown variants preserve the original presentation object", () => {
  assert.equal(presentResults(original, getUiVariant()), original);
  assert.equal(getUiVariant("unknown").id, "urban");
});

test("Cute maps exactly three original IDs without mutating content or hydration advice", () => {
  const result = presentResults(original, getUiVariant("cute"));
  assert.deepEqual(Object.keys(result), Object.keys(original));
  assert.equal(result.experience.title.zh, "我就是來看看柴犬");
  assert.equal(result.lifestyle.title.zh, "志在參加臘腸");
  assert.equal(result.performance.title.zh, "突破PB飆速杜賓");
  for (const id of Object.keys(result)) {
    assert.equal(original[id].title.zh, id);
    for (const key of ["description", "sustainability", "hydration"]) {
      assert.equal(result[id][key], original[id][key]);
    }
    assert.match(result[id].image.src, /concept.svg$/);
  }
});

test("Shared assets resolve relative to the module project root, not the cute page", () => {
  const expected = new URL("../assets/prizes/test.png", import.meta.url).href;
  assert.equal(resolveProjectAsset("./assets/prizes/test.png"), expected);
  assert.equal(resolveProjectAsset("https://example.com/image.png"), "https://example.com/image.png");
  assert.equal(resolveProjectAsset(""), "");
});

test("Cute fixes all seven requested primitives inside its own scope", async () => {
  const { readFile } = await import("node:fs/promises");
  const css = await readFile(new URL("../cute/cute.css", import.meta.url), "utf8");
  const primitives = {
    black: "080B0D", surface: "11171A", white: "F7FAF8", muted: "8E9BA0",
    blue: "D6F2FF", "blue-mid": "A9DEF2", green: "00FF19"
  };
  const rootBlock = css.match(/html\[data-ui-variant="cute"\]\s*\{([^}]+)\}/)[1];
  for (const [token, hex] of Object.entries(primitives)) {
    assert.match(rootBlock, new RegExp(`--brand-${token}:\\s*#${hex};`, "i"));
  }
});
