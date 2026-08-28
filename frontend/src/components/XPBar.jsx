import React from "react";
import { useSettings } from "../contexts/SettingsContext";

const XP_PER_LEVEL = 50; // must match backend/src/services/gameStats.js

export default function XPBar({ xp, level }) {
  const { t } = useSettings();
  const xpIntoLevel = xp % XP_PER_LEVEL;
  const percent = (xpIntoLevel / XP_PER_LEVEL) * 100;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex justify-between text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
        <span>
          {t("level")} {level}
        </span>
        <span>{xp} XP</span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
        <div className="bg-amber-400 h-2 rounded-full transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
