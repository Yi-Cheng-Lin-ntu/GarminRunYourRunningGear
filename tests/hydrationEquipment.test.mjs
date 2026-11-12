import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { getHydrationEquipment } from "../js/hydrationEquipment.js";
import { parseContent } from "../js/contentData.js";

const projectRoot = new URL("../", import.meta.url);
const content = parseContent(readFileSync(new URL("../content.csv", import.meta.url), "utf8"));

test("the homepage uses its hero artwork and localized campaign line", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");

  assert.match(html, /src="\.\/assets\/首頁圖片\.png"/);
  assert.ok(existsSync(new URL("../assets/首頁圖片.png", import.meta.url)));
  assert.match(html, /data-i18n="v2\.startManifestoRun"/);
  assert.ok(content.ui["v2.startManifestoRun"]?.zh && content.ui["v2.startManifestoRun"]?.en);
  assert.match(html, /class="site-footer-tagline" data-i18n="v2\.startFooter"/);
  assert.equal(content.ui["v2.startFooter"]?.zh, "Ready, Set, Change");
  assert.match(css, /\.start-visual img\s*\{[^}]*object-fit:\s*contain/s);
  assert.match(css, /\.start-visual\s*\{[^}]*width:\s*100%;[^}]*margin:\s*0 auto/s);
  assert.match(css, /\.screen\.screen-start:not\(\[hidden\]\)\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);[^}]*padding:\s*24px var\(--screen-inline-padding\)/s);
  assert.match(css, /\.start-manifesto\s*\{[^}]*width:\s*100%;[^}]*justify-self:\s*start;[^}]*text-align:\s*left/s);
  assert.match(html, /class="button button-primary button-wide"[^>]*data-action="start"/);
  assert.match(html, /class="button button-primary button-wide"[^>]*data-action="next"/);
  assert.match(css, /\.button\s*\{[^}]*min-height:\s*52px;[^}]*font-size:\s*var\(--font-body\)/s);
  assert.match(css, /\.screen-start > \[data-action="start"\]\s*\{\s*align-self:\s*center;/s);
  assert.match(css, /\.start-manifesto span:last-child\s*\{[^}]*color:\s*var\(--brand-green\)/s);
  assert.match(css, /\.start-manifesto span:last-child\s*\{[^}]*font-size:\s*var\(--font-display\)/s);
});

test("all screens share one header and footer with the homepage layout", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");
  const app = readFileSync(new URL("../js/appV2.js", import.meta.url), "utf8");

  assert.equal([...html.matchAll(/<header class="site-header">/g)].length, 1);
  assert.equal([...html.matchAll(/<footer class="site-footer">/g)].length, 1);
  assert.match(html, /<footer class="site-footer">\s*<span class="site-footer-tagline" data-i18n="v2\.startFooter"><\/span>\s*<\/footer>/);
  assert.match(html, /class="brand-prefix" data-i18n="brand\.headerPrefix"><\/span> <span data-i18n="brand\.headerRun"><\/span>/);
  assert.equal(content.ui["brand.home"]?.zh, "2026 Garmin Run 回到首頁");
  assert.equal(content.ui["brand.home"]?.en, "2026 Garmin Run home");
  assert.equal(content.ui["brand.headerPrefix"]?.zh, "2026 Garmin");
  assert.equal(content.ui["brand.headerRun"]?.zh, "Run");
  assert.match(css, /\.site-header\s*\{[^}]*border-bottom:\s*1px solid var\(--border-strong\)/s);
  assert.match(css, /--screen-inline-padding:\s*24px;/);
  assert.match(css, /\.site-header\s*\{[^}]*width:\s*min\(100% - 2 \* var\(--gutter\) - 2 \* var\(--screen-inline-padding\), calc\(var\(--content-width\) - 2 \* var\(--screen-inline-padding\)\)\)/s);
  assert.match(css, /\.site-header\s*\{[^}]*grid-template-columns:\s*max-content minmax\(0,\s*1fr\)/s);
  assert.match(css, /\.header-actions\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(css, /\.mock-mode-badge\s*\{[^}]*width:\s*100%;/s);
  assert.match(css, /\.mock-tools-button\s*\{[^}]*width:\s*100%;/s);
  assert.match(css, /\.language-toggle\s*\{[^}]*width:\s*100%;/s);
  assert.match(css, /\.site-footer\s*\{[^}]*border-top:\s*1px solid var\(--border-strong\);[^}]*text-align:\s*center/s);
  assert.match(css, /\.screen:not\(\.screen-redemption\)\s*\{[^}]*padding:\s*var\(--screen-inline-padding\)/s);
  assert.match(css, /\.screen-redemption\s*\{[^}]*padding-inline:\s*calc\(var\(--gutter\) \+ var\(--screen-inline-padding\)\)/s);
  assert.doesNotMatch(css, /--page-content-inset/);
  assert.match(css, /body\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column/s);
  assert.match(css, /\.app-shell\s*\{[^}]*display:\s*flex;[^}]*flex:\s*1;[^}]*flex-direction:\s*column/s);
  assert.doesNotMatch(css, /body:has\(#start\.is-active\)\s+\.(?:site-header|site-footer)/);
  assert.doesNotMatch(app, /createElement\(["'](?:header|footer)["']\)|(?:insertAdjacentHTML|innerHTML)[\s\S]{0,100}(?:site-header|site-footer)/);
});

test("the main stylesheet uses brand and semantic color tokens without color aliases", () => {
  const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");
  const shareCard = readFileSync(new URL("../js/shareCard.js", import.meta.url), "utf8");
  const brandColors = {
    black: "#080b0d",
    surface: "#11171a",
    white: "#f7faf8",
    muted: "#8e9ba0",
    blue: "#7bccff",
    "blue-mid": "#a9def2",
    green: "#00ff19"
  };
  const semanticColors = {
    "bg-primary": "var(--brand-black)",
    "bg-surface": "var(--brand-surface)",
    "text-primary": "var(--brand-white)",
    "text-secondary": "var(--brand-muted)",
    "text-highlight": "var(--brand-blue)",
    "action-primary": "var(--brand-green)",
    "action-primary-text": "var(--brand-black)",
    "action-secondary": "var(--brand-blue)",
    "state-selected": "var(--brand-green)",
    "state-complete": "var(--brand-green)",
    "theme-general": "var(--brand-blue)",
    "theme-sustainability": "var(--brand-green)"
  };

  for (const [name, hex] of Object.entries(brandColors)) {
    assert.match(css, new RegExp(`--brand-${name}: ${hex};`));
  }
  for (const [name, value] of Object.entries(semanticColors)) {
    assert.match(css, new RegExp(`--${name}: ${value.replace(/[()]/g, "\\$&")};`));
  }
  assert.doesNotMatch(css, /--color-[\w-]+|var\(--color-[\w-]+\)/);
  assert.match(css, /--border-default:\s*rgba\(247,250,248,\.22\)/);
  assert.match(css, /--border-strong:\s*rgba\(247,250,248,\.50\)/);
  assert.match(css, /--error-border:\s*#ffb3b3/);
  assert.match(css, /--error-text:\s*#ffdede/);
  assert.match(css, /--error-bg:\s*rgba\(255,100,100,\.10\)/);
  assert.match(shareCard, /domToImage\.toBlob\(stage/);
  assert.match(css, /\.result-share-card\s*\{/);
});

test("the six-level typography system drives all page text and stays responsive", () => {
  const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");
  const shareCard = readFileSync(new URL("../js/shareCard.js", import.meta.url), "utf8");
  const mobileValues = {
    display: "32px",
    h1: "28px",
    h2: "22px",
    h3: "18px",
    body: "16px",
    small: "13px"
  };
  const desktopValues = {
    display: "40px",
    h1: "32px",
    h2: "24px",
    h3: "20px"
  };

  for (const [level, value] of Object.entries(mobileValues)) {
    assert.match(css, new RegExp(`--font-${level}: ${value};`));
  }
  for (const [level, value] of Object.entries(desktopValues)) {
    assert.match(css, new RegExp(`--font-${level}: ${value};`));
  }
  assert.match(css, /@media \(min-width: 720px\)\s*\{\s*:root\s*\{[\s\S]*?--font-display: 40px/);
  assert.match(css, /body\s*\{[^}]*font-size:\s*var\(--font-body\)/s);
  assert.match(css, /--weight-body:\s*400;/);
  assert.match(css, /--weight-emphasis:\s*700;/);
  assert.match(css, /--weight-display:\s*900;/);
  assert.doesNotMatch(css, /--weight-small\b|font-weight:\s*500\b/);
  assert.match(css, /\.question-intro h2\s*\{[^}]*font-size:\s*var\(--font-h2\)/s);
  assert.match(css, /\.v2-result-heading h2\s*\{[^}]*font-size:\s*var\(--font-display\)/s);
  assert.match(css, /\.participation-header h2\s*\{[^}]*font-size:\s*var\(--font-h1\)/s);
  assert.match(css, /\.redemption-prize-title\s*\{[^}]*font-size:\s*var\(--font-h1\)/s);
  assert.doesNotMatch(css, /--type-(?:display|h1|h2|h3|body|label|caption)\b/);
  assert.doesNotMatch(css, /--(?:result-title-size|result-slogan-size|result-tag-font-size|recommendation-heading-size|recommendation-copy-size|hydration-choice-font-size|redemption-cta-font-size)\b/);
  const declaredFontSizes = [...css.matchAll(/font-size\s*:\s*([^;]+);/g)].map(([, size]) => size.trim());
  assert.ok(declaredFontSizes.length > 0);
  assert.ok(declaredFontSizes.every((size) => /^var\(--font-(?:display|h1|h2|h3|body|small)\)$/.test(size)));
  assert.doesNotMatch(shareCard, /fillText|drawImage|SHARE_CARD_TYPE/);
  assert.match(shareCard, /document\.fonts\?\.ready/);
});

test("redemption title color reflects sustainability eligibility", () => {
  const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");
  const redemptionView = readFileSync(new URL("../js/redemptionView.js", import.meta.url), "utf8");

  assert.match(css, /\.screen-redemption\.is-sustainable \.redemption-prize-title\s*\{[^}]*background:\s*var\(--theme-sustainability\)/s);
  assert.match(css, /\.screen-redemption\.is-non-sustainable \.redemption-prize-title\s*\{[^}]*background:\s*var\(--theme-general\)/s);
  assert.match(redemptionView, /classList\.toggle\("is-sustainable",\s*greenVersion\)/);
  assert.match(redemptionView, /classList\.toggle\("is-non-sustainable",\s*!greenVersion\)/);
});

test("redemption removes the green prize-image oval and left-aligns the instruction", () => {
  const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const redemptionView = readFileSync(new URL("../js/redemptionView.js", import.meta.url), "utf8");

  assert.doesNotMatch(css, /\.prize-image::before/);
  assert.match(css, /\.sustainability-message,\s*\.redemption-instruction\s*\{[^}]*display:\s*flex;[^}]*padding:\s*10px 12px;/s);
  assert.match(css, /\.sustainability-message\s*\{[^}]*--redemption-indicator-color:\s*var\(--brand-green\)/s);
  assert.match(css, /\.redemption-instruction\s*\{[^}]*--redemption-indicator-color:\s*var\(--brand-blue\)/s);
  assert.match(css, /\.sustainability-message::before,\s*\.redemption-instruction::before\s*\{[^}]*background:\s*var\(--redemption-indicator-color\)/s);
  assert.match(css, /\.sustainability-message\s*\{[^}]*white-space:\s*pre-line/s);
  assert.match(redemptionView, /\.replace\(\/\\s\*\[｜\|\]\\s\*\/,\s*"\\n"\)/);
  assert.match(html, /class="redemption-instruction"[^]*?class="sustainability-message"[^]*?class="redemption-extras"/);
});

test("downloaded result follows the result layout and the Instagram card contains only its image", () => {
  const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const shareCard = readFileSync(new URL("../js/shareCard.js", import.meta.url), "utf8");
  const app = readFileSync(new URL("../js/appV2.js", import.meta.url), "utf8");

  assert.equal(content.ui["v2.shareCardHeaderSuffix"]?.zh, "跑者風格測驗");
  assert.equal(content.ui["v2.shareCardHeaderSuffix"]?.en, "Runner Style Quiz");
  assert.match(css, /--share-card-aspect-ratio:\s*9\s*\/\s*16;/);
  assert.match(css, /--redemption-preview-aspect-ratio:\s*var\(--share-card-aspect-ratio\)/);
  assert.match(app, /headerPrefix: copy\("brand\.headerPrefix"\)/);
  assert.match(app, /headerRun: copy\("brand\.headerRun"\)/);
  assert.match(app, /headerSuffix: copy\("v2\.shareCardHeaderSuffix"\)/);
  assert.match(app, /footer: copy\("v2\.startFooter"\)/);
  assert.match(shareCard, /card\.cloneNode\(true\)/);
  assert.match(shareCard, /CARD_WIDTH = 1080/);
  assert.match(shareCard, /CARD_HEIGHT = 1920/);
  assert.match(shareCard, /domToImage\.toBlob\(stage/);
  assert.match(html, /<article class="result-share-card" data-result-card>/);
  assert.match(html, /<article class="result-share-card" data-share-root>/);
  assert.match(html, /js\/vendor\/html-to-image\.js/);
  assert.doesNotMatch(html, /ig-placeholder-copy|更多永續故事|查看 Instagram 貼文/i);
  assert.doesNotMatch(css, /\.ig-placeholder-copy/);
});

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
  assert.match(app, /tag\.textContent = value \? `# \$\{value\}` : "";/);
  assert.match(app, /tag\.hidden = !value;/);
  assert.equal(html.match(/data-result-tag="/g)?.length, 4);
  for (const [runnerType, result] of Object.entries(content.resultData)) {
    const tagCount = result.tags.filter((tag) => tag?.zh || tag?.en).length;
    assert.ok(tagCount >= 2 && tagCount <= 4, `${runnerType} should have between 2 and 4 configured tags`);
  }
  assert.match(html, /<section class="v2-recommendation"[\s\S]*?data-hydration-equipment/);
  assert.match(html, /class="runner-visual" data-runner-visual/);
  assert.match(html, /class="result-hero-frame"/);
  assert.match(html, /data-runner-image[^>]*hidden/);
  assert.match(html, /data-sustainability-result-mark/);
  assert.match(html, /class="runner-tags"[\s\S]*data-result-tag/);
  assert.match(html, /data-share-stage/);
  assert.match(html, /data-share-preview/);
  assert.match(html, /data-ig-placeholder/);
  assert.match(css, /\.hydration-equipment-image\s*\{[^}]*object-fit:\s*contain/s);
  assert.match(css, /\.runner-visual-image\s*\{[^}]*object-fit:\s*contain/s);
  assert.match(css, /\.screen-redemption\s*\{[^}]*background:\s*rgba\(8,11,13,\.4\);[^}]*color:\s*var\(--brand-white\)/s);
  assert.match(css, /\.prize-card\s*\{[^}]*border:\s*1px solid rgba\(247,250,248,\.82\)/s);
  assert.match(html, /class="redemption-action-card result-download-card"[^>]*aria-labelledby="share-save-label"[^>]*data-action="download-result"/);
  assert.doesNotMatch(html, /class="result-download-copy"/);
  assert.match(html, /class="redemption-cta" id="share-save-label"[^>]*data-action="download-result"/);
  assert.match(html, /class="redemption-action-card ig-placeholder-card"[^>]*aria-labelledby="ig-story-label"[^>]*href="https:\/\/www\.instagram\.com/);
  assert.match(html, /class="redemption-cta" id="ig-story-label" href="https:\/\/www\.instagram\.com/);
  assert.match(css, /\.prize-card\s*\{[^}]*width:\s*min\(100%,\s*var\(--redemption-extras-max-width\)\)/s);
  assert.match(css, /\.redemption-instruction\s*\{[^}]*--redemption-indicator-color:\s*var\(--brand-blue\)/s);
  assert.match(css, /\.redemption-cta\s*\{[^}]*border-radius:\s*var\(--redemption-cta-radius\)/s);
  assert.match(css, /--redemption-cta-radius:\s*var\(--radius-control\)/);
  assert.match(css, /\.result-download-card\s*\{[^}]*padding:\s*0/s);
  assert.match(css, /\.ig-placeholder-card\s*\{[^}]*padding:\s*0/s);
  const tuningVariables = [
    "result-title-slogan-gap", "result-heading-height", "result-visual-ratio",
    "result-section-gap", "result-tags-gap", "result-tag-padding",
    "recommendation-padding",
    "hydration-image-size", "hydration-content-gap",
    "hydration-choice-gap", "hydration-choice-height",
    "result-continue-margin-top", "result-continue-margin-bottom"
  ];
  for (const variable of tuningVariables) {
    assert.match(css, new RegExp(`var\\(--${variable}\\)`), `Unused tuning variable --${variable}`);
  }
  for (const variable of ["redemption-prize-max-width", "redemption-prize-padding", "redemption-title-width", "redemption-title-height", "redemption-prize-image-height", "redemption-action-gap", "redemption-extras-max-width", "redemption-cta-height", "redemption-cta-radius", "redemption-preview-aspect-ratio"]) {
    assert.match(css, new RegExp(`var\\(--${variable}\\)`), `Unused redemption tuning variable --${variable}`);
  }
  assert.match(css, /\.runner-tags\s*\{[^}]*flex-wrap:\s*nowrap;[^}]*width:\s*100%/s);
  assert.match(css, /\.runner-tag\s*\{[^}]*flex:\s*1 1 0;[^}]*font-size:\s*var\(--font-h3\)/s);
  assert.match(css, /\.result-identity\s*\{[^}]*width:\s*var\(--result-identity-width\)/s);
  assert.match(css, /\.v2-result-heading\s*\{[^}]*height:\s*var\(--result-heading-height\)/s);
  assert.match(css, /--result-heading-height:\s*144px;/);
  assert.match(css, /--result-heading-height:\s*128px;/);
  assert.match(css, /\.v2-result-heading\s*\{[^}]*margin-top:\s*calc\(0px - var\(--result-heading-frame-overlap\) - 2px\)/s);
  assert.match(css, /\.v2-result-heading\s*\{[^}]*margin-bottom:\s*calc\(0px - var\(--result-heading-image-pull\)\)/s);
  assert.match(css, /\.result-hero-frame\s*\{[^}]*margin-top:\s*var\(--result-heading-frame-overlap\);[^}]*padding:\s*0 var\(--result-frame-inline-padding\) var\(--result-frame-bottom-padding\);[^}]*border:\s*2px solid rgba\(247,250,248,\.88\);[^}]*border-radius:\s*10px/s);
  assert.doesNotMatch(css, /\.result-hero-frame::(?:before|after)/);
  assert.match(css, /--result-frame-inline-padding:\s*10px;/);
  assert.match(css, /--result-frame-bottom-padding:\s*10px;/);
  assert.match(css, /\.hydration-recommendation-row\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*34%\)/s);
  assert.match(css, /\.v2-recommendation\.is-pioneer \.hydration-recommendation-row\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.doesNotMatch(css.match(/\.v2-recommendation\.is-pioneer \.hydration-recommendation-row\s*\{[^}]*\}/s)?.[0] ?? "", /padding-right/);
  assert.match(css, /\.hydration-copy\s*\{[^}]*width:\s*100%/s);
  assert.match(css, /\.runner-visual\s*\{[^}]*aspect-ratio:\s*var\(--result-visual-ratio\)/s);
  assert.match(css, /\.runner-visual-image\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*object-fit:\s*contain/s);
  assert.match(css, /--share-card-aspect-ratio:\s*9\s*\/\s*16/);
  assert.match(css, /\.result-download-preview\s*\{[^}]*aspect-ratio:\s*var\(--redemption-preview-aspect-ratio\)/s);
  assert.match(css, /\.ig-placeholder-thumbnail\s*\{[^}]*aspect-ratio:\s*var\(--redemption-preview-aspect-ratio\)/s);
  assert.match(html, /data-share-stage/);
  assert.doesNotMatch(html, /data-share-canvas|<canvas/);
  assert.match(readFileSync(new URL("../js/shareCard.js", import.meta.url), "utf8"), /CARD_WIDTH = 1080;[\s\S]*CARD_HEIGHT = 1920;/);
  assert.match(css, /\.result-hero-frame\s*\{[^}]*border:\s*2px solid/s);
  assert.match(css, /\.runner-tag\s*\{[^}]*background:\s*var\(--brand-green\)/s);
});
