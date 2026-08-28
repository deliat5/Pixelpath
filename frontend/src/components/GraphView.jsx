import React from "react";
import { useSettings } from "../contexts/SettingsContext";

/**
 * Dependency graph visualization.
 *
 * SCOPING DECISION (worth stating explicitly in the documentation):
 * A general-purpose graph layout algorithm (e.g. Sugiyama-style layering)
 * is a substantial piece of work on its own and is NOT the contribution
 * this thesis is making. Instead, this reuses `earliestStart` - a value
 * the CPM algorithm already computes - as the horizontal position: a task
 * that can only start after others finish is naturally drawn further
 * right. Tasks sharing the same earliestStart are stacked vertically.
 * This is a simplification, not a general graph-drawing algorithm, and is
 * presented as such rather than overclaimed.
 *
 * Edges between two critical tasks are highlighted in red as a visual
 * approximation of the critical path (accurate for the common case of a
 * single dominant critical path; with multiple equal-length critical
 * paths this would highlight all of them, which is an acceptable and
 * explainable simplification for this scope).
 */

const X_SCALE = 70;
const X_MARGIN = 50;
const Y_SPACING = 60;
const Y_MARGIN = 40;
const NODE_RADIUS = 26;

export default function GraphView({ tasks }) {
  const { t } = useSettings();

  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm text-center text-sm text-slate-400 dark:text-slate-500">
        {t("graphEmpty")}
      </div>
    );
  }

  const byStart = {};
  tasks.forEach((t) => {
    const key = t.earliestStart ?? 0;
    if (!byStart[key]) byStart[key] = [];
    byStart[key].push(t);
  });

  const positions = {};
  Object.entries(byStart).forEach(([start, group]) => {
    group.forEach((task, index) => {
      positions[task.id] = {
        x: X_MARGIN + Number(start) * X_SCALE,
        y: Y_MARGIN + index * Y_SPACING,
      };
    });
  });

  const xs = Object.values(positions).map((p) => p.x);
  const ys = Object.values(positions).map((p) => p.y);
  const width = Math.max(...xs) + X_MARGIN + NODE_RADIUS;
  const height = Math.max(...ys) + Y_MARGIN;

  const taskById = Object.fromEntries(tasks.map((t) => [t.id, t]));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm overflow-x-auto">
      <svg width={Math.max(width, 300)} height={Math.max(height, 150)}>
        {tasks.flatMap((task) =>
          (task.dependencies || []).map((depId) => {
            const from = positions[depId];
            const to = positions[task.id];
            if (!from || !to) return null;
            const isCriticalEdge = Boolean(taskById[depId]?.isCritical && task.isCritical);
            return (
              <line
                key={`${depId}-${task.id}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isCriticalEdge ? "#ef4444" : "#cbd5e1"}
                strokeWidth={isCriticalEdge ? 3 : 2}
              />
            );
          })
        )}

        {tasks.map((task) => {
          const pos = positions[task.id];
          return (
            <g key={task.id}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={NODE_RADIUS}
                fill={task.status === "done" ? "#a7f3d0" : task.isCritical ? "#fecaca" : "#e2e8f0"}
                stroke={task.isCritical ? "#ef4444" : "#94a3b8"}
                strokeWidth="2"
              />
              <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize="11" fill="#1e293b">
                {task.title.length > 6 ? task.title.slice(0, 6) + "…" : task.title}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
