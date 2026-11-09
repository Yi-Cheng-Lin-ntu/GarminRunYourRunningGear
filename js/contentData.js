const CSV_URL = new URL("../content.csv", import.meta.url);

const REQUIRED_COLUMNS = [
  "type",
  "id",
  "parent_id",
  "zh",
  "en",
  "description_zh",
  "description_en",
  "traits",
  "sustainability",
  "is_meme",
  "hydration_title_zh",
  "hydration_title_en",
  "hydration_description_zh",
  "hydration_description_en",
  "cta_zh",
  "cta_en",
  "image_src",
  "image_alt_zh",
  "image_alt_en"
];

function parseCsv(source) {
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (insideQuotes) {
      if (character === '"' && source[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        insideQuotes = false;
      } else {
        value += character;
      }
      continue;
    }

    if (character === '"' && value.length === 0) {
      insideQuotes = true;
    } else if (character === ",") {
      row.push(value);
      value = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && source[index + 1] === "\n") {
        index += 1;
      }
      row.push(value);
      if (row.some((cell) => cell !== "")) {
        rows.push(row);
      }
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  if (insideQuotes) {
    throw new Error("content.csv contains an unterminated quoted field.");
  }

  if (row.length > 0 || value.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function localized(zh, en) {
  return { zh: zh || "", en: en || "" };
}

function readBoolean(value, column, id) {
  if (value === "true") return true;
  if (value === "false" || value === "") return false;
  throw new Error(`Invalid ${column} value for ${id}: ${value}`);
}

function buildContent(rows) {
  const version = Number(rows.find((row) => row.type === "metadata" && row.id === "quizVersion")?.zh || 1);
  const questionRows = rows.filter((row) => row.type === "question");
  const questions = questionRows.map((row) => ({
    id: row.id,
    prompt: localized(row.zh, row.en),
    options: []
  }));
  const questionsById = new Map(questions.map((question) => [question.id, question]));

  rows.filter((row) => row.type === "option").forEach((row) => {
    const question = questionsById.get(row.parent_id);
    if (!question) {
      throw new Error(`Option ${row.id} references unknown question ${row.parent_id}.`);
    }
    question.options.push({
      id: row.id,
      text: localized(row.zh, row.en),
      traits: row.traits ? row.traits.split("|").filter(Boolean) : [],
      sustainability: readBoolean(row.sustainability, "sustainability", row.id),
      isMeme: readBoolean(row.is_meme, "is_meme", row.id),
      hydrationStyle: row.hydration_style || null
    });
  });

  if (questions.length === 0 || questions.some((question) => question.options.length === 0)) {
    throw new Error("content.csv must contain questions and at least one option per question.");
  }

  const resultRows = rows.filter((row) => row.type === "result");
  const resultData = Object.fromEntries(resultRows.map((row) => [row.id, {
    title: localized(row.zh, row.en),
    slogan: localized(row.slogan_zh, row.slogan_en),
    tags: [1, 2, 3, 4].map((position) => localized(row[`tag${position}_zh`], row[`tag${position}_en`])),
    description: localized(row.description_zh, row.description_en),
    detail: localized(row.detail_zh, row.detail_en),
    hydration: {
      title: localized(row.hydration_title_zh, row.hydration_title_en),
      description: localized(row.hydration_description_zh, row.hydration_description_en)
    },
    gear: localized(row.gear_zh, row.gear_en),
    sustainability: {},
    image: {
      src: row.image_src || "",
      alt: localized(row.image_alt_zh, row.image_alt_en)
    },
    cta: localized(row.cta_zh, row.cta_en)
  }]));

  rows.filter((row) => row.type === "result_sustainability").forEach((row) => {
    const result = resultData[row.id];
    if (!result) {
      throw new Error(`Sustainability result references unknown runner type ${row.id}.`);
    }
    result.sustainability = {
      title: localized(row.zh, row.en),
      description: localized(row.description_zh, row.description_en)
    };
  });

  const ui = Object.fromEntries(rows
    .filter((row) => row.type === "ui")
    .map((row) => [row.id, localized(row.zh, row.en)]));

  if (version === 1 && (resultRows.length === 0 || resultRows.some((row) => !resultData[row.id].sustainability.title.zh))) {
    throw new Error("Each result must include a sustainability result row.");
  }

  if (Object.keys(ui).length === 0) {
    throw new Error("content.csv must include UI copy rows.");
  }

  const recommendations = {};
  rows.filter((row) => row.type === "recommendation").forEach((row) => {
    const key = `${row.parent_id}:${row.hydration_style}`;
    if (recommendations[key]) throw new Error("Duplicate recommendation: " + key);
    recommendations[key] = {
      heading: localized(row.zh, row.en), description: localized(row.description_zh, row.description_en),
      gear: row.hydration_style === "pioneer" ? null : localized(row.zh, row.en)
    };
  });
  if (version === 2) {
    if (questions.map((q) => q.id).join(",") !== "q1,q2,q3,q4,q5") throw new Error("V2 requires q1–q5 in order");
    for (const q of questions) {
      const keys = q.id === "q4" ? ["precision", "rest", "pioneer"] : ["experience", "lifestyle", "performance"];
      if (q.options.length !== 3 || new Set(q.options.map((o) => o.id)).size !== 3) throw new Error("V2 requires three unique options");
      for (const key of keys) {
        const option = q.options.find((o) => o.id === `${q.id}_${key}`);
        if (!option || (q.id === "q4" ? option.traits.length !== 0 || option.hydrationStyle !== key : option.traits.join() !== key || option.hydrationStyle !== null)
          || option.sustainability !== (q.id === "q4" && key === "pioneer")) throw new Error("Invalid V2 option: " + q.id);
      }
    }
    const types = ["experience", "lifestyle", "performance"];
    if (resultRows.length !== 3 || types.some((type) => !resultData[type]?.slogan.zh || !resultData[type]?.image.src)) throw new Error("V2 results incomplete");
    if (Object.keys(recommendations).length !== 9 || types.some((type) => ["precision", "rest", "pioneer"].some((style) => !recommendations[`${type}:${style}`]?.heading.zh))) throw new Error("V2 requires all nine recommendations");
  }
  return {
    version, recommendations,
    quizData: { questions },
    runnerTypes: resultRows.map((row) => row.id),
    resultData,
    ui
  };
}

export async function loadContent(url = CSV_URL) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load content.csv (${response.status}).`);
  }

  return parseContent(await response.text());
}

export function parseContent(source) {
  const [header, ...dataRows] = parseCsv(source.replace(/^\uFEFF/, ""));
  if (!header || REQUIRED_COLUMNS.some((column) => !header.includes(column))) {
    throw new Error("content.csv is missing one or more required columns.");
  }

  const records = dataRows.map((cells, index) => {
    if (cells.length !== header.length) {
      throw new Error(`content.csv row ${index + 2} has ${cells.length} columns; expected ${header.length}.`);
    }
    return Object.fromEntries(header.map((column, columnIndex) => [column, cells[columnIndex]]));
  });

  if (records.some((row) => row.type === "metadata" && row.id === "quizVersion" && row.zh === "2")) {
    const v2Columns = ["hydration_style", "slogan_zh", "slogan_en", ...[1, 2, 3, 4].flatMap((i) => [`tag${i}_zh`, `tag${i}_en`])];
    if (v2Columns.some((column) => !header.includes(column)) || new Set(header).size !== header.length) throw new Error("V2 content columns incomplete");
  }
  return buildContent(records);
}
