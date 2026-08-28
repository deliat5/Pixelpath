// Reward item definitions. `id` MUST match a key in
// backend/src/services/rewards.js (REWARD_ITEM_KEYS) - the backend grants
// items by these keys, this file only owns how to display them.
export const OUTFITS = [
  { id: "effect-stars", name: "Stelute", image: "/outfits/effect-stars.png" },
  { id: "effect-hearts", name: "Inimioare", image: "/outfits/effect-hearts.png" },
  { id: "accessory-sunglasses", name: "Ochelari de soare", image: "/outfits/accessory-sunglasses.png" },
  { id: "hand-flower", name: "Floare", image: "/outfits/hand-flower.png" },
];

export function getOutfitById(id) {
  return OUTFITS.find((o) => o.id === id) || null;
}
