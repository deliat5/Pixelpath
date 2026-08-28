import React, { useState } from "react";
import { useSettings } from "../contexts/SettingsContext";

/**
 * Dependencies and a manual "not before" date are mutually exclusive in
 * this form (deliberate simplification - see conversation/thesis notes).
 * A task is either "part of the dependency chain" (algorithm decides the
 * day) or "independent, dated by hand" (you decide), never an unclear
 * mix of both.
 */
export default function TaskForm({ existingTasks, onSubmit }) {
  const { t } = useSettings();
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(1);
  const [selectedDeps, setSelectedDeps] = useState([]);
  const [notBeforeDate, setNotBeforeDate] = useState("");

  function toggleDependency(taskId) {
    setSelectedDeps((prev) => {
      const next = prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId];
      if (next.length > 0) setNotBeforeDate("");
      return next;
    });
  }

  function handleDateChange(value) {
    setNotBeforeDate(value);
    if (value) setSelectedDeps([]);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      duration: Number(duration),
      dependencies: selectedDeps,
      notBeforeDate: notBeforeDate || undefined,
    });

    setTitle("");
    setDuration(1);
    setSelectedDeps([]);
    setNotBeforeDate("");
  }

  const showDateField = selectedDeps.length === 0;
  const showDependencyField = !notBeforeDate && existingTasks.length > 0;

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          {t("taskTitleLabel")}
        </label>
        <input
          className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("taskTitlePlaceholder")}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          {t("durationLabel")}
        </label>
        <input
          type="number"
          min="0"
          className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
      </div>

      {showDateField && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            {t("dateLabel")}
          </label>
          <input
            type="date"
            className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            value={notBeforeDate}
            onChange={(e) => handleDateChange(e.target.value)}
          />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t("dateHelp")}</p>
        </div>
      )}

      {showDependencyField && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            {t("dependsOnLabel")}
          </label>
          <div className="flex flex-wrap gap-2">
            {existingTasks.map((task) => (
              <button
                type="button"
                key={task.id}
                onClick={() => toggleDependency(task.id)}
                className={
                  "px-3 py-1 rounded-full text-sm border " +
                  (selectedDeps.includes(task.id)
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600")
                }
              >
                {task.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {!showDateField && (
        <button
          type="button"
          onClick={() => setSelectedDeps([])}
          className="text-xs text-violet-500 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
        >
          {t("chooseDateInstead")}
        </button>
      )}

      {!showDependencyField && notBeforeDate && existingTasks.length > 0 && (
        <button
          type="button"
          onClick={() => setNotBeforeDate("")}
          className="text-xs text-violet-500 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
        >
          {t("chooseDepsInstead")}
        </button>
      )}

      <button
        type="submit"
        className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700"
      >
        {t("addTask")}
      </button>
    </form>
  );
}
