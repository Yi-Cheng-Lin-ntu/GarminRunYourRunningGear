import { DEMO_MODE, getVoteCounts, submitVote, subscribeToVotes } from "./voteData.js";

const options = ["try", "watch", "pioneer"];
const storageKey = "garmin-run-hydration-vote";
const MAX_VISUAL_PARTICLES = 100;
const PARTICLE_MIN_SIZE = 18;
const PARTICLE_MAX_SIZE = 29;
const refreshInterval = 30000;

const copy = {
  zh: {
    back: "返回跑者結果",
    eyebrow: "RUN TOGETHER",
    title: "下一場，帶上自己的水",
    description: "每個人的選擇，都會成為跑者一起累積的行動。",
    totalSuffix: "位跑者已留下選擇",
    tryTitle: "願意嘗試自帶補水容器",
    tryDescription: "下一場跑步，我想試著自己帶水。",
    watchTitle: "再觀望一下",
    watchDescription: "我想先了解更多，再決定怎麼做。",
    pioneerTitle: "我已經是自帶補水容器的永續先鋒隊",
    pioneerDescription: "自帶補水容器，已經是我的跑步習慣。",
    tryCountLabel: "位跑者",
    watchCountLabel: "位跑者",
    pioneerCountLabel: "位跑者",
    connecting: "正在連線",
    realtime: "即時更新中",
    polling: "即時更新暫停・定期更新中",
    demo: "DEMO 測試模式",
    waiting: "正在送出選擇…",
    thanks: "謝謝你的選擇",
    tryThanks: "又多了一位願意一起嘗試的跑者。",
    confirmed: "你的選擇已加入。",
    unavailable: "目前無法更新即時投票資料，請稍後再試。",
    voteError: "投票沒有成功送出，請稍後再試。"
  },
  en: {
    back: "Back to your result",
    eyebrow: "RUN TOGETHER",
    title: "Bring your own water next time",
    description: "Every choice adds to an action we build together.",
    totalSuffix: "runners have shared a choice",
    tryTitle: "I am willing to bring my own hydration container",
    tryDescription: "Next run, I want to try bringing my own water.",
    watchTitle: "I would like to wait and see",
    watchDescription: "I want to learn more before I decide.",
    pioneerTitle: "I am already a pioneer who brings my own hydration container",
    pioneerDescription: "Bringing my own hydration container is already part of my running routine.",
    tryCountLabel: "runners",
    watchCountLabel: "runners",
    pioneerCountLabel: "runners",
    connecting: "Connecting",
    realtime: "Live updates on",
    polling: "Live updates paused · checking periodically",
    demo: "DEMO MODE",
    waiting: "Submitting your choice…",
    thanks: "Thanks for sharing your choice.",
    tryThanks: "One more runner is willing to give it a try.",
    confirmed: "Your choice has been added.",
    unavailable: "Live vote data is unavailable right now. Please try again later.",
    voteError: "Your vote could not be submitted. Please try again later."
  }
};

const elements = {
  connection: document.querySelector("[data-vote-connection]"),
  total: document.querySelector("[data-vote-total]"),
  demo: document.querySelector("[data-vote-demo]"),
  options: document.querySelector("[data-vote-options]"),
  particles: document.querySelector("[data-vote-particles]"),
  vessel: document.querySelector("[data-vote-vessel]"),
  feedback: document.querySelector("[data-vote-feedback]")
};

const state = {
  language: "zh",
  counts: null,
  available: false,
  votedOption: null,
  selectedOption: null,
  busy: false,
  refreshing: false,
  pendingAnimationOption: null,
  particleCount: 0,
  particlesRendered: false,
  pendingParticleRender: false,
  particleLayoutWidth: 0,
  particleLayoutHeight: 0,
  initialized: false
};

function currentCopy() {
  return copy[state.language];
}

function formatNumber(value) {
  return new Intl.NumberFormat(state.language === "zh" ? "zh-TW" : "en").format(value);
}

function setConnection(key) {
  elements.connection.dataset.status = key;
  elements.connection.textContent = currentCopy()[key] || "";
  elements.connection.classList.toggle("is-offline", key === "polling");
}

function setFeedback(key) {
  elements.feedback.dataset.message = key;
  elements.feedback.textContent = currentCopy()[key] || "";
  elements.feedback.classList.toggle("is-error", key === "unavailable" || key === "voteError");
}

function animateNumber(element, start, end) {
  if (element.countAnimation) {
    cancelAnimationFrame(element.countAnimation);
  }

  const duration = 420;
  const startedAt = performance.now();
  const tick = (now) => {
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    element.textContent = formatNumber(Math.round(start + (end - start) * eased));
    if (progress < 1) {
      element.countAnimation = requestAnimationFrame(tick);
    }
  };
  element.countAnimation = requestAnimationFrame(tick);
}

function updateNumber(element, oldValue, newValue) {
  if (oldValue === null) {
    element.textContent = formatNumber(newValue);
    return;
  }
  if (oldValue !== newValue) {
    animateNumber(element, oldValue, newValue);
  }
}

function getParticleCounts(counts, particleCount) {
  const total = options.reduce((sum, option) => sum + counts[option], 0);
  if (total === 0 || particleCount === 0) {
    return Object.fromEntries(options.map((option) => [option, 0]));
  }

  const exactCounts = options.map((option) => (counts[option] / total) * particleCount);
  const allocated = exactCounts.map(Math.floor);
  const remaining = particleCount - allocated.reduce((sum, count) => sum + count, 0);
  const remainderOrder = exactCounts
    .map((value, index) => ({ index, remainder: value - allocated[index] }))
    .sort((left, right) => right.remainder - left.remainder);

  for (let index = 0; index < remaining; index += 1) {
    allocated[remainderOrder[index].index] += 1;
  }

  return Object.fromEntries(options.map((option, index) => [option, allocated[index]]));
}

function makeRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function fillRatioForVotes(total) {
  const stages = [
    [0, 0],
    [10, 0.15],
    [50, 0.3],
    [100, 0.5],
    [200, 0.7],
    [500, 0.95]
  ];
  const nextStageIndex = stages.findIndex(([votes]) => total <= votes);
  if (nextStageIndex <= 0) {
    return total === 0 ? 0 : stages[1][1] * (total / stages[1][0]);
  }
  if (nextStageIndex === -1) {
    return 0.97;
  }

  const [lowerVotes, lowerRatio] = stages[nextStageIndex - 1];
  const [upperVotes, upperRatio] = stages[nextStageIndex];
  const progress = (total - lowerVotes) / (upperVotes - lowerVotes);
  return lowerRatio + (upperRatio - lowerRatio) * progress;
}

function makeParticleColors(counts, particleCount, incomingOption) {
  if (!particleCount) {
    return [];
  }

  const allocated = getParticleCounts(counts, particleCount);
  const colors = options.flatMap((option) => Array(allocated[option]).fill(option));
  const random = makeRandom(0x51a7c0de);
  for (let index = colors.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [colors[index], colors[swapIndex]] = [colors[swapIndex], colors[index]];
  }

  if (incomingOption) {
    colors[particleCount - 1] = incomingOption;
  }
  return colors;
}

function packParticles(counts, particleCount, width, height) {
  const random = makeRandom(0x74a1b00b);
  const particles = [];

  for (let index = 0; index < particleCount; index += 1) {
    const size = PARTICLE_MIN_SIZE + random() * (PARTICLE_MAX_SIZE - PARTICLE_MIN_SIZE);
    const radius = size / 2;
    let bestCandidate = null;

    for (let attempt = 0; attempt < 28; attempt += 1) {
      const x = radius + random() * Math.max(0, width - radius * 2);
      let y = radius;

      for (const support of particles) {
        const horizontalDistance = Math.abs(x - support.x);
        const restingDistance = (radius + support.radius) * 0.78;
        if (horizontalDistance < restingDistance) {
          const verticalDistance = Math.sqrt(restingDistance ** 2 - horizontalDistance ** 2);
          y = Math.max(y, support.y + verticalDistance);
        }
      }

      const score = y + random() * radius * 0.8;
      if (!bestCandidate || score < bestCandidate.score) {
        bestCandidate = { x, y, score };
      }
    }

    particles.push({
      x: bestCandidate.x,
      y: bestCandidate.y,
      size,
      radius,
      rotation: random() * 30 - 15,
      depth: random(),
      opacity: [0.75, 0.82, 0.9, 0.95][Math.floor(random() * 4)]
    });
  }

  const naturalHeight = particles.reduce((highest, particle) =>
    Math.max(highest, particle.y + particle.radius), 0
  );
  const maxRadius = PARTICLE_MAX_SIZE / 2;
  const targetHeight = Math.min(
    height,
    Math.max(maxRadius * 2 + 2, height * fillRatioForVotes(options.reduce((sum, option) => sum + counts[option], 0)))
  );
  const verticalScale = naturalHeight > maxRadius
    ? (targetHeight - maxRadius) / (naturalHeight - maxRadius)
    : 1;

  return particles.map((particle) => ({
    ...particle,
    y: Math.min(
      targetHeight - particle.radius,
      Math.max(particle.radius, particle.radius + (particle.y - particle.radius) * verticalScale)
    )
  }));
}

function renderParticles(counts, animateOption = null) {
  const total = options.reduce((sum, option) => sum + counts[option], 0);
  const particleCount = Math.min(total, MAX_VISUAL_PARTICLES);
  const bounds = elements.particles.getBoundingClientRect();
  if (!bounds.width || !bounds.height) {
    state.pendingParticleRender = true;
    return;
  }

  const width = bounds.width;
  const height = bounds.height;
  const enteringFrom = state.particleCount;
  const isInitialRender = !state.particlesRendered;
  const colors = makeParticleColors(counts, particleCount, animateOption);
  const particles = packParticles(counts, particleCount, width, height);

  elements.particles.replaceChildren();
  particles.forEach((item, index) => {
    const particle = document.createElement("span");
    const isNewParticle = animateOption && index >= enteringFrom;
    const animateAtCapacity = animateOption && particleCount === enteringFrom && index === particleCount - 1;
    const shouldAnimate = isInitialRender || isNewParticle || animateAtCapacity;

    particle.className = `vessel-particle vessel-particle-${colors[index]}`;
    particle.style.left = `${item.x}px`;
    particle.style.bottom = `${item.y - item.radius}px`;
    particle.style.zIndex = String(Math.round(item.depth * 70 + (item.y / height) * 30));
    particle.style.opacity = String(item.opacity);
    particle.style.setProperty("--particle-size", `${item.size}px`);
    particle.style.setProperty("--particle-rotation", `${item.rotation}deg`);
    particle.style.setProperty("--drop-distance", `${Math.max(36, height - item.y + item.radius)}px`);

    if (shouldAnimate) {
      particle.classList.add("is-dropping");
      particle.style.animationDelay = isInitialRender ? `${index * 3}ms` : `${Math.max(0, index - enteringFrom) * 35}ms`;
    }
    elements.particles.append(particle);
  });

  state.particleCount = particleCount;
  state.particlesRendered = true;
  state.pendingParticleRender = false;
  state.particleLayoutWidth = width;
  state.particleLayoutHeight = height;
  elements.vessel.setAttribute("aria-label", `${formatNumber(total)} ${currentCopy().totalSuffix}`);
}

function changedOption(previous, next) {
  if (!previous) {
    return null;
  }
  return options.find((option) => next[option] > previous[option]) || null;
}

function updateVoteButtons() {
  elements.options.querySelectorAll("[data-vote-option]").forEach((button) => {
    const option = button.dataset.voteOption;
    const selected = (state.votedOption || state.selectedOption) === option;
    button.disabled = state.busy || state.votedOption !== null || !state.available;
    button.classList.toggle("is-selected", selected);
    button.classList.toggle("is-loading", state.busy && state.selectedOption === option);
    button.setAttribute("aria-pressed", String(selected));
    button.setAttribute("aria-busy", String(state.busy && state.selectedOption === option));
  });
}

function renderCounts(nextCounts, preferredOption = null) {
  const previous = state.counts;
  const previousTotal = previous
    ? options.reduce((sum, option) => sum + previous[option], 0)
    : null;
  const nextTotal = options.reduce((sum, option) => sum + nextCounts[option], 0);

  updateNumber(elements.total, previousTotal, nextTotal);
  for (const option of options) {
    updateNumber(
      elements.options.querySelector(`[data-vote-count="${option}"]`),
      previous ? previous[option] : null,
      nextCounts[option]
    );
  }

  state.counts = nextCounts;
  renderParticles(nextCounts, preferredOption || changedOption(previous, nextCounts));
}

async function refreshCounts(preferredOption = null) {
  if (state.refreshing) {
    state.pendingAnimationOption = preferredOption || state.pendingAnimationOption;
    return;
  }

  state.refreshing = true;
  try {
    const counts = await getVoteCounts();
    if (options.some((option) => !Number.isInteger(counts[option]) || counts[option] < 0)) {
      throw new Error("投票資料格式不正確。");
    }
    state.available = true;
    renderCounts(counts, preferredOption);
    setFeedback(state.votedOption ? (state.votedOption === "try" ? "tryThanks" : "thanks") : "");
    updateVoteButtons();
  } catch {
    state.available = false;
    setFeedback("unavailable");
    updateVoteButtons();
  } finally {
    state.refreshing = false;
    if (state.pendingAnimationOption) {
      const nextOption = state.pendingAnimationOption;
      state.pendingAnimationOption = null;
      void refreshCounts(nextOption);
    }
  }
}

function readSavedVote() {
  try {
    const savedVote = localStorage.getItem(storageKey);
    return options.includes(savedVote) ? savedVote : null;
  } catch {
    return null;
  }
}

function rememberVote(option) {
  state.votedOption = option;
  try {
    localStorage.setItem(storageKey, option);
  } catch {
    // Keep the vote locked for this page session if browser storage is unavailable.
  }
}

async function castVote(option) {
  if (!state.available || state.busy || state.votedOption) {
    return;
  }

  state.busy = true;
  state.selectedOption = option;
  setFeedback("waiting");
  updateVoteButtons();

  try {
    await submitVote(option);
    rememberVote(option);
    state.busy = false;
    state.selectedOption = null;
    updateVoteButtons();
    setFeedback(option === "try" ? "tryThanks" : "confirmed");
    await refreshCounts(option);
  } catch {
    state.busy = false;
    state.selectedOption = null;
    setFeedback("voteError");
    updateVoteButtons();
  }
}

function updateLanguage() {
  const strings = currentCopy();
  document.querySelectorAll("[data-vote-text]").forEach((element) => {
    element.textContent = strings[element.dataset.voteText];
  });
  elements.options.setAttribute("aria-label", state.language === "zh" ? "選擇你的補水行動" : "Choose your hydration action");
  elements.demo.textContent = strings.demo;
  elements.connection.textContent = elements.connection.dataset.status
    ? strings[elements.connection.dataset.status]
    : "";

  if (state.counts) {
    elements.total.textContent = formatNumber(options.reduce((sum, option) => sum + state.counts[option], 0));
    for (const option of options) {
      elements.options.querySelector(`[data-vote-count="${option}"]`).textContent = formatNumber(state.counts[option]);
    }
    renderParticles(state.counts);
  }

  if (elements.feedback.dataset.message) {
    elements.feedback.textContent = strings[elements.feedback.dataset.message];
  }
}

function setLocalizedFeedback(key) {
  elements.feedback.dataset.message = key;
  setFeedback(key);
}

function setLocalizedConnection(key) {
  elements.connection.dataset.status = key;
  setConnection(key);
}

export function setHydrationVoteLanguage(language) {
  state.language = language === "en" ? "en" : "zh";
  updateLanguage();
}

export async function initializeHydrationVote() {
  if (state.initialized) {
    return;
  }
  state.initialized = true;
  state.votedOption = readSavedVote();
  elements.demo.hidden = !DEMO_MODE;
  updateLanguage();
  updateVoteButtons();

  elements.options.addEventListener("click", (event) => {
    const button = event.target.closest("[data-vote-option]");
    if (button) {
      void castVote(button.dataset.voteOption);
    }
  });

  if ("ResizeObserver" in window) {
    const particleObserver = new ResizeObserver(() => {
      if (state.pendingParticleRender && state.counts) {
        renderParticles(state.counts);
      }
    });
    particleObserver.observe(elements.particles);
  } else {
    window.addEventListener("resize", () => {
      if (state.pendingParticleRender && state.counts) {
        renderParticles(state.counts);
      }
    });
  }

  if (state.votedOption) {
    setLocalizedFeedback(state.votedOption === "try" ? "tryThanks" : "thanks");
  }

  setLocalizedConnection(DEMO_MODE ? "demo" : "connecting");
  await refreshCounts();

  if (!DEMO_MODE) {
    void subscribeToVotes((vote) => {
      if (options.includes(vote.option)) {
        void refreshCounts(vote.option);
      }
    }, (status) => {
      if (status === "SUBSCRIBED") {
        setLocalizedConnection("realtime");
      } else {
        setLocalizedConnection("polling");
      }
    }).catch(() => setLocalizedConnection("polling"));

    window.setInterval(() => void refreshCounts(), refreshInterval);
  }
}