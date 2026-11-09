import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { getHydrationEquipment } from "../js/hydrationEquipment.js";
import { parseContent } from "../js/contentData.js";

const projectRoot = new URL("../", import.meta.url);
const content = parseContent(readFileSync(new URL("../content.csv", import.meta.url), "utf8"));

test("all nine stable recommendations map to their intended hydration images", () => {
  const expected = {
    "experience:precision": ["hydrationVest"],
    "experience:rest": ["softCup"],
    "experience:pioneer": [],
    "lifestyle:precision": ["softFlask", "hydrationVest"],
    "lifestyle:rest": ["softCup"],
    "lifestyle:pioneer": [],
    "performance:precision": ["softCup"],
    "performance:rest": ["softCup"],
    "performance:pioneer": []
  };

  assert.equal(Object.keys(content.recommendations).length, 9);
  for (const [key, ids] of Object.entries(expected)) {
    const [runnerType, hydrationStyle] = key.split(":");
    const recommendation = content.recommendations[key];
    assert.ok(recommendation, `Missing CSV recommendation ${key}`);
    const equipment = getHydrationEquipment(runnerType, hydrationStyle);
    assert.deepEqual(equipment.map(({ id }) => id), ids);
    for (const item of equipment) {
      assert.ok(item.src.startsWith("./assets/waterequip/"));
      assert.ok(existsSync(new URL(item.src, projectRoot)), `Missing equipment image ${item.src}`);
      assert.ok(item.alt.zh && item.alt.en);
    }
    if (hydrationStyle === "pioneer") assert.deepEqual(equipment, []);
  }
});

test("hydration images and result layout are isolated from prize inventory and dog artwork", () => {
  const equipmentModule = readFileSync(new URL("../js/hydrationEquipment.js", import.meta.url), "utf8");
  const app = readFileSync(new URL("../js/appV2.js", import.meta.url), "utf8");
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");

  assert.match(equipmentModule, /hydrationVest/);
  assert.match(equipmentModule, /softFlask/);
  assert.match(equipmentModule, /softCup/);
  assert.match(app, /getHydrationEquipment\(state\.result\.runnerType, state\.result\.hydrationStyle\)/);
  assert.match(app, /experience:\s*"\.\/assets\/result\/賽事收藏家\.png"/);
  assert.ok(existsSync(new URL("../assets/result/賽事收藏家.png", import.meta.url)));
  assert.match(app, /lifestyle:\s*"\.\/assets\/result\/自在巡航員\.png"/);
  assert.ok(existsSync(new URL("../assets/result/自在巡航員.png", import.meta.url)));
  assert.match(app, /performance:\s*"\.\/assets\/result\/配速計算機\.png"/);
  assert.ok(existsSync(new URL("../assets/result/配速計算機.png", import.meta.url)));
  assert.match(html, /<section class="v2-recommendation"[\s\S]*?data-hydration-equipment/);
  assert.match(html, /class="runner-visual" data-runner-visual/);
  assert.match(html, /data-runner-image[^>]*hidden/);
  assert.match(html, /class="runner-tags"[\s\S]*data-result-tag/);
  assert.doesNotMatch(html, /data-dog-image/);
  assert.match(css, /\.hydration-equipment-image\s*\{[^}]*object-fit:\s*contain/s);
  assert.match(css, /\.runner-visual-image\s*\{[^}]*object-fit:\s*contain/s);
  assert.match(css, /\.runner-visual-image\s*\{[^}]*border-radius:\s*var\(--radius-card\)/s);
  assert.match(css, /\.screen-redemption\.is-sustainable::before,[\s\S]*?\.screen-redemption\.is-sustainable::after\s*\{[^}]*永續先鋒隊裝飾\.png/s);
  assert.match(css, /\.screen-redemption\.is-sustainable::before/);
  assert.match(css, /\.screen-redemption\.is-sustainable::after/);
  assert.match(css, /\.screen-redemption\s*\{[^}]*border-radius:\s*var\(--radius-card\)/s);
  assert.match(css, /\.screen-redemption\.is-sustainable\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(css, /--redemption-ribbon-aspect-ratio:\s*20\s*\/\s*1/);
  assert.match(css, /\.screen-redemption\.is-sustainable::before,[\s\S]*?aspect-ratio:\s*var\(--redemption-ribbon-aspect-ratio\)/);
  assert.match(css, /\.screen-redemption\.is-sustainable::before\s*\{[^}]*top:\s*var\(--redemption-ribbon-offset\)/s);
  assert.match(css, /\.screen-redemption\.is-sustainable::after\s*\{[^}]*bottom:\s*var\(--redemption-ribbon-offset\)/s);
  assert.match(css, /pointer-events:\s*none/);
  assert.doesNotMatch(css, /\.screen-redemption\.is-non-sustainable::(?:before|after)/);
  const tuningVariables = [
    "result-title-size", "result-slogan-size", "result-title-slogan-gap", "result-visual-ratio",
    "result-section-gap", "result-tags-gap", "result-tag-font-size", "result-tag-padding",
    "recommendation-padding", "recommendation-heading-size", "recommendation-copy-size",
    "hydration-image-size", "hydration-image-gap", "hydration-content-gap",
    "hydration-choice-gap", "hydration-choice-height", "hydration-choice-font-size",
    "result-continue-margin-top", "result-continue-margin-bottom"
  ];
  for (const variable of tuningVariables) {
    assert.match(css, new RegExp(`var\\(--${variable}\\)`), `Unused tuning variable --${variable}`);
  }
  assert.match(css, /\.runner-tags\s*\{[^}]*flex-wrap:\s*wrap/s);
  assert.match(css, /\.hydration-recommendation-row\s*\{[^}]*grid-template-columns:[^;]*var\(--hydration-image-size\)/s);
  assert.match(css, /\.v2-recommendation\.is-pioneer \.hydration-recommendation-row\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(css, /\.runner-visual\s*\{[^}]*aspect-ratio:\s*var\(--result-visual-ratio\)/s);
  assert.match(css, /\.runner-visual-image\s*\{[^}]*width:\s*100%;[^}]*height:\s*auto/s);
});
