import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { parseContent } from "../js/contentData.js";
import { classifyAnswers } from "../js/classificationEngine.js";
import { classificationRules } from "../js/classificationRules.js";
import { derivePrizeEligibility } from "../js/prizeEligibility.js";
import { validateAnonymousPayload } from "../js/participationValidation.js";

const content = parseContent(readFileSync(new URL("../content.csv", import.meta.url), "utf8"));
const types = ["experience", "lifestyle", "performance"];
const styles = ["precision", "rest", "pioneer"];
const backend = vm.createContext({ Date, JSON, getSettingValue: (key) => key === "demoPrivacyNoticeVersion" ? "DEMO_ONLY" : "DRAFT_NOT_APPROVED" });
vm.runInContext(readFileSync(new URL("../apps-script/Validation.gs", import.meta.url), "utf8"), backend);
const front = (answers, questions = content.quizData.questions) => classifyAnswers({ questions, answers, runnerTypes: types, rules: classificationRules });
const answers = (style = "rest", type = "experience") => ({ q1: `q1_${type}`, q2: `q2_${type}`, q3: `q3_${type}`, q4: `q4_${style}`, q5: `q5_${type}` });
function payload(style = "rest", commitment = "considering") {
  const a = answers(style);
  const result = front(a);
  return {
    ...derivePrizeEligibility({ runnerType: result.runnerType, existingSelfHydration: result.sustainability, hydrationCommitment: commitment }),
    answers: a, quizVersion: 2, hydrationStyle: style, q4Answer: a.q4,
    requestId: "anon-test-request", sessionId: "anon-test-session", submissionVersion: 1
  };
}

test("CSV has exactly five ordered questions, three options each, exact approved Chinese copy", () => {
  const prompts = ["我參加 Garmin Run 是因為...", "從5月報名到今天比賽前…", "賽前一晚收拾裝備", "跑到補給站前", "剩下最後 2K"];
  const options = [
    ["跑者大拜拜之一，必須搶！", "有好玩賽事都報！", "目標賽事之一，11月底是突破PB的好時機！"],
    ["蛤? 訓練是什麼?", "不分賽季，平常都一直在跑啦", "每天課表吃到飽"],
    ["儀式感要有，裝備排好來張大合照！", "該帶的塞進衣保袋、晶片綁好，睡飽比較重要啦", "鞋子、手錶、果膠…必須萬無一失！"],
    ["看準空檔，精準進站！遠離人群！", "終於可以休息！ 看看有什麼好吃的?", "優雅地拿出自己的軟水杯／軟水壺裝水"],
    ["準備好！我要漂亮進站", "這2km好漫長~~~~", "All in了！現在不衝什麼時候衝！"]
  ];
  assert.equal(content.version, 2);
  assert.equal(content.quizData.questions.length, 5);
  content.quizData.questions.forEach((q, i) => {
    assert.equal(q.id, `q${i + 1}`);
    assert.equal(q.prompt.zh, prompts[i]);
    assert.deepEqual(q.options.map((o) => o.text.zh), options[i]);
    assert.ok(q.options.every((o) => o.text.en));
  });
});

test("question subtitles may be blank in both languages", () => {
  const source = readFileSync(new URL("../content.csv", import.meta.url), "utf8");
  const blankSubtitleCsv = source.split(/\r?\n/).map((line) => {
    if (!line.startsWith("question_subtitle,q1_subtitle,")) return line;
    const cells = line.split(",");
    cells[3] = "";
    cells[4] = "";
    return cells.join(",");
  }).join("\n");
  const blankSubtitleContent = parseContent(blankSubtitleCsv);

  assert.deepEqual(blankSubtitleContent.quizData.questions[0].subtitle, { zh: "", en: "" });
  assert.equal(blankSubtitleContent.quizData.questions[0].options.length, 3);
});

test("All 243 answer combinations match independent scoring and Apps Script; option order irrelevant", () => {
  let ties = 0;
  const winners = new Set();
  for (const q1 of types) for (const q2 of types) for (const q3 of types) for (const q5 of types) {
    const expectedScores = Object.fromEntries(types.map((type) => [type, [q1, q2, q3, q5].filter((t) => t === type).length]));
    const max = Math.max(...Object.values(expectedScores));
    const top = types.filter((type) => expectedScores[type] === max);
    const expectedType = top.length === 1 ? top[0] : q2;
    if (top.length > 1) ties++;
    winners.add(expectedType);
    for (const style of styles) {
      const a = { q1: `q1_${q1}`, q2: `q2_${q2}`, q3: `q3_${q3}`, q4: `q4_${style}`, q5: `q5_${q5}` };
      const result = front(a);
      assert.equal(result.runnerType, expectedType);
      assert.deepEqual(result.scores, expectedScores);
      assert.equal(result.sustainability, style === "pioneer");
      assert.equal(result.hydrationStyle, style);
      assert.equal(result.q4Answer, a.q4);
      assert.deepEqual(JSON.parse(JSON.stringify(backend.classifyServerAnswers(a))), result);
      assert.deepEqual(front(a, content.quizData.questions.map((q) => ({ ...q, options: [...q.options].reverse() }))), result);
    }
  }
  assert.equal(ties, 18);
  assert.equal(winners.size, 3);
});

test("Three PNGs, fixed slogans and four tags; all nine recommendations match approved copy", () => {
  const expected = {
    experience: ["賽事收藏家", "跑的是賽事，收的是回憶！", ["儀式感不能少", "氣分組", "跑一場玩一場", ""], [
      ["水袋背心", "不用跟人擠，想喝就喝，還能外帶點食物"], ["軟水杯", "用自己的杯子，慢慢休我就Chill~~"], ["懂玩! 你已經帶上自己補水裝備", "也邀請身邊的跑友一起試試不同的補水方式"]]],
    lifestyle: ["自在巡航員", "跑步是生活，比賽是日常！", ["舒服最重要", "以賽代訓", "我有我的節奏", ""], [
      ["軟水壺／水袋背心", "不用跟人擠，想補就補維持自己節奏"], ["軟水杯", "輕到沒有存在感，還能在水站休一下"], ["不愧是專業跑者，不忘帶上自己補水裝備", "也邀請身邊的跑友一起試試不同的補水方式"]]],
    performance: ["配速計算機", "追逐PB是我跑下去的動力！", ["設定目標", "", "差一秒就破PB", "抓水杯也要練習"], [
      ["軟水杯", "偶爾也可以喘口氣，以不同的方式體驗賽道"], ["軟水杯", "該休還是要休一下，帶著輕到沒有存在感"], ["神人級! 這樣速還帶上自己補水裝備!", "也邀請身邊的跑友一起試試不同的補水方式"]]]
  };
  assert.equal(Object.keys(content.recommendations).length, 9);
  for (const [type, [name, slogan, tags, recommendations]] of Object.entries(expected)) {
    const result = content.resultData[type];
    assert.equal(result.title.zh, name);
    assert.equal(result.slogan.zh, slogan);
    assert.deepEqual(result.tags.map((t) => t.zh), tags);
    assert.equal(result.image.src, `./assets/result/${name}.png`);
    const png = readFileSync(new URL(`../assets/result/${name}.png`, import.meta.url));
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    styles.forEach((style, i) => {
      const rec = content.recommendations[`${type}:${style}`];
      assert.deepEqual([rec.heading.zh, rec.description.zh], recommendations[i]);
      assert.ok(rec.heading.en && rec.description.en);
      assert.equal(rec.gear === null, style === "pioneer");
      assert.equal(content.resultData[type], result);
    });
  }
});

test("Anonymous contract omits personal data and agrees with Apps Script", () => {
  for (const [style, commitment] of [["pioneer", "existing"], ["rest", "joined"], ["precision", "considering"]]) {
    const data = payload(style, commitment);
    const frontend = validateAnonymousPayload(data);
    assert.equal(frontend.submissionVersion, 1);
    assert.equal(Object.hasOwn(frontend, "name"), false);
    assert.equal(Object.hasOwn(frontend, "email"), false);
    const server = backend.validateAnonymousSubmission(data, true);
    assert.equal(server.premiumPrizeEligible, style === "pioneer");
    assert.equal(server.sustainabilityRewardEligible, commitment !== "considering");
    assert.equal(server.q4Answer, `q4_${style}`);
    assert.equal(server.hydrationStyle, style);
  }
  const invalids = [
    [{ name: "not retained" }, "PERSONAL_DATA_NOT_ALLOWED"], [{ email: "not-retained@example.invalid" }, "PERSONAL_DATA_NOT_ALLOWED"],
    [{ premiumPrizeEligible: true }, "ELIGIBILITY_MISMATCH"], [{ q4Answer: "q4_pioneer" }, "ELIGIBILITY_MISMATCH"],
    [{ quizVersion: 1 }, "UNSUPPORTED_SUBMISSION_VERSION"], [{ submissionVersion: 2 }, "UNSUPPORTED_SUBMISSION_VERSION"],
    [{ answers: { ...answers(), q4: "q4_invalid" } }, "INVALID_ANSWER"]
  ];
  for (const [override, code] of invalids) {
    assert.throws(() => validateAnonymousPayload({ ...payload(), ...override }), new RegExp(code));
    assert.throws(() => backend.validateAnonymousSubmission({ ...payload(), ...override }, true), new RegExp(code));
  }
  assert.throws(() => front({ ...answers(), q2: "q2_sustainability" }), /INVALID_ANSWER/);
});

export { payload };
