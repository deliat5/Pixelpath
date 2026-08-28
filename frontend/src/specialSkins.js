// Special/bonus character skins, earned via streak rewards (see
// backend/src/services/rewards.js SKIN_ITEM_KEYS - ids must match).
// Unlike the free base 24 (gender x skin tone x hair color, see skins.js),
// each of these is a single fixed design, not a combination.
export const SPECIAL_SKINS = [
  { id: "explorer", name: "Explorator", image: "/special-skins/explorer.png" },
  { id: "pirate1", name: "Pirat", image: "/special-skins/pirate1.png" },
  { id: "pirate2", name: "Capitan Pirat", image: "/special-skins/pirate2.png" },
  { id: "mermaid", name: "Sirena", image: "/special-skins/mermaid.png" },
];

export function getSpecialSkinById(id) {
  return SPECIAL_SKINS.find((s) => s.id === id) || null;
}

export function isSpecialSkin(id) {
  return SPECIAL_SKINS.some((s) => s.id === id);
}
