import test from "node:test";
import assert from "node:assert/strict";
import { renderRedemptionView } from "../js/redemptionView.js";

function element() {
  const classes = new Set();
  return {
    hidden: false,
    textContent: "",
    children: [],
    attributes: {},
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name),
      contains: (name) => classes.has(name)
    },
    append(child) { this.children.push(child); },
    replaceChildren() { this.children = []; },
    setAttribute(name, value) { this.attributes[name] = value; }
  };
}

function render(allocation, hydrationStyle = "rest") {
  const instruction = element();
  const elements = {
    redemption: element(),
    redemptionRunner: element(),
    redemptionTitle: element(),
    prizeCard: element(),
    pausedMessage: element(),
    prizeImage: element(),
    prizeName: element(),
    sustainabilityMessage: element()
  };
  const priorDocument = globalThis.document;
  globalThis.document = {
    querySelector: () => instruction,
    createElement: () => element()
  };

  try {
    renderRedemptionView(allocation, {
      state: { language: "zh", result: { runnerType: "experience", hydrationStyle } },
      elements,
      resultData: { experience: { title: { zh: "賽事收藏家" } } },
      text: (value) => value?.zh || value?.en || "",
      copy: (key) => ({
        "v2.redemptionRunnerPrefix": "跑者類型｜",
        "v2.redemptionTitle": "恭喜你抽中！",
        "v2.sustainabilityRedemptionTitle": "永續先鋒隊專屬",
        "v2.pausedPrizes": "獎品已發放完畢，謝謝參與",
        "v2.sustainabilityMessage": "永續行動訊息｜可領取貼紙與飄帶",
        "v2.redemptionInstruction": "請至攤位領取"
      })[key],
      prizeCatalog: {},
      resolveProjectAsset: (path) => path,
      showScreen: () => {}
    });
  } finally {
    globalThis.document = priorDocument;
  }

  return { elements, instruction };
}

const prize = { prizeId: "cap", nameZh: "牛仔帽", imagePath: "" };

test("Q4 pioneer allocations retain the green exclusive label while the bag is awarded", () => {
  const { elements } = render({
    allocationStatus: "allocated",
    allocationMethod: "premium_priority",
    sustainabilityRewardEligible: true,
    prize,
    runnerType: "experience"
  }, "pioneer");
  assert.equal(elements.redemptionTitle.textContent, "永續先鋒隊專屬");
  assert.equal(elements.redemption.classList.contains("is-sustainable"), true);
  assert.equal(elements.redemptionTitle.hidden, false);
});

test("joined runners get the ordinary congratulation label with the green theme", () => {
  const { elements } = render({
    allocationStatus: "allocated",
    allocationMethod: "general_weighted",
    sustainabilityRewardEligible: true,
    prize,
    runnerType: "experience"
  }, "rest");
  assert.equal(elements.redemptionTitle.textContent, "恭喜你抽中！");
  assert.equal(elements.redemption.classList.contains("is-sustainable"), true);
});

test("premium fallback changes the title while keeping the sustainable green theme", () => {
  const { elements } = render({
    allocationStatus: "allocated",
    allocationMethod: "premium_fallback",
    sustainabilityRewardEligible: true,
    prize,
    runnerType: "experience"
  }, "pioneer");
  assert.equal(elements.redemptionTitle.textContent, "恭喜你抽中！");
  assert.equal(elements.redemption.classList.contains("is-sustainable"), true);
});

test("paused allocation hides the award card and shows only the inventory status in its place", () => {
  const { elements, instruction } = render({
    allocationStatus: "paused",
    sustainabilityRewardEligible: true,
    prize: null,
    message: { zh: "舊版回應文案" },
    runnerType: "experience"
  });
  assert.equal(elements.prizeCard.hidden, true);
  assert.equal(elements.redemptionTitle.hidden, true);
  assert.equal(elements.pausedMessage.hidden, false);
  assert.equal(elements.pausedMessage.textContent, "獎品已發放完畢，謝謝參與");
  assert.equal(elements.redemption.attributes["aria-labelledby"], "allocation-paused-title");
  assert.equal(instruction.hidden, true);
  assert.equal(elements.sustainabilityMessage.hidden, true);
  assert.equal(elements.redemption.classList.contains("is-sustainable"), false);
});
