import React from "react";
import { useSettings } from "../contexts/SettingsContext";

export default function DailyGoal({ goalTask, goalMetToday, streak }) {
  const { t } = useSettings();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("dailyGoalTitle")}</p>
        {goalMetToday ? (
          <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-1 flex items-center gap-1">
            <img src="/icons/check.png" alt="" className="w-4 h-4 object-contain" />
            {t("dailyGoalMet")}
          </p>
        ) : goalTask ? (
          <p className="text-slate-800 dark:text-slate-100 mt-1">{goalTask.title}</p>
        ) : (
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">{t("dailyGoalNone")}</p>
        )}
      </div>

      <div className="text-center shrink-0">
        <div className="flex items-center justify-center gap-1">
          <img src="/icons/flame.png" alt="" className="w-6 h-6 object-contain" />
          <span className="text-xl font-semibold text-slate-700 dark:text-slate-200">{streak}</span>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {streak === 1 ? t("day") : t("days")}
        </p>
      </div>
    </div>
  );
}
