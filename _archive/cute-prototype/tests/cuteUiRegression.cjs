// HISTORICAL V1 browser scenario. Main-site V2 uses tests/v2UiRegression.cjs.
// Browser integration for both presentations. See CUTE_DESIGN_SYSTEM.md.
// All non-local traffic is blocked; Apps Script responses are fixtures, never live.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const base = process.env.UI_BASE_URL || "http://127.0.0.1:8012";
const output = process.env.UI_OUTPUT_DIR || "/tmp/garmin-cute-results";
const prefix = "/GarminRunYourRunningGear";
const names = {
  urban: { experience: "賽道體驗派", lifestyle: "自在生活派", performance: "精準急速派" },
  cute: { experience: "我就是來看看柴犬", lifestyle: "志在參加臘腸", performance: "突破PB飆速杜賓" }
};
const english = { experience: "Just Here to Vibe Shiba", lifestyle: "Happy to Be Here Dachshund", performance: "PB Chasing Doberman" };

async function main() {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    headless: true, args: ["--no-sandbox"]
  });
  fs.mkdirSync(output, { recursive: true });
  const results = [];
  const baselineImages = new Map();
  try {
    const cases = [];
    // Optional pixel comparison against the checkpoint app on the original UI.
    if (process.env.URBAN_BASELINE_APP) cases.push({ variant: "urban", width: 390, baseline: true });
    for (const variant of ["urban", "cute"]) {
      for (const width of [375, 390, 430, 1280]) cases.push({ variant, width });
      cases.push({ variant, width: 390, projectPath: true });
      cases.push({ variant, width: 390, projectPath: true, demo: true });
    }
    for (const item of cases) {
      const { variant, width, projectPath, demo, baseline } = item;
      const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: "reduce" });
      const errors = [], failures = [], submissions = [];
      await context.addInitScript(() => { Math.random = () => .42; });
      await context.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (url.origin === base) return route.continue();
        if (demo && url.hostname === "script.google.com" && route.request().method() === "POST") {
          const body = route.request().postDataJSON();
          submissions.push(body);
          return route.fulfill({ headers: { "Access-Control-Allow-Origin": "*" }, json: {
            ok: true, demoMode: true, participantId: "fixture-participant", requestId: body.requestId,
            runnerType: body.runnerType, allocationStatus: "allocated",
            sustainabilityRewardEligible: body.sustainabilityRewardEligible,
            prize: { prizeId: "cap", nameZh: "Garmin 漁夫帽", nameEn: "Garmin Cap", imagePath: "./assets/prizes/Garmin漁夫帽.png" }
          } });
        }
        failures.push(`blocked external request: ${url.hostname}`);
        return route.abort();
      });
      if (baseline) {
        await context.route("**/js/app.js", (route) => route.fulfill({
          contentType: "text/javascript", body: fs.readFileSync(process.env.URBAN_BASELINE_APP, "utf8")
        }));
      }
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
      page.on("response", (response) => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
      page.on("requestfailed", (request) => failures.push(request.url()));
      const routePath = `${projectPath ? prefix : ""}/${variant === "cute" ? "cute/" : ""}`;
      const url = `${base}${routePath}${demo ? "?mode=apps-script-demo" : ""}`;
      const waitReady = () => page.waitForFunction(() => !document.querySelector("[data-action=start]").disabled);
      const click = (selector) => page.locator(selector).click();
      const choose = (value) => page.locator(".choice-card").filter({ has: page.locator(`[value=${value}]`) }).click();
      const capture = async (name) => {
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all(Array.from(document.images).map((image) => image.decode().catch(() => {})));
        });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${variant} ${width} ${name} overflow`);
        if (variant === "cute" && !demo && !projectPath) {
          await page.screenshot({ path: `${output}/cute-${width}-${name}.png`, fullPage: true });
        }
        if (variant === "urban" && width === 390 && !demo && !projectPath && ["landing", "result-experience", "general"].includes(name)) {
          const image = await page.screenshot({ fullPage: true });
          if (baseline) baselineImages.set(name, image);
          else if (baselineImages.has(name)) assert.ok(image.equals(baselineImages.get(name)), `Urban pixel mismatch: ${name}`);
        }
      };
      const quiz = async (type, existing = false) => {
        await click("[data-action=start]");
        for (let i = 1; i <= 5; i++) {
          assert.equal(await page.locator("[data-question-number]").innerText(), String(i).padStart(2, "0"));
          await click(`label[for="q${i}_${existing && i === 2 ? "sustainability" : type}"]`);
          if (i === 1 && type === "experience") await capture("quiz");
          await click("[data-action=next]");
        }
        assert.match(await page.locator("[data-result-title]").innerText(), new RegExp(names[variant][type]));
        if (variant === "cute") {
          const expected = { experience: "shiba", lifestyle: "dachshund", performance: "doberman" };
          assert.match(await page.locator("[data-result-visual] img").getAttribute("src"), new RegExp(expected[type]));
          await click("[data-action=toggle-language]");
          assert.match(await page.locator("[data-result-title]").innerText(), new RegExp(english[type]));
          await click("[data-action=toggle-language]");
        }
        await capture(`result-${type}`);
      };
      const submit = async () => {
        await click("[data-submit]");
        await page.locator("#redemption").waitFor({ state: "visible" });
        const image = page.locator("[data-prize-image] img");
        await image.evaluate((element) => element.decode());
        if (projectPath) assert.ok((await image.getAttribute("src")).includes(`${prefix}/assets/prizes/`));
      };

      await page.goto(url);
      await waitReady();
      assert.equal(await page.locator(".mock-mode-badge").innerText(), demo ? "APPS SCRIPT DEMO" : "MOCK MODE");
      assert.equal(await page.locator(".mock-tools-button").count(), demo ? 0 : 1);
      if (variant === "urban") {
        assert.equal(await page.locator('link[href*="cute.css"]').count(), 0);
        assert.equal(await page.locator(".start-visual").count(), 1);
      } else {
        assert.equal(await page.locator(".hero-dog").count(), 3);
        assert.match(await page.locator(".site-footer").innerText(), /共用/);
        const originalLink = await page.locator("[data-urban-link]").getAttribute("href");
        assert.ok(demo ? originalLink.includes("?mode=apps-script-demo") : originalLink === "../");
      }
      await capture("landing");
      await quiz("experience");
      await click("[data-action=continue]");
      // Same optional raffle behavior; no personal data sent.
      await page.check("[data-raffle-toggle]");
      await capture("participation");
      await page.uncheck("[data-raffle-toggle]");
      await choose("joined");
      await choose("considering");
      await submit();
      await capture("general");
      assert.equal(await page.locator("#redemption").evaluate((el) => getComputedStyle(el).backgroundColor), (variant === "cute" ? "rgb(214, 242, 255)" : "rgb(123, 204, 255)"));
      await click("[data-action=toggle-language]");
      assert.match(await page.locator("[data-redemption-runner]").innerText(), variant === "cute" ? /Just Here to Vibe Shiba/ : /Course Experience/);
      await click("[data-action=toggle-language]");
      if (!demo) {
        await click("[data-action=restart]");
        await quiz("lifestyle");
        await click("[data-action=continue]");
        await choose("joined");
        await submit();
        assert.equal(await page.locator("#redemption").evaluate((el) => getComputedStyle(el).backgroundColor), "rgb(0, 255, 25)");
        assert.equal(await page.locator("[data-sustainability-message]").isVisible(), true);
        await capture("green");
        await click("[data-action=restart]");
        await quiz("performance", true);
        await click("[data-action=continue]");
        assert.equal(await page.locator("[data-hydration-options]").isVisible(), false);
        await submit();
        assert.match(await page.locator("[data-prize-name]").innerText(), /購物袋/);
        const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("garminRunMockParticipants")));
        assert.deepEqual(stored.map((p) => p.runnerType), ["experience", "lifestyle", "performance"]);
        assert.deepEqual(stored.map((p) => p.premiumPrizeEligible), [false, false, true]);
        assert.deepEqual(stored.map((p) => p.raffleOptIn), [false, false, false]);
      } else {
        assert.equal(submissions.length, 1);
        assert.equal(submissions[0].runnerType, "experience");
        assert.equal(submissions[0].demoMode, true);
        assert.equal(submissions[0].premiumPrizeEligible, false);
        assert.equal(submissions[0].name, undefined);
        assert.equal(submissions[0].email, undefined);
        assert.equal(submissions[0].uiVariant, undefined);
      }
      await page.reload();
      await waitReady();
      assert.equal(await page.locator("#start").isVisible(), true);
      await click("[data-action=start]");
      await click("[data-action=home]");
      assert.equal(await page.locator("#start").isVisible(), true);
      await page.waitForTimeout(100);
      assert.deepEqual(errors, []);
      assert.deepEqual(failures, []);
      results.push({ variant, width, projectPath: !!projectPath, demoFixture: !!demo, baseline: !!baseline, passed: true });
      console.log(`PASS ${variant} ${width} ${projectPath ? "project-path" : "root"} ${demo ? "Demo fixture" : "Mock"}${baseline ? " baseline" : ""}`);
      await context.close();
    }
    fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
