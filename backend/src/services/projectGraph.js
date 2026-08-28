/**
 * This module is the bridge between the pure algorithms (src/algorithms/*)
 * and the database (Prisma). The algorithms themselves know nothing about
 * Prisma or SQL - they just take plain arrays/objects. That separation
 * matters for the thesis: it means the algorithms can be unit-tested in
 * isolation (see algorithms/demo.js) and are not tangled up with the DB layer.
 */

const prisma = require("../prismaClient");
const { computeCPM } = require("../algorithms/cpm");
const { recommendDailyTasks } = require("../algorithms/dailyRecommendation");

// Converts a calendar date into a day-offset relative to the project's
// creation date (the same anchor the frontend calendar uses - see
// CalendarView.jsx). Day offsets are what CPM works with internally;
// calendar dates only exist at the edges (DB storage, UI display).
function daysBetween(anchor, date) {
  const a = new Date(anchor);
  a.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - a) / (1000 * 60 * 60 * 24));
}

// Load a project's tasks from the DB and reshape them into the plain
// { id, duration, status, dependencies: [id, id, ...] } format the
// algorithms expect.
async function loadProjectTasks(projectId) {
  const project = await prisma.project.findUnique({ where: { id: Number(projectId) } });

  const tasks = await prisma.task.findMany({
    where: { projectId: Number(projectId) },
    include: { dependencies: { select: { id: true } } },
  });

  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    duration: t.duration,
    status: t.status,
    completedAt: t.completedAt,
    dependencies: t.dependencies.map((d) => d.id),
    // Raw date, for editing - kept separate from notBeforeOffset (below),
    // which is what the algorithm actually consumes.
    notBeforeDate: t.notBeforeDate,
    // null if the task has no user-chosen ready date; CPM treats that as 0.
    notBeforeOffset: t.notBeforeDate ? Math.max(0, daysBetween(project.createdAt, t.notBeforeDate)) : null,
  }));
}

// Runs CPM for a project and writes the computed fields (earliestStart,
// slack, isCritical, etc.) back to each Task row, so the frontend can just
// read them without recomputing CPM on every page load.
async function computeAndPersistCPM(projectId) {
  const tasks = await loadProjectTasks(projectId);

  if (tasks.length === 0) {
    return { projectDuration: 0, criticalPath: [], tasks: [] };
  }

  const result = computeCPM(tasks); // throws if the graph has a cycle

  await prisma.$transaction(
    result.tasks.map((t) =>
      prisma.task.update({
        where: { id: t.id },
        data: {
          earliestStart: t.earliestStart,
          earliestFinish: t.earliestFinish,
          latestStart: t.latestStart,
          latestFinish: t.latestFinish,
          slack: t.slack,
          isCritical: t.isCritical,
        },
      })
    )
  );

  return result;
}

async function getDailyRecommendation(projectId) {
  const cpmResult = await computeAndPersistCPM(projectId);
  return recommendDailyTasks(cpmResult.tasks);
}

module.exports = { loadProjectTasks, computeAndPersistCPM, getDailyRecommendation };
