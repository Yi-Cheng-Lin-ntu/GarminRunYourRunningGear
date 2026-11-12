const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;
const SHARE_CARD_TYPE = {
  header: "700 28px",
  footer: "700 28px",
  eyebrow: "800 36px",
  display: "900 82px",
  slogan: "700 43px",
  tag: "700 23px",
  sectionLabel: "800 29px",
  recommendationHeading: "800 35px",
  recommendationBody: "700 30px"
};
const SHARE_CARD_LINE_HEIGHT = {
  tag: 26,
  slogan: 58,
  recommendationHeading: 52,
  recommendationBody: 48
};

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
  context.font = `${SHARE_CARD_TYPE.tag} ${colors.fontFamily}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  const lines = wrapText(context, `# ${text}`, width - 32).slice(0, 2);
  lines.forEach((line, index) => context.fillText(line, x + width / 2, y + height / 2 + (index - (lines.length - 1) / 2) * SHARE_CARD_LINE_HEIGHT.tag));
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

  // 直式結果卡：沿用結果頁的內容順序與區塊框架。
  context.fillStyle = colors.black;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  context.globalAlpha = .2;
  context.drawImage(mapImage, 0, 0, CARD_WIDTH, CARD_HEIGHT);
  context.globalAlpha = 1;

  const frame = { x: 108, y: 220, width: 864, height: 810 };

  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.font = `${SHARE_CARD_TYPE.header} ${colors.fontFamily}`;
  let headerX = frame.x;
  context.fillStyle = colors.white;
  context.fillText(model.headerPrefix, headerX, 54);
  headerX += context.measureText(`${model.headerPrefix} `).width;
  context.fillStyle = colors.green;
  context.fillText(model.headerRun, headerX, 54);
  headerX += context.measureText(`${model.headerRun} `).width;
  context.fillStyle = colors.white;
  context.fillText(model.headerSuffix, headerX, 54);

  context.beginPath();
  context.moveTo(frame.x, 80);
  context.lineTo(frame.x + frame.width, 80);
  context.strokeStyle = "rgba(247,250,248,.5)";
  context.lineWidth = 2;
  context.stroke();

  context.beginPath();
  context.moveTo(frame.x, 1832);
  context.lineTo(frame.x + frame.width, 1832);
  context.stroke();
  context.fillStyle = colors.white;
  context.font = `${SHARE_CARD_TYPE.footer} ${colors.fontFamily}`;
  context.fillText(model.footer, frame.x, 1874);

  roundedRect(context, frame.x, frame.y, frame.width, frame.height, 18);
  context.strokeStyle = colors.white;
  context.lineWidth = 4;
  context.stroke();
  drawContained(context, runnerImage, 125, frame.y + 138, 830, 664);

  context.textAlign = "center";
  context.fillStyle = colors.white;
  context.textBaseline = "alphabetic";
  context.font = `${SHARE_CARD_TYPE.eyebrow} ${colors.fontFamily}`;
  context.fillText(model.eyebrow, CARD_WIDTH / 2, frame.y - 100);
  context.font = `${SHARE_CARD_TYPE.display} ${colors.fontFamily}`;
  const titleWidth = Math.min(820, context.measureText(model.title).width + 90);
  roundedRect(context, (CARD_WIDTH - titleWidth) / 2, frame.y - 66, titleWidth, 132, 36);
  context.fillStyle = colors.black;
  context.fill();
  context.fillStyle = colors.white;
  context.textBaseline = "middle";
  context.fillText(model.title, CARD_WIDTH / 2, frame.y, titleWidth - 42);
  context.font = `${SHARE_CARD_TYPE.slogan} ${colors.fontFamily}`;
  const sloganLines = wrapText(context, model.slogan, 790).slice(0, 2);
  sloganLines.forEach((line, index) => context.fillText(line, CARD_WIDTH / 2, frame.y + 126 + index * SHARE_CARD_LINE_HEIGHT.slogan));
  context.textAlign = "left";

  const visibleTags = model.tags.filter(Boolean).slice(0, 4);
  const tagGap = 14;
  const tagWidth = (frame.width - tagGap * Math.max(0, visibleTags.length - 1)) / Math.max(1, visibleTags.length);
  visibleTags.forEach((tag, index) => {
    drawTag(context, tag, frame.x + index * (tagWidth + tagGap), frame.y + 822, tagWidth, colors);
  });

  const panel = { x: frame.x, y: frame.y + 944, width: frame.width, height: 530 };
  roundedRect(context, panel.x, panel.y, panel.width, panel.height, 18);
  context.strokeStyle = colors.white;
  context.lineWidth = 4;
  context.stroke();

  const labelText = model.isPioneer ? model.pioneerBanner : model.recommendationLabel;
  context.font = `${SHARE_CARD_TYPE.sectionLabel} ${colors.fontFamily}`;
  const label = {
    x: panel.x + 20,
    y: panel.y - 25,
    width: Math.min(panel.width - 40, context.measureText(labelText).width + 72),
    height: 72
  };
  context.save();
  context.translate(label.x, label.y);
  context.rotate(-3 * Math.PI / 180);
  context.transform(1, 0, Math.tan(-5 * Math.PI / 180), 1, 0, 0);
  context.beginPath();
  context.moveTo(18, 0);
  context.lineTo(label.width, 0);
  context.lineTo(label.width - 18, label.height);
  context.lineTo(0, label.height);
  context.closePath();
  context.fillStyle = model.isPioneer ? colors.green : colors.blue;
  context.fill();
  context.fillStyle = colors.black;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(labelText, label.width / 2, label.height / 2, label.width - 48);
  context.restore();
  context.textAlign = "left";
  context.textBaseline = "alphabetic";

  const contentPadding = 30;
  const leftX = panel.x + contentPadding;
  const imageColumnWidth = 270;
  const copyX = model.isPioneer ? leftX : leftX + imageColumnWidth + 30;
  const copyWidth = panel.x + panel.width - contentPadding - copyX;
  if (!model.isPioneer) {
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
  context.font = `${SHARE_CARD_TYPE.recommendationHeading} ${colors.fontFamily}`;
  const headingBottom = drawTextBlock(context, model.recommendationHeading, copyX, panel.y + 190, copyWidth, SHARE_CARD_LINE_HEIGHT.recommendationHeading, 4);
  context.font = `${SHARE_CARD_TYPE.recommendationBody} ${colors.fontFamily}`;
  drawTextBlock(context, model.recommendationDescription, copyX, headingBottom + 36, copyWidth, SHARE_CARD_LINE_HEIGHT.recommendationBody, 5);

  if (model.isPioneer && sustainabilityImage) {
    const markSize = 336;
    const imageX = panel.x + panel.width - markSize + 112;
    const imageY = panel.y + panel.height - markSize + 98;
    context.save();
    context.beginPath();
    context.arc(imageX + markSize / 2, imageY + markSize / 2, markSize / 2, 0, Math.PI * 2);
    context.clip();
    drawContained(context, sustainabilityImage, imageX, imageY, markSize, markSize);
    context.restore();
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG encoding failed.")), "image/png");
  });
}
