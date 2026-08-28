# Task Tracker Backend

Express + Prisma (SQLite) backend for the gamified task tracker thesis project.

## Setup

```
cd backend
npm install
npx prisma migrate dev --name init
```

The second command reads `prisma/schema.prisma`, creates the SQLite database
file (`prisma/dev.db`), and generates the Prisma Client used in the code.

## Running

```
npm run dev
```

Starts the Express server (see `src/index.js` for the port).

## Testing the algorithms in isolation

```
npm run demo
```

Runs `src/algorithms/demo.js`, which exercises topological sort, CPM, and
the daily recommendation algorithm on a small sample graph and prints the
results to the console. No database needed for this.

## Project structure

```
backend/
  prisma/
    schema.prisma        - data model (Project, Task, UserProfile)
  src/
    algorithms/
      topologicalSort.js - Kahn's algorithm + cycle detection
      cpm.js              - Critical Path Method (earliest/latest times, slack)
      dailyRecommendation.js - greedy "what to do today" ranking
      demo.js             - standalone script to test the algorithms
    routes/               - Express route handlers (API endpoints)
    index.js              - Express app entry point
```
