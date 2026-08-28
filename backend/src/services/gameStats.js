/**
 * Derives gamification stats from task data. Nothing here is persisted -
 * it's recomputed on every request from the same tasks/criticalPath that
 * the CPM algorithm already produced, so there's exactly one source of
 * truth (the Task rows), not two.
 *
 * RULES (documented here because they belong in the thesis write-up too):
 *   - XP: critical-path tasks are worth more per day of duration (10/day)
 *     than non-critical tasks (5/day), because they represent tasks that
 *     genuinely cannot slip without delaying the whole project.
 *   - Level: every 50 XP is one level.
 *   - Character selection is free (no unlock gating) - a per-project
 *     preference (see Project.equippedCharacter in schema).
 *   - OBJECT rewards (accessories): points-based. Both critical and
 *     non-critical completed tasks contribute, critical worth double,
 *     so non-critical tasks have a real purpose in the game layer too.
 *     Threshold: 10 points per object.
 *   - SKIN rewards: a SEPARATE track, not computed here - see
 *     dailyGoal.js (longestStreak) and services/rewards.js
 *     (ensureSkinRewardsGranted). Every 5 days of streak = 1 new skin.
 */

const XP_PER_DAY_CRITICAL = 10;
const XP_PER_DAY_NON_CRITICAL = 5;
const XP_PER_LEVEL = 50;

const CRITICAL_OBJECT_POINTS = 2;
const NON_CRITICAL_OBJECT_POINTS = 1;
const POINTS_PER_OBJECT = 10;

function computeGameStats(tasks, criticalPath) {
  const doneTasks = tasks.filter((t) => t.status === "done");
  const criticalDone = doneTasks.filter((t) => criticalPath.includes(t.id));
  const nonCriticalDone = doneTasks.filter((t) => !criticalPath.includes(t.id));

  const xp =
    criticalDone.reduce((sum, t) => sum + t.duration * XP_PER_DAY_CRITICAL, 0) +
    nonCriticalDone.reduce((sum, t) => sum + t.duration * XP_PER_DAY_NON_CRITICAL, 0);

  const level = Math.floor(xp / XP_PER_LEVEL) + 1;

  const pathProgress = criticalPath.length > 0 ? (criticalDone.length / criticalPath.length) * 100 : 0;

  const objectPoints =
    criticalDone.length * CRITICAL_OBJECT_POINTS + nonCriticalDone.length * NON_CRITICAL_OBJECT_POINTS;
  const objectsEarned = Math.floor(objectPoints / POINTS_PER_OBJECT);
  const pointsUntilNextObject = POINTS_PER_OBJECT - (objectPoints % POINTS_PER_OBJECT);

  return {
    xp,
    level,
    criticalCompleted: criticalDone.length,
    totalCritical: criticalPath.length,
    nonCriticalCompleted: nonCriticalDone.length,
    pathProgress,
    objectsEarned,
    pointsUntilNextObject,
    pointsPerObject: POINTS_PER_OBJECT,
  };
}

module.exports = { computeGameStats };
