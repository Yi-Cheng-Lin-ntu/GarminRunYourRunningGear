const equipmentCatalog = Object.freeze({
  hydrationVest: Object.freeze({
    src: "./assets/waterequip/Garmin水袋背心.png",
    alt: { zh: "Garmin 水袋背心", en: "Garmin hydration vest" }
  }),
  softFlask: Object.freeze({
    src: "./assets/waterequip/Garmin軟水壺.png",
    alt: { zh: "Garmin 軟水壺", en: "Garmin soft flask" }
  }),
  softCup: Object.freeze({
    src: "./assets/waterequip/Garmin軟水杯.png",
    alt: { zh: "Garmin 軟水杯", en: "Garmin soft cup" }
  })
});

const equipmentByRecommendation = Object.freeze({
  "experience:precision": ["hydrationVest"],
  "experience:rest": ["softCup"],
  "experience:pioneer": [],
  "lifestyle:precision": ["softFlask", "hydrationVest"],
  "lifestyle:rest": ["softCup"],
  "lifestyle:pioneer": [],
  "performance:precision": ["softCup"],
  "performance:rest": ["softCup"],
  "performance:pioneer": []
});

export function getHydrationEquipment(runnerType, hydrationStyle) {
  const ids = equipmentByRecommendation[`${runnerType}:${hydrationStyle}`] || [];
  return ids.map((id) => ({ id, ...equipmentCatalog[id] }));
}
