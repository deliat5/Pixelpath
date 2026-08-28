/**
 * Daily goal + streak.
 *
 * DESIGN NOTE:
 * The "goal for today" is simply the top result of the greedy
 * recommendDailyTasks algorithm (already built - see algorithms/dailyRecommendation.js).
 * Nothing new is computed here for the suggestion itself; this module just
 * surfaces it and adds streak tracking on top.
 *
 * SIMPLIFICATION (worth stating explicitly, e.g. in defense Q&A):
 * completing the streak does NOT require finishing the exact suggested
 * task - completing ANY task on a given day keeps the streak alive. A
 * stricter rule (only the suggested task counts) would be more "pure" but
 * would punish a user for reasonably choosing to do a different urgent
 * task that day, which is bad UX for no real benefit.
 */

const { recommendDailyTasks } = require("../algorithms/dailyRecommendation");

function toDateString(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function computeStreak(tasks) {
  const doneDates = new Set(
    tasks
      .filter((t) => t.status === "done" && t.completedAt)
      .map((t) => toDateString(t.completedAt))
  );

  let streak = 0;
  const cursor = new Date();

  // If nothing was completed today yet, the streak isn't broken until the
  // day ends - so we start counting from yesterday instead of resetting
  // to 0 the moment midnight passes with no activity yet.
  if (!doneDates.has(toDateString(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (doneDates.has(toDateString(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/**
 * The longest consecutive-day run EVER achieved (not just the current
 * active streak). Skin rewards (see services/rewards.js) are granted
 * based on this, not the current streak - otherwise breaking a streak
 * later would make earlier-earned skins impossible to re-derive, and a
 * "grant the difference" approach (like the object-reward system) would
 * try to grant a negative amount and just silently do nothing, which is
 * fine, but only if the number never regresses. Using the historical max
 * guarantees that.
 */
function computeLongestStreak(tasks) {
  const doneDates = [
    ...new Set(
      tasks.filter((t) => t.status === "done" && t.completedAt).map((t) => toDateString(t.completedAt))
    ),
  ].sort();

  if (doneDates.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < doneDates.length; i++) {
    const prev = new Date(doneDates[i - 1]);
    const curr = new Date(doneDates[i]);
    const dayGap = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

    if (dayGap === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

function computeDailyGoal(cpmTasks) {
  const recommended = recommendDailyTasks(cpmTasks);
  const goalTask = recommended[0] || null;

  const today = toDateString(new Date());
  const goalMetToday = cpmTasks.some(
    (t) => t.status === "done" && t.completedAt && toDateString(t.completedAt) === today
  );

  return {
    goalTask,
    goalMetToday,
    streak: computeStreak(cpmTasks),
    longestStreak: computeLongestStreak(cpmTasks),
  };
}

module.exports = { computeDailyGoal, computeStreak, computeLongestStreak };
