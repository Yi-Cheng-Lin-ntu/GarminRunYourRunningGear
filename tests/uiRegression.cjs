// Optional browser regression. Setup: UI_REVIEW.md. External requests are blocked.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs");
const assert = require("node:assert/strict");

async function run() {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    headless: true,
    args: ["--no-sandbox"]
  });
  const output = process.env.UI_OUTPUT_DIR || "/tmp/garmin-ui-results";
  const baseline = process.env.BASELINE_CSS;
  const reports = [];
  fs.mkdirSync(output, { recursive: true });

  try {
    for (const before of (baseline ? [true, false] : [false])) {
      for (const width of (before ? [390, 1280] : [375, 390, 430, 768, 1280])) {
        const context = await browser.newContext({
          viewport: { width, height: 844 }, reducedMotion: "reduce"
        });
        await context.route("**/*", (route) =>
          new URL(route.request().url()).hostname === "127.0.0.1"
            ? route.continue() : route.abort()
        );
        if (before) {
          await context.route("**/style.css", (route) => route.fulfill({
            contentType: "text/css", body: fs.readFileSync(baseline, "utf8")
          }));
        }
        // Reproducible product selection; UUID generation remains unchanged.
        await context.addInitScript(() => { Math.random = () => .42; });
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        const click = (selector) => page.locator(selector).click();
        const choose = (value) => page.locator(".choice-card").filter({
          has: page.locator(`[value=${value}]`)
        }).click();
        const ready = () => page.waitForFunction(() =>
          !document.querySelector("[data-action=start]").disabled
        );
        const check = async (name) => {
          await page.waitForTimeout(80);
          if (!before) {
            assert.equal(await page.evaluate(() =>
              document.documentElement.scrollWidth > innerWidth
            ), false, `${width} ${name}: horizontal overflow`);
          }
          if ([390, 1280].includes(width) &&
              ["landing", "result", "general", "green"].includes(name)) {
            await page.screenshot({
              path: `${output}/${before ? "before" : "after"}-${width}-${name}.png`,
              fullPage: true
            });
          }
        };
        const keyboardSelection = async () => {
          await page.locator(".option-card input").first().focus();
          await page.keyboard.press("Space");
          assert.equal(await page.evaluate(() =>
            document.activeElement.matches(".option-card input")
          ), true);
          assert.equal(await page.locator(".option-card:has(input:focus-visible)").count(), 1);
        };
        const quiz = async (type = "experience", existing = false) => {
          await click("[data-action=start]");
          if (!before) await keyboardSelection();
          for (let i = 1; i <= 5; i++) {
            const option = existing && i === 2 ? "sustainability" : type;
            await click(`label[for="q${i}_${option}"]`);
            await click("[data-action=next]");
          }
          await page.locator("#result").waitFor({ state: "visible" });
          const title = { experience: "賽道體驗派", lifestyle: "自在生活派", performance: "精準急速派" };
          assert.match(await page.locator("[data-result-title]").innerText(), new RegExp(title[type]));
        };
        const submit = async () => {
          await click("[data-submit]");
          await page.locator("#redemption").waitFor({ state: "visible" });
        };
        const theme = () => page.locator("#redemption").evaluate((element) =>
          getComputedStyle(element).backgroundColor
        );

        await page.goto("http://127.0.0.1:8011/");
        await ready();
        await check("landing");
        await quiz();
        await check("result");
        await click("[data-action=continue]");
        await check("participation");
        await choose("joined");
        assert.equal(await page.locator("[value=joined]").isChecked(), true);
        await choose("considering");
        assert.equal(await page.locator("[value=considering]").isChecked(), true);
        await page.check("[data-raffle-toggle]");
        await page.locator("[data-name]").fill("UI Demo");
        await page.locator("[data-email]").fill("ui-test@example.com");
        await check("form-expanded");
        await page.uncheck("[data-raffle-toggle]");
        assert.equal(await page.locator("[data-name]").inputValue(), "");
        await submit();
        await check("general");
        if (!before) {
          assert.equal(await theme(), "rgb(214, 242, 255)");
          await click("[data-action=toggle-language]");
          assert.match(await page.locator("[data-redemption-runner]").innerText(), /Runner type/);
          await check("english-prize");
          await click("[data-action=toggle-language]");
        }
        await click("[data-action=restart]");
        await quiz("lifestyle");
        await click("[data-action=continue]");
        await choose("joined");
        await submit();
        await check("green");
        assert.equal(await page.locator("[data-sustainability-message]").isVisible(), true);

        if (!before) {
          assert.equal(await theme(), "rgb(0, 255, 25)");
          await page.reload();
          await ready();
          assert.equal(await page.locator("#start").isVisible(), true);
          await quiz("performance", true);
          await click("[data-action=continue]");
          assert.equal(await page.locator("[data-hydration-options]").isVisible(), false);
          await submit();
          assert.match(await page.locator("[data-prize-name]").innerText(), /購物袋/);
          await check("existing");
          await click("[data-action=restart]");
          await click("[data-action=toggle-language]");
          await check("english-landing");
          await click("[data-action=start]");
          await keyboardSelection();
          for (let i = 1; i <= 5; i++) {
            await click(`label[for=q${i}_performance]`);
            await check(`english-question-${i}`);
            await click("[data-action=next]");
          }
          await check("english-result");
          await click("[data-action=continue]");
          await page.check("[data-raffle-toggle]");
          await check("english-form");
          if (width === 390) {
            const images = await page.evaluate(async () => {
              const { prizeCatalog } = await import("./js/apiClient.js");
              return Promise.all(Object.values(prizeCatalog).map(async (prize) => {
                const image = new Image();
                image.src = prize.imagePath;
                await image.decode();
                return image.naturalWidth > 0;
              }));
            });
            assert.equal(images.length, 5);
            assert.ok(images.every(Boolean));
          }
          await page.addStyleTag({ content: "html {font-size:200%}" });
          await check("text-200-percent");
          await page.addStyleTag({ content: "html {font-size:100%}" });
          await click("[data-action=mock-tools]");
          await check("mock-tools");
          await click("[data-action=close-mock-tools]");
          if (width === 390) {
            await click("[data-action=home]");
            await click("[data-action=toggle-language]");
            await page.evaluate(async () => {
              const api = await import("./js/apiClient.js");
              api.applyMockScenario("all_empty");
            });
            await quiz();
            await click("[data-action=continue]");
            await choose("considering");
            await submit();
            assert.equal(await page.locator("[data-prize-image]").isVisible(), false);
            assert.match(await page.locator("[data-prize-name]").innerText(), /贈送完畢/);
            await check("paused");
          }
          assert.deepEqual(errors, []);
          const colors = await page.evaluate(() => {
            const styles = getComputedStyle(document.documentElement);
            return ["--brand-black", "--brand-surface", "--brand-muted", "--brand-white",
              "--brand-blue", "--brand-green"].map((key) => styles.getPropertyValue(key).trim());
          });
          reports.push({ width, errors, colors, passed: true });
        }
        await context.close();
      }
    }
    fs.writeFileSync(`${output}/results.json`, JSON.stringify(reports, null, 2));
    console.log(JSON.stringify(reports));
  } finally {
    await browser.close();
  }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
