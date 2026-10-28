const CSV_URL = new URL("../content.csv", import.meta.url);

const CSV_COLUMNS = [
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
  return { zh, en };
}

function readBoolean(value, column, id) {
  if (value === "true") return true;
  if (value === "false" || value === "") return false;
  throw new Error(`Invalid ${column} value for ${id}: ${value}`);
}

function buildContent(rows) {
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
      isMeme: readBoolean(row.is_meme, "is_meme", row.id)
    });
  });

  if (questions.length === 0 || questions.some((question) => question.options.length === 0)) {
    throw new Error("content.csv must contain questions and at least one option per question.");
  }

  const resultRows = rows.filter((row) => row.type === "result");
  const resultData = Object.fromEntries(resultRows.map((row) => [row.id, {
    title: localized(row.zh, row.en),
    description: localized(row.description_zh, row.description_en),
    hydration: {
      title: localized(row.hydration_title_zh, row.hydration_title_en),
      description: localized(row.hydration_description_zh, row.hydration_description_en)
    },
    sustainability: {},
    image: {
      src: row.image_src,
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

  if (resultRows.length === 0 || resultRows.some((row) => !resultData[row.id].sustainability.title.zh)) {
    throw new Error("Each result must include a sustainability result row.");
  }

  if (Object.keys(ui).length === 0) {
    throw new Error("content.csv must include UI copy rows.");
  }

  return {
    quizData: { questions },
    runnerTypes: resultRows.map((row) => row.id),
    resultData,
    q6ResultData: { label: ui["q6Result.label"] },
    ui
  };
}

export async function loadContent() {
  const response = await fetch(CSV_URL);
  if (!response.ok) {
    throw new Error(`Unable to load content.csv (${response.status}).`);
  }

  const [header, ...dataRows] = parseCsv((await response.text()).replace(/^\uFEFF/, ""));
  if (!header || header.length !== CSV_COLUMNS.length || header.some((column, index) => column !== CSV_COLUMNS[index])) {
    throw new Error("content.csv has an unexpected column header.");
  }

  const records = dataRows.map((cells, index) => {
    if (cells.length !== header.length) {
      throw new Error(`content.csv row ${index + 2} has ${cells.length} columns; expected ${header.length}.`);
    }
    return Object.fromEntries(header.map((column, columnIndex) => [column, cells[columnIndex]]));
  });

  return buildContent(records);
}