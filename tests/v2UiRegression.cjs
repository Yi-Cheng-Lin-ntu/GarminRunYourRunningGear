// Optional local-browser smoke test. All API-mode testing stays in Development Mock.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const base = process.env.UI_BASE_URL || "http://127.0.0.1:8020";

async function main() {
  const server = process.env.UI_SERVE === "1" ? await require("./helpers/staticServer.cjs").startStaticServer(base) : null;
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true, args: ["--no-sandbox"] });
  const types = ["experience", "lifestyle", "performance"];
  const styles = ["precision", "rest", "pioneer"];
  const titles = { experience: "賽事收藏家", lifestyle: "自在巡航員", performance: "配速計算機" };
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    await context.route("**/*", (route) => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("response", (response) => { if (response.status() >= 400) errors.push(`HTTP ${response.status()}`); });
    await page.goto(`${base}/`);
    await page.waitForFunction(() => !document.querySelector("[data-action=start]").disabled);
    await page.evaluate(async () => {
      const api = await import("./js/apiClient.js");
      api.resetMockTestData();
    });
    assert.equal(await page.locator("#participation").count(), 0);
    assert.equal(await page.locator("[data-name], [data-email], [data-privacy-check]").count(), 0);

    for (const type of types) for (const style of styles) {
      await page.locator("[data-action=start]").click();
      for (let question = 1; question <= 5; question += 1) {
        const answer = question === 4 ? style : type;
        await page.locator(`label[for="q${question}_${answer}"]`).click();
        await page.locator("[data-action=next]").click();
      }
      assert.equal(await page.locator("#result [data-result-title]").innerText(), titles[type]);
      assert.equal(await page.locator("#result [data-result-tag]").count(), 4);
      if (style === "pioneer") {
        assert.equal(await page.locator("[data-hydration-options]").isVisible(), false);
      } else {
        assert.equal(await page.locator("[data-hydration-options]").isVisible(), true);
        await page.locator(`label:has(input[value="${style === "precision" ? "considering" : "joined"}"])`).click();
      }
      await page.locator("[data-action=continue]").click();
      await page.locator("#redemption").waitFor({ state: "visible" });
      assert.notEqual(await page.locator("[data-redemption-runner]").innerText(), "");
      assert.notEqual(await page.locator("[data-prize-name]").innerText(), "");
      if (style === "pioneer") assert.equal(await page.locator("#redemption").evaluate((e) => e.classList.contains("is-sustainable")), true);
      await page.locator("[data-action=restart]").click();
    }

    const stored = await page.evaluate(() => JSON.stringify({
      participants: JSON.parse(localStorage.getItem("garminRunMockParticipants") || "[]"),
      requests: JSON.parse(localStorage.getItem("garminRunMockRequests") || "{}")
    }));
    for (const personalField of ["name", "email", "phone", "address", "raffleOptIn", "privacyConfirmed"]) {
      assert.equal(stored.includes(personalField), false, `Mock storage must not contain ${personalField}`);
    }
    assert.deepEqual(errors, []);
    await context.close();

    for (const width of [375, 390, 430, 768, 1280]) {
      const viewport = await browser.newPage({ viewport: { width, height: 844 } });
      await viewport.goto(`${base}/`);
      await viewport.waitForFunction(() => !document.querySelector("[data-action=start]").disabled);
      await viewport.locator("[data-action=start]").click();
      await viewport.locator('label[for="q1_experience"]').click();
      await viewport.locator("[data-action=next]").click();
      const hasOverflow = await viewport.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(hasOverflow, false, `${width}px should not overflow horizontally`);
      await viewport.close();
    }
    console.log("PASS anonymous flow, nine result combinations, Mock privacy, and responsive overflow smoke checks");
  } finally {
    await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
