const equipmentCatalog = Object.freeze({
  hydrationVest: Object.freeze({
    src: "./assets/waterequip/Garmin水袋背心.png",
    altKey: "equipment.hydrationVest"
  }),
  softFlask: Object.freeze({
    src: "./assets/waterequip/Garmin軟水壺.png",
    altKey: "equipment.softFlask"
  }),
  softCup: Object.freeze({
    src: "./assets/waterequip/Garmin軟水杯.png",
    altKey: "equipment.softCup"
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
