import React, { useState } from "react";
import { useSettings } from "../contexts/SettingsContext";

/**
 * Same mutual-exclusivity rule as TaskForm (dependencies vs. a manual
 * date, never both) - see TaskForm.jsx for why.
 */
export default function TaskEditForm({ task, otherTasks, onSave, onDelete, onCancel }) {
  const { t } = useSettings();
  const [title, setTitle] = useState(task.title);
  const [duration, setDuration] = useState(task.duration);
  const [selectedDeps, setSelectedDeps] = useState(task.dependencies || []);
  const [notBeforeDate, setNotBeforeDate] = useState(
    task.notBeforeDate ? task.notBeforeDate.slice(0, 10) : ""
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
    onSave(task.id, {
      title: title.trim(),
      duration: Number(duration),
      dependencies: selectedDeps,
      notBeforeDate: notBeforeDate || null,
    });
  }

  const selectableDeps = otherTasks.filter((t) => t.id !== task.id);
  const showDateField = selectedDeps.length === 0;
  const showDependencyField = !notBeforeDate && selectableDeps.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          {t("taskTitleLabel")}
        </label>
        <input
          className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
        </div>
      )}

      {showDependencyField && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            {t("dependsOnLabel")}
          </label>
          <div className="flex flex-wrap gap-2">
            {selectableDeps.map((t2) => (
              <button
                type="button"
                key={t2.id}
                onClick={() => toggleDependency(t2.id)}
                className={
                  "px-3 py-1 rounded-full text-sm border " +
                  (selectedDeps.includes(t2.id)
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600")
                }
              >
                {t2.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        {confirmingDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-600 dark:text-red-400">{t("confirmDelete")}</span>
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
            >
              {t("deleteTask")}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {t("cancel")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
          >
            {t("deleteTask")}
          </button>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1 text-sm px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <img src="/icons/cancel.png" alt="" className="w-4 h-4 object-contain" />
            {t("cancel")}
          </button>
          <button
            type="submit"
            className="flex items-center gap-1 bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700"
          >
            <img src="/icons/check.png" alt="" className="w-4 h-4 object-contain" />
            {t("saveChanges")}
          </button>
        </div>
      </div>
    </form>
  );
}
