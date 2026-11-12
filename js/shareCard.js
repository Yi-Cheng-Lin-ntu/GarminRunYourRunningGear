const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;
const SAFE_PADDING = 32;

function waitForFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function waitForImage(image) {
  if (image.hidden || !(image.currentSrc || image.src)) return;
  if (image.loading === "lazy") image.loading = "eager";
  if (!image.complete) {
    await new Promise((resolve, reject) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", () => reject(new Error(`Unable to load result image: ${image.currentSrc || image.src}`)), { once: true });
    });
  }
  if (!image.naturalWidth) throw new Error(`Result image is unavailable: ${image.currentSrc || image.src}`);
  if (typeof image.decode === "function") await image.decode();
}

function removeDuplicateIds(card) {
  card.removeAttribute("id");
  card.removeAttribute("aria-labelledby");
  card.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
  card.querySelectorAll("[aria-labelledby]").forEach((element) => element.removeAttribute("aria-labelledby"));
}

async function waitForAssets(card) {
  if (document.fonts?.ready) await document.fonts.ready;
  await Promise.all([...card.querySelectorAll("img")].map(waitForImage));

  // 等待結果卡使用的台北 SVG 遮罩可讀，DOM-to-image 才能內嵌背景資源。
  const map = new Image();
  map.src = new URL("../taipei.svg", import.meta.url).href;
  await waitForImage(map);
  await waitForFrame();
  await waitForFrame();
}

export async function renderResultSharePng({ card, stage, context, root }) {
  if (!card || !stage || !context || !root) throw new Error("The shared result-card elements are missing.");
  const domToImage = globalThis.htmlToImage;
  if (!domToImage?.toBlob) throw new Error("The local DOM-to-image renderer is unavailable.");

  // renderResult() runs just before showScreen(); wait for the result screen to become measurable.
  await waitForFrame();
  // 複製的是網站正在顯示的共用結果卡，內容和文案不另行組裝。
  root.replaceChildren(card.cloneNode(true));
  // 避免 DOM-to-image 將無來源的隱藏圖片當成目前頁面 URL 載入。
  root.querySelectorAll("img[hidden]").forEach((image) => {
    if (!image.hasAttribute("src") && !image.hasAttribute("srcset")) image.remove();
  });
  removeDuplicateIds(root.firstElementChild);
  const sourceWidth = card.getBoundingClientRect().width;
  if (!sourceWidth) throw new Error("The visible result card has no measurable width.");
  context.style.width = `${sourceWidth}px`;
  context.style.height = "auto";
  context.style.transform = "none";
  root.style.width = "100%";
  await waitForAssets(root);

  const cardHeight = root.firstElementChild.getBoundingClientRect().height;
  if (!cardHeight) throw new Error("The shared result card has no measurable height.");
  const scale = Math.min(
    (CARD_WIDTH - SAFE_PADDING * 2) / sourceWidth,
    (CARD_HEIGHT - SAFE_PADDING * 2) / cardHeight
  );
  context.style.height = `${cardHeight}px`;
  context.style.transform = `translate(-50%, -50%) scale(${scale})`;
  context.style.transformOrigin = "center center";
  await waitForFrame();
  await waitForFrame();

  const blob = await domToImage.toBlob(stage, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    pixelRatio: 1,
    cacheBust: true,
    backgroundColor: "#080b0d",
    // 舞台在頁面上位於螢幕外；只覆寫匯出複製品，避免內容也被畫到 PNG 邊界外。
    style: {
      position: "relative",
      inset: "auto",
      left: "0px",
      top: "0px",
      right: "auto",
      bottom: "auto",
      zIndex: "auto",
      transform: "none"
    },
    skipAutoScale: true
  });
  if (!blob || blob.type !== "image/png") throw new Error("PNG generation failed.");
  return blob;
}
