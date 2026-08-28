import React from "react";
import { getOutfitById } from "../outfits";
import { getSpecialSkinById, isSpecialSkin } from "../specialSkins";
import { useSettings } from "../contexts/SettingsContext";

export default function RewardsPanel({
  objectRewards,
  skinRewards,
  equippedRewardKey,
  equippedCharacter,
  onToggleReward,
  onEquipSkin,
  pointsUntilNextObject,
  pointsPerObject,
  longestStreak,
  streakDaysPerSkin,
}) {
  const { t } = useSettings();
  const objectPercent = ((pointsPerObject - pointsUntilNextObject) / pointsPerObject) * 100;
  const daysUntilNextSkin = streakDaysPerSkin - (longestStreak % streakDaysPerSkin);
  const skinPercent = ((streakDaysPerSkin - daysUntilNextSkin) / streakDaysPerSkin) * 100;
  const objectsDisabled = isSpecialSkin(equippedCharacter);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm space-y-5">
      {/* Objects - points-based */}
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
          {t("rewardsTitle")} ({objectRewards.length})
        </p>

        {objectsDisabled && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">{t("objectsDisabledNote")}</p>
        )}

        <div className="flex gap-2 flex-wrap mb-3 min-h-[3rem]">
          {objectRewards.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">{t("noRewardsYet")}</p>
          ) : (
            objectRewards.map((reward) => {
              const outfit = getOutfitById(reward.itemKey);
              if (!outfit) return null;
              const equipped = !objectsDisabled && reward.itemKey === equippedRewardKey;
              return (
                <button
                  key={reward.id}
                  type="button"
                  disabled={objectsDisabled}
                  onClick={() => onToggleReward(reward.itemKey)}
                  title={objectsDisabled ? t("objectsDisabledNote") : outfit.name}
                  className={
                    "w-12 h-12 rounded-lg flex items-center justify-center border-2 p-1 " +
                    (objectsDisabled
                      ? "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 opacity-40 cursor-not-allowed"
                      : equipped
                      ? "bg-violet-50 dark:bg-violet-900/40 border-violet-500"
                      : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 hover:border-amber-400")
                  }
                >
                  <img src={outfit.image} alt={outfit.name} className="w-full h-full object-contain" />
                </button>
              );
            })
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
          {t("nextReward")} {pointsUntilNextObject} {t("points")} ({t("criticalWorth")})
        </p>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div className="bg-amber-400 h-2 rounded-full transition-all" style={{ width: `${objectPercent}%` }} />
        </div>
      </div>

      {/* Skins - streak-based */}
      <div className="pt-1 border-t border-slate-100 dark:border-slate-700">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2 mt-3">
          {t("skinsTitle")} ({skinRewards.length})
        </p>

        {skinRewards.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">{t("noSkinsYet")}</p>
        ) : (
          <div className="flex gap-2 flex-wrap mb-3">
            {skinRewards.map((reward) => {
              const skin = getSpecialSkinById(reward.itemKey);
              if (!skin) return null;
              const equipped = reward.itemKey === equippedCharacter;
              return (
                <button
                  key={reward.id}
                  type="button"
                  onClick={() => onEquipSkin(reward.itemKey)}
                  title={skin.name}
                  className={
                    "w-12 h-12 rounded-lg flex items-center justify-center border-2 p-1 " +
                    (equipped
                      ? "bg-violet-50 dark:bg-violet-900/40 border-violet-500"
                      : "bg-violet-50/50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700 hover:border-violet-400")
                  }
                >
                  <img src={skin.image} alt={skin.name} className="w-full h-full object-contain" />
                </button>
              );
            })}
          </div>
        )}

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
          {t("nextSkin")} {daysUntilNextSkin} {t("daysLabel")}
        </p>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div className="bg-violet-400 h-2 rounded-full transition-all" style={{ width: `${skinPercent}%` }} />
        </div>
      </div>
    </div>
  );
}
