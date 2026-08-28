const express = require("express");
const prisma = require("../prismaClient");
const { computeAndPersistCPM, getDailyRecommendation } = require("../services/projectGraph");
const { computeGameStats } = require("../services/gameStats");
const { computeDailyGoal } = require("../services/dailyGoal");
const { ensureObjectRewardsGranted, ensureSkinRewardsGranted, getProjectRewards } = require("../services/rewards");
const { askAssistant } = require("../services/assistant");

const router = express.Router();

// This whole router is mounted behind authMiddleware (see index.js), so
// every handler below can trust req.userId. But knowing WHO is logged in
// isn't enough - each handler that takes a :id must also check that the
// project actually belongs to that user, or any logged-in user could read
// or modify anyone else's project just by guessing an id. This helper
// centralizes that check so it can't be forgotten in any one route.
async function getOwnedProject(projectId, userId) {
  const project = await prisma.project.findUnique({ where: { id: Number(projectId) } });
  if (!project || project.userId !== userId) return null;
  return project;
}

router.get("/", async (req, res) => {
  const projects = await prisma.project.findMany({
    where: { userId: req.userId },
    include: { _count: { select: { tasks: true } } },
  });
  res.json(projects);
});

router.post("/", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });

  const project = await prisma.project.create({ data: { name, userId: req.userId } });
  res.status(201).json(project);
});

router.get("/:id", async (req, res) => {
  const owned = await getOwnedProject(req.params.id, req.userId);
  if (!owned) return res.status(404).json({ error: "Project not found" });

  const project = await prisma.project.findUnique({
    where: { id: owned.id },
    include: { tasks: { include: { dependencies: { select: { id: true } } } } },
  });
  res.json(project);
});

// PATCH /projects/:id - update this project's character choice and/or
// which earned reward is equipped as an accessory. Both are per-project,
// not per-user (see schema.prisma notes).
router.patch("/:id", async (req, res) => {
  const owned = await getOwnedProject(req.params.id, req.userId);
  if (!owned) return res.status(404).json({ error: "Project not found" });

  const { name, equippedCharacter, equippedRewardKey } = req.body;
  const data = {};

  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ error: "name cannot be empty" });
    data.name = name.trim();
  }

  if (equippedCharacter !== undefined) {
    if (typeof equippedCharacter !== "string" || !equippedCharacter) {
      return res.status(400).json({ error: "equippedCharacter must be a non-empty string" });
    }
    data.equippedCharacter = equippedCharacter;
  }

  if (equippedRewardKey !== undefined) {
    if (equippedRewardKey !== null) {
      // Can only equip an OBJECT reward this project has actually won
      // (skins are a separate track, equipped via equippedCharacter instead).
      const owns = await prisma.projectReward.findFirst({
        where: { projectId: owned.id, type: "object", itemKey: equippedRewardKey },
      });
      if (!owns) {
        return res.status(400).json({ error: "This project has not won that item" });
      }
    }
    data.equippedRewardKey = equippedRewardKey;
  }

  const updated = await prisma.project.update({ where: { id: owned.id }, data });
  res.json(updated);
});

// DELETE /projects/:id - removes the project and, via the cascade
// relations in schema.prisma, all of its tasks and rewards too.
router.delete("/:id", async (req, res) => {
  const owned = await getOwnedProject(req.params.id, req.userId);
  if (!owned) return res.status(404).json({ error: "Project not found" });

  await prisma.project.delete({ where: { id: owned.id } });
  res.status(204).send();
});

router.post("/:id/tasks", async (req, res) => {
  const owned = await getOwnedProject(req.params.id, req.userId);
  if (!owned) return res.status(404).json({ error: "Project not found" });

  const { title, duration, dependencies = [], notBeforeDate } = req.body;
  // duration === 0 is valid (a "milestone" task, standard in CPM/PERT
  // theory - zero-length, but still a real dependency link). A plain
  // `!duration` check would wrongly reject 0, since it's falsy in JS.
  if (!title || duration === undefined || duration === null || duration < 0) {
    return res.status(400).json({ error: "title and a non-negative duration are required" });
  }

  const task = await prisma.task.create({
    data: {
      title,
      duration,
      projectId: owned.id,
      dependencies: { connect: dependencies.map((id) => ({ id })) },
      notBeforeDate: notBeforeDate ? new Date(notBeforeDate) : null,
    },
  });

  res.status(201).json(task);
});

router.get("/:id/cpm", async (req, res) => {
  const owned = await getOwnedProject(req.params.id, req.userId);
  if (!owned) return res.status(404).json({ error: "Project not found" });

  try {
    const result = await computeAndPersistCPM(owned.id);
    result.gameStats = computeGameStats(result.tasks, result.criticalPath);
    result.dailyGoal = computeDailyGoal(result.tasks);

    // Grant any newly-earned rewards on both independent tracks, then
    // return this project's full (persisted) lists, so the frontend never
    // has to guess what was won - it's exactly what's in the database.
    await ensureObjectRewardsGranted(owned.id, result.gameStats.objectsEarned);
    await ensureSkinRewardsGranted(owned.id, result.dailyGoal.longestStreak);
    result.objectRewards = await getProjectRewards(owned.id, "object");
    result.skinRewards = await getProjectRewards(owned.id, "skin");

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/:id/recommendation", async (req, res) => {
  const owned = await getOwnedProject(req.params.id, req.userId);
  if (!owned) return res.status(404).json({ error: "Project not found" });

  try {
    const recommendation = await getDailyRecommendation(owned.id);
    res.json(recommendation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /projects/:id/assistant - talk to the DeepSeek-backed task
// breakdown assistant. body: { message, history? }. `history` is sent by
// the frontend (not persisted here - see conversation notes on scope).
router.post("/:id/assistant", async (req, res) => {
  const owned = await getOwnedProject(req.params.id, req.userId);
  if (!owned) return res.status(404).json({ error: "Project not found" });

  const { message, history = [] } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: owned.id },
      include: { tasks: { select: { title: true } } },
    });

    const reply = await askAssistant(message.trim(), history, project.tasks);
    res.json(reply);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
