require("dotenv").config();

const express = require("express");
const cors = require("cors");
const projectsRouter = require("./routes/projects");
const tasksRouter = require("./routes/tasks");
const authRouter = require("./routes/auth");
const { authMiddleware } = require("./middleware/auth");

const app = express();

// Locally (no FRONTEND_URL set), allow any origin - simplest for
// development. Once hosted, set FRONTEND_URL to your real Vercel URL on
// Render, and only that origin will be allowed.
app.use(cors({ origin: process.env.FRONTEND_URL || true }));
app.use(express.json());

// Public - no token required (this IS how you get a token).
app.use("/auth", authRouter);

// Everything below requires a valid Authorization: Bearer <token> header.
app.use("/projects", authMiddleware, projectsRouter);
app.use("/tasks", authMiddleware, tasksRouter);

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Task tracker API is running" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
