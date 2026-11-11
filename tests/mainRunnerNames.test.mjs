import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { parseContent } from "../js/contentData.js";

const content = parseContent(readFileSync(new URL("../content.csv", import.meta.url), "utf8"));

test("the main site maps all stable runner IDs to the current result names", () => {
  assert.deepEqual(Object.fromEntries(Object.entries(content.resultData).map(([id, result]) => [id, result.title.zh])), {
    experience: "賽事收藏家",
    lifestyle: "自在巡航員",
    performance: "配速計算機"
  });
});

test("the main entry does not load the archived Cute prototype", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const app = readFileSync(new URL("../js/appV2.js", import.meta.url), "utf8");

  assert.match(html, /src="js\/appV2\.js"/);
  assert.doesNotMatch(html, /cute|data-ui-variant/i);
  assert.match(app, /from "\.\/projectAssets\.js"/);
  assert.doesNotMatch(app, /uiVariant/);
  assert.equal(existsSync(new URL("../cute/index.html", import.meta.url)), false);
  assert.equal(existsSync(new URL("../_archive/cute-prototype/site/index.html", import.meta.url)), true);
});
