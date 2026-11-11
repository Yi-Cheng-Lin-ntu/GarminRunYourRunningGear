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
      assert.ok(content.ui[item.altKey]?.zh && content.ui[item.altKey]?.en);
    }
    if (hydrationStyle === "pioneer") assert.deepEqual(equipment, []);
  }
});

test("hydration images and result layout are isolated from prize inventory and runner artwork", () => {
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
  assert.match(html, /class="result-hero-frame"/);
  assert.match(html, /data-runner-image[^>]*hidden/);
  assert.match(html, /data-sustainability-result-mark/);
  assert.match(html, /class="runner-tags"[\s\S]*data-result-tag/);
  assert.match(html, /data-share-canvas/);
  assert.match(html, /data-share-preview/);
  assert.match(html, /data-ig-placeholder/);
  assert.match(css, /\.hydration-equipment-image\s*\{[^}]*object-fit:\s*contain/s);
  assert.match(css, /\.runner-visual-image\s*\{[^}]*object-fit:\s*contain/s);
  assert.match(css, /\.runner-visual-image\s*\{[^}]*border-radius:\s*4px/s);
  assert.match(css, /\.screen-redemption\s*\{[^}]*background:\s*rgba\(8,11,13,\.72\);[^}]*color:\s*var\(--brand-white\)/s);
  assert.match(css, /\.prize-card\s*\{[^}]*border:\s*1px solid rgba\(247,250,248,\.82\)/s);
  assert.match(css, /\.prize-image::before\s*\{[^}]*background:\s*var\(--brand-green\)/s);
  assert.match(html, /class="redemption-action-card result-download-card"[^>]*data-action="download-result"/);
  assert.match(html, /class="redemption-cta"[^>]*data-action="download-result"/);
  assert.match(html, /class="redemption-action-card ig-placeholder-card" href="https:\/\/www\.instagram\.com/);
  assert.match(html, /class="redemption-cta" href="https:\/\/www\.instagram\.com/);
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
  for (const variable of ["redemption-prize-max-width", "redemption-prize-card-width", "redemption-prize-padding", "redemption-title-width", "redemption-title-height", "redemption-prize-image-height", "redemption-base-width", "redemption-base-height", "redemption-action-gap", "redemption-extras-max-width", "redemption-cta-height", "redemption-cta-radius"]) {
    assert.match(css, new RegExp(`var\\(--${variable}\\)`), `Unused redemption tuning variable --${variable}`);
  }
  assert.match(css, /\.runner-tags\s*\{[^}]*flex-wrap:\s*wrap/s);
  assert.match(css, /\.result-identity\s*\{[^}]*width:\s*var\(--result-identity-width\)/s);
  assert.match(css, /\.v2-result-heading\s*\{[^}]*margin-top:\s*calc\(0px - var\(--result-heading-frame-overlap\)\)/s);
  assert.match(css, /\.v2-result-heading\s*\{[^}]*margin-bottom:\s*calc\(0px - var\(--result-heading-image-pull\)\)/s);
  assert.match(css, /\.hydration-recommendation-row\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*34%\)/s);
  assert.match(css, /\.v2-recommendation\.is-pioneer \.hydration-recommendation-row\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(css, /\.runner-visual\s*\{[^}]*aspect-ratio:\s*var\(--result-visual-ratio\)/s);
  assert.match(css, /\.runner-visual-image\s*\{[^}]*max-width:\s*100%;[^}]*max-height:\s*100%;[^}]*object-fit:\s*contain/s);
  assert.match(css, /--share-card-aspect-ratio:\s*9\s*\/\s*16/);
  assert.match(css, /\.result-download-preview\s*\{[^}]*aspect-ratio:\s*var\(--share-card-aspect-ratio\)/s);
  assert.match(html, /data-share-canvas width="1080" height="1920"/);
  assert.match(readFileSync(new URL("../js/shareCard.js", import.meta.url), "utf8"), /CARD_WIDTH = 1080;[\s\S]*CARD_HEIGHT = 1920;/);
  assert.match(css, /\.result-hero-frame\s*\{[^}]*border:\s*2px solid/s);
  assert.match(css, /\.runner-tag\s*\{[^}]*background:\s*var\(--brand-green\)/s);
});
