import React from "react";

export default function TaskList({ tasks, onComplete }) {
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={
            "flex items-center justify-between bg-white rounded-lg p-3 shadow-sm border-l-4 " +
            (task.isCritical ? "border-red-400" : "border-slate-200")
          }
        >
          <div>
            <p
              className={
                "font-medium " +
                (task.status === "done" ? "line-through text-slate-400" : "text-slate-800")
              }
            >
              {task.title}
            </p>
            <p className="text-xs text-slate-500">
              durata: {task.duration}z · slack: {task.slack ?? "-"}
              {task.isCritical ? " · pe drumul critic" : ""}
            </p>
          </div>

          {task.status !== "done" && (
            <button
              onClick={() => onComplete(task.id)}
              className="text-sm bg-emerald-500 text-white px-3 py-1 rounded-lg hover:bg-emerald-600"
            >
              Marcheaza terminat
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
