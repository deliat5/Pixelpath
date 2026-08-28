/**
 * Daily task recommendation.
 *
 * WHY THIS EXISTS:
 * CPM tells us WHICH tasks are critical, but the user still needs to know
 * "what should I actually do today?" This is a small greedy algorithm that
 * ranks all not-yet-done tasks by urgency, using the CPM output directly -
 * it does not recompute anything, it just orders what computeCPM() already gave us.
 *
 * RANKING RULE (in priority order):
 *   1. Lower slack first (0 slack = critical = most urgent).
 *      Rationale: a task with 0 slack cannot be delayed at all without
 *      delaying the whole project; a task with high slack has "buffer".
 *   2. Among tasks with equal slack, longer duration first.
 *      Rationale: long tasks are riskier to start late (less room for
 *      unexpected delays), so all else being equal, start them sooner.
 *
 * This is a classic greedy heuristic used in real-world scheduling
 * (similar in spirit to "shortest slack first" / "critical ratio"
 * scheduling rules from operations research).
 *
 * COMPLEXITY: O(n log n), dominated by the sort.
 *
 * INPUT:
 *   cpmTasks = output of computeCPM(...).tasks, i.e. tasks already
 *   annotated with { slack, isCritical, duration, status, ... }
 *
 * OUTPUT:
 *   Array of tasks (same shape as input), filtered to status !== "done",
 *   sorted from most to least urgent.
 */

function recommendDailyTasks(cpmTasks) {
  const pending = cpmTasks.filter((task) => task.status !== "done");

  const ranked = [...pending].sort((a, b) => {
    if (a.slack !== b.slack) {
      return a.slack - b.slack; // lower slack = more urgent = comes first
    }
    return b.duration - a.duration; // tie-break: longer task first
  });

  return ranked;
}

module.exports = { recommendDailyTasks };
