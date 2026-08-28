/**
 * Demo script - run this with: node src/algorithms/demo.js
 *
 * It builds a small sample project (5 tasks) and shows what each algorithm
 * produces. Use this to sanity-check the algorithms and as a reference
 * example for the documentation chapter.
 *
 * Sample graph:
 *
 *   A (3 days) --> C (4 days) --\
 *                                 --> E (2 days)
 *   B (2 days) --> D (1 day)  --/
 *
 * Expected critical path: A -> C -> E  (3 + 4 + 2 = 9 days)
 * B -> D -> E is shorter (2 + 1 + 2 = 5 days), so B and D have slack.
 */

const { topologicalSort } = require("./topologicalSort");
const { computeCPM } = require("./cpm");
const { recommendDailyTasks } = require("./dailyRecommendation");

const tasks = [
  { id: 1, title: "A", duration: 3, status: "todo", dependencies: [] },
  { id: 2, title: "B", duration: 2, status: "todo", dependencies: [] },
  { id: 3, title: "C", duration: 4, status: "todo", dependencies: [1] },
  { id: 4, title: "D", duration: 1, status: "todo", dependencies: [2] },
  { id: 5, title: "E", duration: 2, status: "todo", dependencies: [3, 4] },
];

console.log("--- Topological order ---");
console.log(topologicalSort(tasks));

console.log("\n--- CPM result ---");
const cpmResult = computeCPM(tasks);
console.log("Project duration:", cpmResult.projectDuration);
console.log("Critical path (task ids):", cpmResult.criticalPath);
console.table(
  cpmResult.tasks.map((t) => ({
    id: t.id,
    title: t.title,
    duration: t.duration,
    earliestStart: t.earliestStart,
    earliestFinish: t.earliestFinish,
    latestStart: t.latestStart,
    latestFinish: t.latestFinish,
    slack: t.slack,
    isCritical: t.isCritical,
  }))
);

console.log("\n--- Daily recommendation (most urgent first) ---");
const recommendation = recommendDailyTasks(cpmResult.tasks);
recommendation.forEach((t, i) => {
  console.log(`${i + 1}. ${t.title} (slack: ${t.slack}, critical: ${t.isCritical})`);
});
