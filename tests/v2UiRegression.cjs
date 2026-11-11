// Main V2 browser verification. All non-local requests are blocked or mocked.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const base = process.env.UI_BASE_URL || "http://127.0.0.1:8020";
const output = process.env.UI_OUTPUT_DIR || "/tmp/garmin-v2-results";
const types = ["experience", "lifestyle", "performance"];
const styles = ["precision", "rest", "pioneer"];
const titles = { experience: "賽事收藏家", lifestyle: "自在巡航員", performance: "配速計算機" };

async function main() {
  const server = process.env.UI_SERVE === "1" ? await require("./helpers/staticServer.cjs").startStaticServer(base) : null;
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true, args: ["--no-sandbox"] });
  fs.mkdirSync(output, { recursive: true });
  const reports = [];
  try {
    for (const width of [375, 390, 430, 768, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: "reduce" });
      await context.route("**/*", (route) => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
      page.on("response", (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()}`); });
      const click = (selector) => page.locator(selector).click();
      const check = async (name) => {
        await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width} ${name} overflow`);
        await page.screenshot({ path: `${output}/${width}-${name}.png`, fullPage: true });
      };
      const assertPresentation = async () => {
        const layout = await page.evaluate(() => {
          const rect = (selector) => { const r = document.querySelector(selector).getBoundingClientRect(); return { top: r.top, left: r.left, width: r.width, height: r.height }; };
          return {
            background: getComputedStyle(document.body).backgroundColor,
            screenBackground: getComputedStyle(document.querySelector("#result")).backgroundColor,
            visual: rect("[data-runner-visual]"),
            tags: rect("[data-runner-tags]"),
            equipment: rect("[data-hydration-equipment]"),
            copy: rect(".hydration-copy")
          };
        });
        assert.equal(layout.background, "rgb(8, 11, 13)");
        assert.equal(layout.screenBackground, "rgba(0, 0, 0, 0)");
        assert.ok(layout.visual.height > 0, "replaceable runner visual area should remain available");
        assert.ok(layout.tags.top >= layout.visual.top + layout.visual.height, "tags should be below the runner visual");
        assert.ok(layout.copy.width > 0, "recommendation text should remain visible");
        const runnerImage = page.locator("[data-runner-image]");
        assert.equal(await runnerImage.count(), 1);
        assert.ok(await runnerImage.evaluate((image) => image.complete && image.naturalWidth > 0), "runner result image should load");
        if (await page.locator("[data-hydration-equipment]").isVisible()) {
          assert.ok(layout.equipment.left < layout.copy.left, "hydration images should be left of recommendation text");
        }
        if (await page.locator("[data-hydration-options]").isVisible()) {
          const cards = await page.locator(".hydration-choices .choice-card").evaluateAll((elements) => elements.map((e) => {
            const r = e.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, width: r.width, height: r.height };
          }));
          assert.equal(cards.length, 2);
          assert.ok(Math.abs(cards[0].top - cards[1].top) < 1, "choices must stay side by side");
          assert.ok(cards[0].right <= cards[1].left);
          assert.ok(Math.abs(cards[0].height - cards[1].height) < 1);
          assert.ok(Math.abs(cards[0].width - cards[1].width) < 1);
        }
      };
      const solve = async (type, style) => {
        await click("[data-action=start]");
        for (let i = 1; i <= 5; i++) {
          assert.equal(await page.locator(".option-card").count(), 3);
          const key = i === 4 ? style : type;
          await click(`label[for="q${i}_${key}"]`);
          if (i === 1 && type === "experience") await check("quiz");
          await click("[data-action=next]");
        }
        assert.equal(await page.locator("[data-result-title]").innerText(), titles[type]);
        assert.equal(await page.locator("[data-result-tag]").count(), 4);
        assert.equal(await page.locator("[data-result-tag][hidden]").count(),
          await page.locator('[data-result-tag][aria-hidden="true"]').count());
        assert.ok(await page.locator("[data-result-tag]:not([hidden])").count() > 0);
        await assertPresentation();
        await check(`result-${type}-${style}`);
      };
      await page.goto(`${base}/`);
      await page.waitForFunction(() => !document.querySelector("[data-action=start]").disabled);
      await check("landing");
      for (const [i, type] of types.entries()) {
        const style = styles[i];
        await solve(type, style);
        const slogan = await page.locator("[data-result-slogan]").innerText();
        const tags = await page.locator("[data-result-tag]").allTextContents();
        await click("[data-action=toggle-language]");
        await assertPresentation();
        await check(`english-result-${type}`);
        await click("[data-action=toggle-language]");
        assert.equal(await page.locator("[data-result-slogan]").innerText(), slogan);
        assert.deepEqual(await page.locator("[data-result-tag]").allTextContents(), tags);
        if (style !== "pioneer") {
          await click("[data-action=continue]");
          assert.equal(await page.locator("#result").isVisible(), true);
          assert.equal(await page.locator("[data-result-error]").isVisible(), true);
          await page.locator(".choice-card").filter({ has: page.locator("[value=joined]") }).click();
          await page.locator(".choice-card").filter({ has: page.locator("[value=considering]") }).click();
          if (i === 1) await page.locator(".choice-card").filter({ has: page.locator("[value=joined]") }).click();
        } else {
          assert.equal(await page.locator("[data-hydration-options]").isVisible(), false);
        }
        await click("[data-action=continue]");
        assert.equal(await page.locator("#participation").isVisible(), true);
        assert.equal(await page.locator("[data-raffle-toggle]").count(), 0);
        await check("contact");
        await click("[data-submit]");
        assert.match(await page.locator("[data-form-error]").innerText(), /姓名/);
        await page.locator("[data-name]").fill("V2 Demo");
        await click("[data-submit]");
        assert.match(await page.locator("[data-form-error]").innerText(), /Email/);
        await page.locator("[data-email]").fill("v2@example.com");
        await click("[data-submit]");
        assert.match(await page.locator("[data-form-error]").innerText(), /告知/);
        await click("[data-action=toggle-language]");
        // Screenshot before contact values, keeping artifacts free of even fictional contacts.
        await page.locator("[data-name]").fill(""); await page.locator("[data-email]").fill("");
        await check("english-contact");
        await click("[data-action=toggle-language]");
        await page.locator("[data-name]").fill("V2 Demo");
        await page.locator("[data-email]").fill("v2@example.com");
        await page.check("[data-privacy-check]");
        await click("[data-submit]");
        await page.locator("#redemption").waitFor({ state: "visible" });
        const theme = await page.locator("#redemption").evaluate((e) => getComputedStyle(e).backgroundColor);
        assert.equal(theme, i === 0 ? "rgb(214, 242, 255)" : "rgb(0, 255, 25)");
        if (style === "pioneer") assert.match(await page.locator("[data-prize-name]").innerText(), /購物袋/);
        await check(`redemption-${type}`);
        await click("[data-action=restart]");
        assert.equal(await page.locator("#start").isVisible(), true);
        assert.equal(await page.locator("[data-name]").inputValue(), "");
        assert.equal(await page.locator("[data-email]").inputValue(), "");
      }
      // At 390px, render all remaining result combinations as additional evidence.
      if (width === 390) {
        for (const [i, type] of types.entries()) for (const style of styles.filter((s) => s !== styles[i])) {
          await solve(type, style); await click("[data-action=retry]");
        }
        await page.evaluate(async () => { const api = await import("./js/apiClient.js"); api.applyMockScenario("all_empty"); });
        await solve("experience", "rest");
        await page.locator(".choice-card").filter({ has: page.locator("[value=joined]") }).click();
        await click("[data-action=continue]");
        await page.locator("[data-name]").fill("V2 Demo"); await page.locator("[data-email]").fill("v2@example.com"); await page.check("[data-privacy-check]");
        await click("[data-submit]"); await page.locator("#redemption").waitFor({ state: "visible" });
        assert.equal(await page.locator("[data-prize-image]").isVisible(), false);
        await check("paused");
      }
      await page.reload();
      await page.waitForFunction(() => !document.querySelector("[data-action=start]").disabled);
      assert.equal(await page.locator("#start").isVisible(), true);
      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("garminRunMockParticipants")));
      assert.ok(stored.every((p) => p.quizVersion === 2 && p.raffleOptIn === true && p.q4Answer === `q4_${p.hydrationStyle}`));
      assert.deepEqual(errors, []);
      reports.push({ width, passed: true, errors: 0 });
      console.log(`PASS V2 Mock ${width}`);
      await context.close();
    }
    // Verify Pages project prefix and V2 capability gate without live Demo requests.
    for (const version of [1, 2]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const posts = [];
      await context.route("**/*", (route) => {
        const request = route.request(), url = new URL(request.url());
        if (url.origin === base) return route.continue();
        if (url.hostname === "script.google.com") {
          if (request.method() === "GET") return route.fulfill({ headers: { "Access-Control-Allow-Origin": "*" }, json: { ok: true, quizVersion: version } });
          const payload = request.postDataJSON(); posts.push(payload);
          return route.fulfill({ headers: { "Access-Control-Allow-Origin": "*" }, json: { ok: true, participantId: "fixture", requestId: payload.requestId, runnerType: payload.runnerType, allocationStatus: "allocated", sustainabilityRewardEligible: true, prize: { prizeId: "shopping_bag", nameZh: "Garmin 鏤空購物袋", nameEn: "Garmin Shopping Bag", imagePath: "./assets/prizes/Garmin簍空購物袋.png" } } });
        }
        return route.abort();
      });
      const page = await context.newPage();
      await page.goto(`${base}/GarminRunYourRunningGear/?mode=apps-script-demo`);
      await page.locator("[data-action=start]").click();
      for (let i = 1; i <= 5; i++) {
        await page.locator(`label[for=q${i}_${i === 4 ? "pioneer" : "performance"}]`).click();
        await page.locator("[data-action=next]").click();
      }
      const runnerImage = page.locator("[data-runner-image]");
      assert.equal(await runnerImage.count(), 1);
      assert.ok(await runnerImage.evaluate((image) => image.complete && image.naturalWidth > 0), "runner result image should load");
      assert.ok(await page.locator("[data-runner-visual]").isVisible());
      await page.locator("[data-action=continue]").click();
      await page.locator("[data-name]").fill("Demo Runner"); await page.locator("[data-email]").fill("test@example.com"); await page.check("[data-privacy-check]");
      await page.locator("[data-submit]").click();
      if (version === 1) {
        await page.locator("[data-form-error]").waitFor({ state: "visible" });
        assert.match(await page.locator("[data-form-error]").innerText(), /V2/);
        assert.equal(posts.length, 0);
      } else {
        await page.locator("#redemption").waitFor({ state: "visible" });
        assert.equal(posts.length, 1);
        assert.equal(posts[0].quizVersion, 2); assert.equal(posts[0].raffleOptIn, true);
        assert.equal(posts[0].privacyConfirmed, true); assert.equal(posts[0].q4Answer, "q4_pioneer");
        assert.equal(posts[0].premiumPrizeEligible, true);
        await page.locator("[data-prize-image] img").evaluate((image) => image.decode());
      }
      reports.push({ demoFixtureVersion: version, projectPath: true, passed: true });
      console.log(`PASS V2 Demo fixture ${version}`);
      await context.close();
    }
    fs.writeFileSync(`${output}/results.json`, JSON.stringify(reports, null, 2));
  } finally { await browser.close(); if (server) await new Promise((resolve) => server.close(resolve)); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
