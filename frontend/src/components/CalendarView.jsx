import React, { useState, useEffect, useRef } from "react";
import Modal from "./Modal";
import TaskForm from "./TaskForm";
import TaskEditForm from "./TaskEditForm";
import { useSettings } from "../contexts/SettingsContext";

const PADDING_DAYS = 4;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(a, b) {
  return Math.round((startOfDay(b) - startOfDay(a)) / (1000 * 60 * 60 * 24));
}

export default function CalendarView({ tasks, startDate, onAddTask, onComplete, onEditTask, onDeleteTask }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const { t } = useSettings();
  const dayNames = t("dayNames");
  const monthNames = t("monthNames");

  function formatDayLabel(date) {
    return `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]}`;
  }

  const anchor = startDate ? new Date(startDate) : new Date();
  const todayOffset = Math.max(0, daysBetween(anchor, new Date()));

  const maxOriginalOffset =
    tasks.length > 0 ? Math.max(0, ...tasks.map((t) => t.earliestStart ?? 0)) : 0;
  const totalDays = Math.max(maxOriginalOffset, todayOffset) + PADDING_DAYS + 1;

  const buckets = Array.from({ length: totalDays }, () => []);
  tasks.forEach((task) => {
    const originalOffset = task.earliestStart ?? 0;
    const isOverdue = task.status !== "done" && originalOffset < todayOffset;
    const effectiveOffset = isOverdue ? todayOffset : originalOffset;
    if (buckets[effectiveOffset]) {
      buckets[effectiveOffset].push({ ...task, isOverdue });
    }
  });

  const days = buckets.map((tasksForDay, offset) => ({
    offset,
    date: addDays(anchor, offset),
    tasksForDay,
  }));

  const scrollRef = useRef(null);

  // Scroll to "today"'s column whenever it's known - both on first load
  // and if a different project (with a different anchor date) loads in.
  // Without this, the calendar always opens scrolled to its leftmost day
  // (the project's start date), which can be many days before today.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const dayEl = el.children[todayOffset];
    if (dayEl) {
      el.scrollTo({ left: dayEl.offsetLeft - 12, behavior: "smooth" });
    }
  }, [todayOffset]);

  function handleAdd(data) {
    onAddTask(data);
    setModalOpen(false);
  }

  function handleSaveEdit(taskId, data) {
    onEditTask(taskId, data);
    setEditingTask(null);
  }

  function handleDelete(taskId) {
    onDeleteTask(taskId);
    setEditingTask(null);
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">{t("calendarTitle")}</p>

      <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
        {days.map((day) => (
          <div
            key={day.offset}
            className={
              "shrink-0 w-56 snap-start border rounded-lg p-3 " +
              (day.offset === todayOffset
                ? "border-violet-300 dark:border-violet-500 bg-violet-50/40 dark:bg-violet-900/20"
                : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40")
            }
          >
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              {formatDayLabel(day.date)}
              {day.offset === todayOffset && (
                <span className="text-violet-500 dark:text-violet-400 text-xs ml-1">({t("today")})</span>
              )}
            </p>

            <div className="space-y-2 min-h-[3rem]">
              {day.tasksForDay.length === 0 && (
                <p className="text-xs text-slate-300 dark:text-slate-600">{t("noTasks")}</p>
              )}
              {day.tasksForDay.map((task) => (
                <div
                  key={task.id}
                  className={
                    "bg-white dark:bg-slate-800 rounded-md p-2 text-xs shadow-sm border-l-4 flex items-center justify-between gap-2 " +
                    (task.isOverdue
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                      : task.isCritical
                      ? "border-red-400"
                      : "border-slate-200 dark:border-slate-600")
                  }
                >
                  <button
                    type="button"
                    onClick={() => setEditingTask(task)}
                    className="min-w-0 text-left flex-1 hover:opacity-70"
                    title={t("editTask")}
                  >
                    <p
                      className={
                        "truncate " +
                        (task.status === "done"
                          ? "line-through text-slate-400 dark:text-slate-500"
                          : "text-slate-800 dark:text-slate-100")
                      }
                    >
                      {task.duration === 0 && <span className="text-violet-500 dark:text-violet-400">◆ </span>}
                      {task.title}
                    </p>
                    {task.isOverdue && (
                      <p
                        className="text-red-500 dark:text-red-400 text-[10px] cursor-help"
                        title={t("overdueExplanation")}
                      >
                        {t("overdue")}
                      </p>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => task.status !== "done" && onComplete(task.id)}
                    title={task.status === "done" ? t("doneLabel") : t("markDone")}
                    className={
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 " +
                      (task.status === "done"
                        ? "bg-violet-500 border-violet-500"
                        : "border-slate-300 dark:border-slate-500 hover:border-violet-400")
                    }
                  >
                    {task.status === "done" && (
                      <img src="/icons/check.png" alt="" className="w-3 h-3 object-contain" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-2 w-full text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-600 rounded-md py-1 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              +
            </button>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">{t("newTask")}</p>
        <TaskForm existingTasks={tasks} onSubmit={handleAdd} />
      </Modal>

      <Modal open={Boolean(editingTask)} onClose={() => setEditingTask(null)}>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">{t("editTask")}</p>
        {editingTask && (
          <TaskEditForm
            task={editingTask}
            otherTasks={tasks}
            onSave={handleSaveEdit}
            onDelete={handleDelete}
            onCancel={() => setEditingTask(null)}
          />
        )}
      </Modal>
    </div>
  );
}
