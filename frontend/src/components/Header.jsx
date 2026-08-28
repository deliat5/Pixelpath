import React, { useState } from "react";
import {
  GENDERS,
  SKIN_TONES,
  HAIR_COLORS,
  makeCharacterKey,
  parseCharacterKey,
  getCharacterImage,
} from "../skins";
import Modal from "./Modal";
import SettingsPanel from "./SettingsPanel";
import { getSpecialSkinById } from "../specialSkins";
import { useSettings } from "../contexts/SettingsContext";

function SwatchRow({ options, selectedId, onSelect }) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const selected = opt.id === selectedId;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            className={
              "w-12 h-12 rounded-lg overflow-hidden border-2 transition " +
              (selected ? "border-violet-600" : "border-transparent hover:border-slate-300")
            }
          >
            <img src={opt.swatch} alt={opt.id} className="w-full h-full object-contain" />
          </button>
        );
      })}
    </div>
  );
}

export default function Header({
  equippedCharacter,
  onEquipCharacter,
  onLogout,
  unlockedSkinKeys = [],
  showCharacterPicker = true,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { theme, toggleTheme, lang, toggleLang, t } = useSettings();

  const parsed = parseCharacterKey(equippedCharacter);
  const [gender, setGender] = useState(parsed.gender || "boy");
  const [skinTone, setSkinTone] = useState(parsed.skinTone || "light");
  const [hairColor, setHairColor] = useState(parsed.hairColor || "blonde");

  const previewImage = getCharacterImage(makeCharacterKey(gender, skinTone, hairColor));
  const currentImage = getCharacterImage(equippedCharacter);

  function openPicker() {
    const current = parseCharacterKey(equippedCharacter);
    setGender(current.gender || "boy");
    setSkinTone(current.skinTone || "light");
    setHairColor(current.hairColor || "blonde");
    setPickerOpen(true);
  }

  function confirmCharacter() {
    onEquipCharacter(makeCharacterKey(gender, skinTone, hairColor));
    setPickerOpen(false);
  }

  return (
    <header className="w-full bg-gradient-to-r from-violet-600 to-violet-500 dark:from-violet-800 dark:to-violet-700 shadow-md mb-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3 px-4 py-3">
        <h1 className="font-pixel text-white text-sm sm:text-base tracking-wide drop-shadow">
          PixelPath
        </h1>

        <div className="flex items-center gap-2">
          {showCharacterPicker && (
            <button
              type="button"
              onClick={openPicker}
              className="flex items-center gap-2 bg-white/95 dark:bg-slate-800/90 shadow-sm rounded-full pl-1 pr-3 py-1 hover:bg-white dark:hover:bg-slate-700"
              title={t("choosePersonaje")}
            >
              <img src={currentImage} alt="" className="w-7 h-7 object-contain" />
              <span className="text-sm text-slate-600 dark:text-slate-200">{t("character")}</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleLang}
            className="w-9 h-9 rounded-full bg-white/95 dark:bg-slate-800/90 shadow-sm flex items-center justify-center text-xs font-semibold text-slate-500 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
            title={t("language")}
          >
            {t("language")}
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full bg-white/95 dark:bg-slate-800/90 shadow-sm flex items-center justify-center hover:bg-white dark:hover:bg-slate-700"
            title={theme === "light" ? t("darkMode") : t("lightMode")}
          >
            <img
              src={theme === "light" ? "/icons/moon.png" : "/icons/sun.png"}
              alt=""
              className="w-5 h-5 object-contain"
            />
          </button>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="w-9 h-9 rounded-full bg-white/95 dark:bg-slate-800/90 shadow-sm flex items-center justify-center hover:bg-white dark:hover:bg-slate-700"
            title={t("settingsTitle")}
          >
            <img src="/icons/settings.png" alt="" className="w-5 h-5 object-contain" />
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-9 h-9 rounded-full bg-white/95 dark:bg-slate-800/90 shadow-sm flex items-center justify-center hover:bg-white dark:hover:bg-slate-700"
            title={t("logout")}
          >
            <img src="/icons/profile.png" alt="" className="w-5 h-5 object-contain" />
          </button>
        </div>

        <Modal open={pickerOpen} onClose={() => setPickerOpen(false)}>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-4">
            {t("choosePersonaje")}
          </p>

          <div className="flex items-center gap-4 mb-4">
            <img
              src={previewImage}
              alt="preview"
              className="w-20 h-20 object-contain bg-slate-100 dark:bg-slate-700 rounded-lg p-1"
            />
            <div className="space-y-3 flex-1">
              <SwatchRow options={GENDERS} selectedId={gender} onSelect={setGender} />
              <SwatchRow options={SKIN_TONES} selectedId={skinTone} onSelect={setSkinTone} />
              <SwatchRow options={HAIR_COLORS} selectedId={hairColor} onSelect={setHairColor} />
            </div>
          </div>

          <button
            type="button"
            onClick={confirmCharacter}
            className="w-full bg-violet-600 text-white py-2 rounded-lg hover:bg-violet-700"
          >
            {t("chooseThisCharacter")}
          </button>

          {unlockedSkinKeys.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                {t("specialSkinsSection")}
              </p>
              <div className="flex flex-wrap gap-2">
                {unlockedSkinKeys.map((key) => {
                  const skin = getSpecialSkinById(key);
                  if (!skin) return null;
                  const equipped = key === equippedCharacter;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        onEquipCharacter(key);
                        setPickerOpen(false);
                      }}
                      title={skin.name}
                      className={
                        "w-14 h-14 rounded-full flex items-center justify-center border-2 bg-slate-100 dark:bg-slate-700 " +
                        (equipped ? "border-violet-600" : "border-transparent hover:border-slate-300")
                      }
                    >
                      <img src={skin.image} alt={skin.name} className="w-10 h-10 object-contain" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Modal>

        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </header>
  );
}
