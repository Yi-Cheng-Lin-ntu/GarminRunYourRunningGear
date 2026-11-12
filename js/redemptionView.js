// Shared prize presentation; allocation and eligibility stay in the backend.
export function renderRedemptionView(allocation, { state, elements, resultData, text, copy, prizeCatalog, resolveProjectAsset, showScreen }) {
  const copyOr = (key, fallback) => copy?.(key) || fallback;
  state.displayedAllocation = allocation;
  const runnerType = allocation.runnerType || state.result?.runnerType;
  const runnerTitle = runnerType && resultData?.[runnerType]
    ? text(resultData[runnerType].title)
    : runnerType || "";
  const identityPrefix = copyOr("v2.redemptionRunnerPrefix", state.language === "zh" ? "跑者類型｜" : "Runner type | ");
  elements.redemptionRunner.textContent = `${identityPrefix}${runnerTitle}`;

  const prize = allocation.prize;
  const allocationPaused = allocation.allocationStatus === "paused";
  elements.prizeName.textContent = allocationPaused
    ? copyOr("v2.pausedPrizes", text(allocation.message))
    : prize
      ? copyOr(`prize.${prize.prizeId}`, text({ zh: prize.nameZh, en: prize.nameEn }))
      : copyOr("v2.prizeDetailsUnavailable", state.language === "zh" ? "獎品資料尚未確認" : "Prize details unavailable");

  elements.prizeImage.classList.remove("has-image");
  elements.prizeImage.replaceChildren();
  const catalogPrize = prize?.prizeId ? prizeCatalog[prize.prizeId] : null;
  const prizeImagePath = prize?.imagePath || catalogPrize?.imagePath || "";
  if (allocationPaused) {
    elements.prizeImage.hidden = true;
  } else if (prizeImagePath) {
    elements.prizeImage.hidden = false;
    const image = document.createElement("img");
    image.src = resolveProjectAsset(prizeImagePath);
    image.alt = copyOr(`prize.${prize.prizeId}`, text({ zh: prize.nameZh, en: prize.nameEn }));
    image.onerror = () => {
      elements.prizeImage.classList.remove("has-image");
      elements.prizeImage.replaceChildren();
      const placeholder = document.createElement("span");
      placeholder.textContent = copyOr("redemption.placeholder", state.language === "zh" ? "獎品圖片尚未提供" : "Prize image not yet available");
      elements.prizeImage.append(placeholder);
    };
    elements.prizeImage.append(image);
    elements.prizeImage.classList.add("has-image");
  } else {
    elements.prizeImage.hidden = false;
    const placeholder = document.createElement("span");
    placeholder.textContent = copyOr("redemption.placeholder", state.language === "zh" ? "獎品圖片尚未提供" : "Prize image not yet available");
    elements.prizeImage.append(placeholder);
  }

  const greenVersion = allocation.sustainabilityRewardEligible === true;
  elements.redemption.classList.toggle("is-sustainable", greenVersion);
  elements.redemption.classList.toggle("is-non-sustainable", !greenVersion);
  elements.prizeImage.classList.toggle("is-non-sustainable", !greenVersion);
  if (allocationPaused) {
    elements.redemptionTitle.textContent = "";
    elements.redemptionTitle.hidden = true;
  } else {
    elements.redemptionTitle.hidden = false;
    elements.redemptionTitle.textContent = copy
      ? copyOr("v2.redemptionTitle", state.language === "zh" ? "恭喜獲得" : "Congratulations, you got")
      : (state.language === "zh" ? "請至攤位領取Garmin周邊" : "Please collect your Garmin merchandise at the booth");
  }

  if (greenVersion) {
    elements.sustainabilityMessage.hidden = false;
    elements.sustainabilityMessage.textContent = copyOr("v2.sustainabilityMessage", state.language === "zh"
      ? "謝謝你一起響應自帶補水行動｜另可領取永續行動貼紙與飄帶"
      : "Thank you for supporting reusable hydration | You may also receive a sustainability sticker and ribbon")
      .replace(/\s*[｜|]\s*/, "\n");
  } else {
    elements.sustainabilityMessage.hidden = true;
    elements.sustainabilityMessage.textContent = "";
  }
  const redemptionInstruction = document.querySelector(".redemption-instruction");
  if (allocationPaused && redemptionInstruction) {
    redemptionInstruction.hidden = true;
  } else if (redemptionInstruction) {
    redemptionInstruction.hidden = false;
    redemptionInstruction.textContent = copyOr("v2.redemptionInstruction", state.language === "zh"
      ? "請至攤位找工作人員領取 Garmin 周邊"
      : "Please visit the booth to collect Garmin merchandise from a staff member");
  }
  showScreen(elements.redemption);
}
