import basicPack from "../assets/BasicPack.png";
import silverPack from "../assets/SilverPack.png";
import goldPack from "../assets/GoldPack.png";
import elitePack from "../assets/ElitePack.png";

function normalizePackName(packInput) {
  if (typeof packInput === "string") {
    return packInput.toLowerCase();
  }

  return String(packInput?.name || "").toLowerCase();
}

export function getPackVisual(packInput) {
  const name = normalizePackName(packInput);

  if (name.includes("elite")) {
    return {
      image: elitePack,
      tier: "elite",
      focusLabel: "Icon Hunt",
      tagline: "Highest chance at elite and icon-level stars."
    };
  }

  if (name.includes("gold")) {
    return {
      image: goldPack,
      tier: "gold",
      focusLabel: "Legend Push",
      tagline: "Built for stronger epics, legends, and dream upgrades."
    };
  }

  if (name.includes("silver")) {
    return {
      image: silverPack,
      tier: "silver",
      focusLabel: "Breakout Talent",
      tagline: "A smart balance of rares, epics, and squad depth."
    };
  }

  return {
    image: basicPack,
    tier: "basic",
    focusLabel: "Club Starter",
    tagline: "Low-cost pack opening for early club growth."
  };
}

export function getHighestRarity(cards = []) {
  const rarityOrder = ["icon", "legendary", "epic", "rare", "common"];

  for (const rarity of rarityOrder) {
    if (cards.some((card) => String(card?.rarity || "").toLowerCase() === rarity)) {
      return rarity;
    }
  }

  return "common";
}
