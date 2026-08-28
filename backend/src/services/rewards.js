const prisma = require("../prismaClient");

// Keep in sync with frontend/src/outfits.js - only the keys are needed
// here (to persist which item was won and pick randomly); the frontend
// owns the display data (image path, name).
const OBJECT_ITEM_KEYS = ["effect-stars", "effect-hearts", "accessory-sunglasses", "hand-flower"];

// Bonus/special characters, earned via streak (see dailyGoal.js). Keep in
// sync with frontend/src/specialSkins.js.
const SKIN_ITEM_KEYS = ["explorer", "pirate1", "pirate2", "mermaid"];

async function grantFromPool(projectId, type, poolKeys, targetCount) {
  if (poolKeys.length === 0) return; // nothing to grant yet (e.g. skins, no art)

  const existing = await prisma.projectReward.findMany({ where: { projectId, type } });
  const missing = targetCount - existing.length;
  if (missing <= 0) return;

  const wonKeys = new Set(existing.map((r) => r.itemKey));

  for (let i = 0; i < missing; i++) {
    const notYetWon = poolKeys.filter((key) => !wonKeys.has(key));
    const pool = notYetWon.length > 0 ? notYetWon : poolKeys;
    const chosen = pool[Math.floor(Math.random() * pool.length)];

    await prisma.projectReward.create({ data: { projectId, type, itemKey: chosen } });
    wonKeys.add(chosen);
  }
}

/**
 * OBJECT rewards (accessories) - grants any newly-earned-but-not-yet-won
 * items, based on the points threshold in gameStats.js.
 */
function ensureObjectRewardsGranted(projectId, objectsEarned) {
  return grantFromPool(projectId, "object", OBJECT_ITEM_KEYS, objectsEarned);
}

/**
 * SKIN rewards (bonus characters) - one granted per 5 days of the
 * project's LONGEST-EVER streak (see dailyGoal.js:computeLongestStreak).
 * No-ops until SKIN_ITEM_KEYS has entries.
 */
const STREAK_DAYS_PER_SKIN = 5;

function ensureSkinRewardsGranted(projectId, longestStreak) {
  const skinsEarned = Math.floor(longestStreak / STREAK_DAYS_PER_SKIN);
  return grantFromPool(projectId, "skin", SKIN_ITEM_KEYS, skinsEarned);
}

function getProjectRewards(projectId, type) {
  return prisma.projectReward.findMany({ where: { projectId, type }, orderBy: { wonAt: "asc" } });
}

module.exports = {
  ensureObjectRewardsGranted,
  ensureSkinRewardsGranted,
  getProjectRewards,
  STREAK_DAYS_PER_SKIN,
  OBJECT_ITEM_KEYS,
  SKIN_ITEM_KEYS,
};
