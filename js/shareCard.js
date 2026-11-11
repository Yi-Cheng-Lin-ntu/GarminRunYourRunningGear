const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function imageFrom(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load share image: ${src}`));
    image.src = src;
    if (image.complete && image.naturalWidth) resolve(image);
  });
}

function drawContained(context, image, x, y, width, height) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function wrapText(context, value, maxWidth) {
  const text = String(value || "");
  const segments = typeof Intl.Segmenter === "function"
    ? [...new Intl.Segmenter(undefined, { granularity: "word" }).segment(text)].map((entry) => entry.segment)
    : Array.from(text);
  const lines = [];
  let line = "";
  for (const segment of segments) {
    const candidate = line + segment;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line.trimEnd());
      line = segment.trimStart();
    } else line = candidate;
  }
  if (line) lines.push(line.trimEnd());
  return lines.length ? lines : [""];
}

function drawTextBlock(context, value, x, y, maxWidth, lineHeight, maxLines = 8) {
  const lines = wrapText(context, value, maxWidth).slice(0, maxLines);
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function drawTag(context, text, x, y, width, colors) {
  const height = 62;
  context.beginPath();
  context.moveTo(x + 18, y);
  context.lineTo(x + width, y);
  context.lineTo(x + width - 18, y + height);
  context.lineTo(x, y + height);
  context.closePath();
  context.fillStyle = colors.green;
  context.fill();
  context.fillStyle = colors.black;
  context.font = `700 23px ${colors.fontFamily}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  const lines = wrapText(context, `# ${text}`, width - 32).slice(0, 2);
  lines.forEach((line, index) => context.fillText(line, x + width / 2, y + height / 2 + (index - (lines.length - 1) / 2) * 26));
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
}

export async function renderResultSharePng(canvas, model) {
  const [runnerImage, equipmentImages, sustainabilityImage, mapImage] = await Promise.all([
    imageFrom(model.image.src),
    Promise.all(model.equipment.map((item) => imageFrom(item.src))),
    model.isPioneer ? imageFrom(model.sustainabilityImage.src) : Promise.resolve(null),
    imageFrom(new URL("../taipei.svg", import.meta.url).href)
  ]);
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is unavailable.");

  const root = getComputedStyle(document.documentElement);
  const colors = {
    black: root.getPropertyValue("--brand-black").trim() || "#080b0d",
    white: root.getPropertyValue("--brand-white").trim() || "#f7faf8",
    blue: root.getPropertyValue("--brand-blue").trim() || "#d6f2ff",
    green: root.getPropertyValue("--brand-green").trim() || "#00ff19",
    fontFamily: getComputedStyle(document.body).fontFamily || "Arial, sans-serif"
  };

  // 直式結果卡：沿用結果頁的內容模型，排版對應六張設計稿。
  context.fillStyle = colors.black;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  context.globalAlpha = .2;
  context.drawImage(mapImage, 0, 0, CARD_WIDTH, CARD_HEIGHT);
  context.globalAlpha = 1;

  const frame = { x: 108, y: 96, width: 864, height: 810 };
  roundedRect(context, frame.x, frame.y, frame.width, frame.height, 18);
  context.strokeStyle = colors.white;
  context.lineWidth = 4;
  context.stroke();

  context.textAlign = "center";
  context.fillStyle = colors.white;
  context.textBaseline = "alphabetic";
  context.font = `800 36px ${colors.fontFamily}`;
  context.fillText(model.eyebrow, CARD_WIDTH / 2, 112);
  context.font = `900 82px ${colors.fontFamily}`;
  const titleWidth = Math.min(820, context.measureText(model.title).width + 90);
  roundedRect(context, (CARD_WIDTH - titleWidth) / 2, 112, titleWidth, 132, 36);
  context.fillStyle = colors.black;
  context.fill();
  context.fillStyle = colors.white;
  context.textBaseline = "middle";
  context.fillText(model.title, CARD_WIDTH / 2, 178, titleWidth - 42);
  context.font = `700 43px ${colors.fontFamily}`;
  const sloganLines = wrapText(context, model.slogan, 790).slice(0, 2);
  sloganLines.forEach((line, index) => context.fillText(line, CARD_WIDTH / 2, 294 + index * 58));
  context.textAlign = "left";
  drawContained(context, runnerImage, 150, 280, 780, 624);

  const visibleTags = model.tags.filter(Boolean).slice(0, 4);
  const tagGap = 14;
  const tagWidth = (864 - tagGap * 2) / 3;
  visibleTags.forEach((tag, index) => {
    const row = Math.floor(index / 3);
    const column = index % 3;
    const rowCount = row === 0 ? Math.min(3, visibleTags.length) : visibleTags.length - 3;
    const offset = row === 0 ? 108 : (CARD_WIDTH - (rowCount * tagWidth + (rowCount - 1) * tagGap)) / 2;
    drawTag(context, tag, offset + column * (tagWidth + tagGap), 918 + row * 74, tagWidth, colors);
  });

  const panelY = visibleTags.length > 3 ? 1182 : 1108;
  const panel = { x: 100, y: panelY, width: 880, height: 530 };
  roundedRect(context, panel.x, panel.y, panel.width, panel.height, 18);
  context.strokeStyle = colors.white;
  context.lineWidth = 4;
  context.stroke();

  const label = { x: 72, y: panel.y - 25, width: 430, height: 72 };
  context.beginPath();
  context.moveTo(label.x + 18, label.y);
  context.lineTo(label.x + label.width, label.y);
  context.lineTo(label.x + label.width - 18, label.y + label.height);
  context.lineTo(label.x, label.y + label.height);
  context.closePath();
  context.fillStyle = model.isPioneer ? colors.green : colors.blue;
  context.fill();
  context.fillStyle = colors.black;
  context.font = `800 29px ${colors.fontFamily}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(model.isPioneer ? model.pioneerBanner : model.recommendationLabel, label.x + label.width / 2, label.y + label.height / 2, label.width - 30);
  context.textAlign = "left";
  context.textBaseline = "alphabetic";

  const leftX = panel.x + 34;
  const imageColumnWidth = 270;
  const copyX = panel.x + 360;
  const copyWidth = panel.width - 405;
  context.beginPath();
  context.moveTo(panel.x + 320, panel.y + 80);
  context.lineTo(panel.x + 320, panel.y + panel.height - 38);
  context.strokeStyle = "rgba(247,250,248,.72)";
  context.lineWidth = 2;
  context.stroke();

  if (model.isPioneer && sustainabilityImage) {
    const markSize = 208;
    context.save();
    context.beginPath();
    context.arc(panel.x + panel.width - 130, panel.y + panel.height - 112, markSize / 2, 0, Math.PI * 2);
    context.clip();
    drawContained(context, sustainabilityImage, panel.x + panel.width - markSize - 26, panel.y + panel.height - markSize - 8, markSize, markSize);
    context.restore();
  } else {
    const slotGap = 8;
    const slotWidth = (imageColumnWidth - slotGap * Math.max(0, equipmentImages.length - 1)) / Math.max(1, equipmentImages.length);
    equipmentImages.forEach((image, index) => {
      const slotX = leftX + index * (slotWidth + slotGap);
      context.fillStyle = colors.blue;
      context.beginPath();
      context.ellipse(slotX + slotWidth / 2, panel.y + 362, slotWidth * .45, 28, 0, 0, Math.PI * 2);
      context.fill();
      drawContained(context, image, slotX, panel.y + 90, slotWidth, 310);
    });
  }

  context.fillStyle = colors.white;
  context.font = `800 35px ${colors.fontFamily}`;
  const headingBottom = drawTextBlock(context, model.recommendationHeading, copyX, panel.y + 190, copyWidth, 52, 4);
  context.font = `700 30px ${colors.fontFamily}`;
  drawTextBlock(context, model.recommendationDescription, copyX, headingBottom + 36, model.isPioneer ? copyWidth - 100 : copyWidth, 48, 5);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG encoding failed.")), "image/png");
  });
}
