import { getSpecialSkinById } from "./specialSkins";

// Character creator: gender x skin tone x hair color = 24 combinations.
// Explicit lookup table rather than building the filename algorithmically,
// because the source art used inconsistent prefixes for "medium" skin tone
// (boy files use "bw", girl files use "wb") - a lookup table sidesteps
// that inconsistency entirely rather than trying to encode it as a rule.

export const GENDERS = [
  { id: "boy", swatch: "/swatches/gender-boy.png" },
  { id: "girl", swatch: "/swatches/gender-girl.png" },
];

export const SKIN_TONES = [
  { id: "light", swatch: "/swatches/skin-light.png" },
  { id: "medium", swatch: "/swatches/skin-medium.png" },
  { id: "dark", swatch: "/swatches/skin-dark.png" },
];

export const HAIR_COLORS = [
  { id: "blonde", swatch: "/swatches/hair-blonde.png" },
  { id: "red", swatch: "/swatches/hair-red.png" },
  { id: "brown", swatch: "/swatches/hair-brown.png" },
  { id: "black", swatch: "/swatches/hair-black.png" },
];

const CHARACTER_FILES = {
  boy: {
    light: { black: "wboy-black", blonde: "wboy-blonde", brown: "wboy-brown", red: "wboy-red" },
    medium: { black: "bwboy-black", blonde: "bwboy-blonde", brown: "bwboy-brown", red: "bwboy-red" },
    dark: { black: "bboy-black", blonde: "bboy-blonde", brown: "bboy-brown", red: "bboy-red" },
  },
  girl: {
    light: { black: "wgirl-black", blonde: "wgirl-blonde", brown: "wgirl-brown", red: "wgirl-red" },
    medium: { black: "wbgirl-black", blonde: "wbgirl-blonde", brown: "wbgirl-brown", red: "wbgirl-red" },
    dark: { black: "bgirl-black", blonde: "bgirl-blonde", brown: "bgirl-brown", red: "bgirl-red" },
  },
};

// The stored "character key" (persisted on the profile) is just
// "gender-skinTone-hairColor", e.g. "boy-medium-red" - readable, and easy
// to parse back into its three parts for the picker's initial state.
export function makeCharacterKey(gender, skinTone, hairColor) {
  return `${gender}-${skinTone}-${hairColor}`;
}

export function parseCharacterKey(key) {
  const [gender, skinTone, hairColor] = (key || "").split("-");
  return { gender, skinTone, hairColor };
}

export function getCharacterImage(characterKey) {
  // Special reward skins (single fixed designs, e.g. "pirate1") take
  // priority - only fall back to parsing "gender-skinTone-hairColor" if
  // the key isn't one of those.
  const special = getSpecialSkinById(characterKey);
  if (special) return special.image;

  const { gender, skinTone, hairColor } = parseCharacterKey(characterKey);
  const file = CHARACTER_FILES[gender]?.[skinTone]?.[hairColor];
  // Fallback to a known-good default if the key is missing/invalid
  // (e.g. first run, before a profile has ever equipped a character).
  return file ? `/characters/${file}.png` : "/characters/wboy-blonde.png";
}

export const DEFAULT_CHARACTER_KEY = makeCharacterKey("boy", "light", "blonde");

// Island art (unrelated to the character creator, kept here since it was
// already colocated with SKINS before this refactor).
export const ISLAND_IMAGES = ["/islands/island-0.png", "/islands/island-1.png", "/islands/island-2.png", "/islands/island-3.png"];
export const BIG_ISLAND_IMAGES = ["/islands/big-island-0.png", "/islands/big-island-1.png", "/islands/big-island-2.png"];
