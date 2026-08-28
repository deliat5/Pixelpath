const express = require("express");
const prisma = require("../prismaClient");

const router = express.Router();

// This router is mounted behind authMiddleware (see index.js). A task has
// no direct userId of its own - ownership has to be checked by walking
// task -> project -> userId, otherwise any logged-in user could edit
// someone else's task just by guessing a task id. This helper centralizes
// that check for every handler below.
async function getOwnedTask(taskId, userId) {
  const task = await prisma.task.findUnique({
    where: { id: Number(taskId) },
    include: { project: true },
  });
  if (!task || task.project.userId !== userId) return null;
  return task;
}

// PATCH /tasks/:id - two things share this route, distinguished by body shape:
//   { status } alone            -> quick status toggle (calendar checkbox)
//   { title, duration, ... }    -> full edit (edit modal)
// Both end up in the same table, so one endpoint with optional fields is
// simpler than two near-duplicate ones.
router.patch("/:id", async (req, res) => {
  const owned = await getOwnedTask(req.params.id, req.userId);
  if (!owned) return res.status(404).json({ error: "Task not found" });

  const { status, title, duration, dependencies, notBeforeDate } = req.body;
  const data = {};

  if (status !== undefined) {
    const allowedStatuses = ["todo", "in_progress", "done"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "status must be one of: " + allowedStatuses.join(", ") });
    }
    data.status = status;
    // Record when a task became done (for streaks); clear it if the
    // status is reverted away from "done", to keep this field honest.
    data.completedAt = status === "done" ? new Date() : null;
  }

  if (title !== undefined) {
    if (!title.trim()) return res.status(400).json({ error: "title cannot be empty" });
    data.title = title.trim();
  }

  if (duration !== undefined) {
    // 0 is a valid "milestone" duration - only reject negative/missing.
    if (duration === null || duration < 0) return res.status(400).json({ error: "duration must be 0 or more" });
    data.duration = duration;
  }

  if (notBeforeDate !== undefined) {
    data.notBeforeDate = notBeforeDate ? new Date(notBeforeDate) : null;
  }

  if (dependencies !== undefined) {
    // A task cannot depend on itself, directly.
    const cleaned = dependencies.filter((id) => id !== owned.id);
    data.dependencies = { set: cleaned.map((id) => ({ id })) };
  }

  const updated = await prisma.task.update({ where: { id: owned.id }, data });
  res.json(updated);
});

// DELETE /tasks/:id - removes the task. Any other task that depended on
// this one simply loses that dependency link (Prisma drops the relation
// row automatically); it does NOT cascade-delete dependents. CPM will
// then treat those dependents as no longer requiring the deleted task,
// which is the sensible default rather than silently deleting more than
// the user asked for.
router.delete("/:id", async (req, res) => {
  const owned = await getOwnedTask(req.params.id, req.userId);
  if (!owned) return res.status(404).json({ error: "Task not found" });

  await prisma.task.delete({ where: { id: owned.id } });
  res.status(204).send();
});

module.exports = router;
