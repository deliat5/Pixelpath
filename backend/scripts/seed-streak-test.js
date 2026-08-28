/**
 * DEV-ONLY testing helper. Creates 20 backdated, already-"done" tasks on
 * a project, one per day for the last 20 consecutive days, so
 * computeLongestStreak() (see services/dailyGoal.js) reports a 20-day
 * streak without actually waiting 20 real days. With 5 days per skin
 * (see services/rewards.js), this earns exactly all 4 special skins -
 * useful for checking that flow end-to-end.
 *
 * This does NOT go through the normal app flow (which only lets you
 * complete tasks "today") - it writes directly to the database. Safe to
 * run against your local dev database; not meant for anything else.
 *
 * Usage (from the backend/ folder):
 *   node scripts/seed-streak-test.js <projectId>
 *
 * Don't know your project's id? Run `npx prisma studio`, open the
 * Project table, and look at the id column - or just try 1, since it's
 * usually the first project you ever created.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const projectId = Number(process.argv[2]);
  if (!projectId) {
    console.error("Usage: node scripts/seed-streak-test.js <projectId>");
    process.exit(1);
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    console.error("No project found with id", projectId);
    process.exit(1);
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0); // noon, to sidestep any timezone edge cases

  for (let i = 19; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    await prisma.task.create({
      data: {
        title: `[test streak] Ziua ${20 - i}`,
        duration: 1,
        projectId: project.id,
        status: "done",
        completedAt: day,
      },
    });
  }

  console.log(`Created 20 backdated tasks on "${project.name}" - refresh the app to see a 20-day streak.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
