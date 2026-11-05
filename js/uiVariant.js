// Presentation only. Internal runner IDs, quiz data and API mode are unchanged.
const PROJECT_ROOT = new URL("../", import.meta.url);

export function resolveProjectAsset(path) {
  return path ? new URL(path, PROJECT_ROOT).href : "";
}

const cuteRunners = {
  performance: {
    title: { zh: "突破PB飆速杜賓", en: "PB Chasing Doberman" },
    image: { src: "./cute/assets/doberman-concept.svg", alt: {
      zh: "杜賓犬戴著跑錶、穿競速鞋向前跑的 SVG 概念稿",
      en: "Concept illustration of a Doberman sprinting with a running watch and race shoes"
    } }
  },
  experience: {
    title: { zh: "我就是來看看柴犬", en: "Just Here to Vibe Shiba" },
    image: { src: "./cute/assets/shiba-concept.svg", alt: {
      zh: "柴犬別著號碼布、開心參賽的 SVG 概念稿",
      en: "Concept illustration of a curious Shiba running with a race bib"
    } }
  },
  lifestyle: {
    title: { zh: "志在參加臘腸", en: "Happy to Be Here Dachshund" },
    image: { src: "./cute/assets/dachshund-concept.svg", alt: {
      zh: "臘腸犬戴著運動頭帶、帶小水壺自在慢跑的 SVG 概念稿",
      en: "Concept illustration of an easygoing Dachshund jogging with a headband and water bottle"
    } }
  }
};

const variants = {
  urban: { id: "urban", copy: {}, runners: {} },
  cute: {
    id: "cute",
    resultPrefix: { zh: "", en: "" },
    runners: cuteRunners,
    copy: {
      "start.label": { zh: "可愛跑步俱樂部", en: "CUTE RUNNING CLUB" },
      "start.title": { zh: "一起跑，\n跑出你的可愛", en: "Your pace.\nYour kind of happy." },
      "start.description": {
        zh: "五個跑步小日常，找找你的跑者個性。準備好了嗎？一起出發！",
        en: "Five little running moments. Find your runner personality, then let's head out together!"
      },
      "start.button": { zh: "出發！找我的跑步夥伴", en: "Let's find my running buddy" },
      "cute.clubNote": { zh: "每個步調，都有好夥伴。", en: "Good company. Every pace." },
      "cute.prototype": { zh: "插圖概念稿・非正式定稿", en: "Concept artwork · not final" },
      "cute.variantNote": { zh: "另一種風格，同一場跑步。", en: "A different look. The same run." },
      "cute.sharedData": {
        zh: "UI 測試版本｜與原版共用同來源 Mock 資料；Apps Script Demo 亦共用 Demo 庫存。",
        en: "UI prototype | Shares this origin's Mock data and the same Apps Script Demo inventory."
      },
      "cute.backToUrban": { zh: "看看原版風格 ↗", en: "Explore the original style ↗" }
    }
  }
};

export function getUiVariant(id) {
  return variants[id] || variants.urban;
}

export function presentResults(results, variant) {
  if (variant.id === "urban") return results;
  return Object.fromEntries(Object.entries(results).map(([id, result]) => [
    id, { ...result, ...(variant.runners[id] || {}) }
  ]));
}
