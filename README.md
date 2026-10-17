# PixelPath

**A gamified project manager built on the Critical Path Method (CPM).**

PixelPath turns a project's task dependencies into an automatic schedule, then rewards progress along the critical path with a pixel-art island-hopping game layer. Created as a bachelor's thesis at the Faculty of Mathematics and Informatics, University of Bucharest.

**Live demo:** https://pixelpath-six.vercel.app
*(The backend runs on a free tier and sleeps after inactivity, so the first request can take 30-60 seconds.)*

---

## Why PixelPath?

Most to-do apps treat tasks as independent items sorted by priority or due date. Real projects don't work that way: you can't write the results chapter before the implementation exists. PixelPath models those constraints explicitly and computes which tasks actually determine the project's end date.

The game layer is built on the algorithm's output rather than bolted on top. Your character advances only when a **critical-path** task is completed, not on every checkbox.

## Features

**Scheduling core**
- Tasks with explicit dependencies, modeled as a directed acyclic graph (DAG)
- Cycle detection and ordering via topological sort (Kahn's algorithm, O(V + E))
- Critical Path Method: earliest/latest start and finish, slack, and critical-path identification
- Optional "not before" date constraint, integrated into the CPM forward pass
- Greedy daily recommendation, ordering tasks by slack, then duration
- Calendar view with automatic rollover of overdue tasks, plus a dependency graph view
- Zero-duration tasks as milestones

**Gamification**
- XP and levels derived from completed tasks
- Island path: the character moves one island per completed critical task
- Two independent reward tracks:
  - **Items** (accessories), earned by points (critical task = 2, secondary = 1, 10 points per item)
  - **Special skins**, earned every 5 days of your longest activity streak
- Characters, items, and rewards are isolated per project
- Character creator (24 base combinations) in custom pixel art

**Crabby, the AI assistant**
- Powered by the DeepSeek API
- Breaks a large task into a chain of subtasks that can be added to the project in one click
- Answers general planning questions in free text

**Other**
- Multi-user authentication (JWT + bcrypt) and multiple independent projects per user
- Romanian / English interface, light / dark mode, independent music and sound-effect volume

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | PostgreSQL (Neon), Prisma ORM |
| Auth | JSON Web Tokens, bcrypt |
| AI | DeepSeek API (`deepseek-v4-flash`) |
| Hosting | Vercel (frontend), Render (backend), Neon (database) |

## Architecture

```
Browser ──► Frontend (React + Vite) ──REST/JSON + JWT──► Backend (Express) ──Prisma──► PostgreSQL
                                                              │
                                                              └──► DeepSeek API (server-side only)
```

The scheduling algorithms (`backend/src/algorithms/`) are pure functions with no database or HTTP dependencies, so they can be tested in isolation. Run the standalone demo with `npm run demo` in `backend/`.

## Getting Started

### Prerequisites
- Node.js 18+
- A PostgreSQL database (a free [Neon](https://neon.tech) instance works well)
- A [DeepSeek](https://platform.deepseek.com) API key (only needed for the assistant)

### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=<a long random string>
DEEPSEEK_API_KEY=<your key>
# Optional, restricts CORS to your frontend origin in production:
# FRONTEND_URL=https://your-frontend.example.com
```

Generate a secret with:
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

Then apply the migrations and start the server:

```bash
npm run prisma:migrate
npm run dev        # http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

For a deployed build, set `VITE_API_URL` to your backend's public URL. Locally it defaults to `http://localhost:3001`.

## Project Structure

```
backend/
  prisma/schema.prisma       # User, Project, Task, ProjectReward
  src/algorithms/            # topological sort, CPM, daily recommendation
  src/services/              # CPM persistence, game stats, streaks, rewards, AI assistant
  src/routes/                # auth, projects, tasks
frontend/
  src/components/            # calendar, island path, rewards, chat widget, ...
  src/i18n/                  # RO / EN translations
  public/                    # pixel-art assets and audio
```

## Security Notes

- Passwords are stored only as bcrypt hashes.
- Every protected route verifies the JWT and checks that the requested resource belongs to the authenticated user.
- The DeepSeek key lives only on the server and is never sent to the client.

## Credits

The pixel art (characters, islands, items, icons, backgrounds) was created by the author.
