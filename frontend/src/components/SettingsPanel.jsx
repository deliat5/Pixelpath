import React from "react";
import Modal from "./Modal";
import { useSettings } from "../contexts/SettingsContext";

/**
 * A couple of ideas for what else could live here later, if useful:
 *   - account section (change email/password) once that becomes relevant
 *   - "reset onboarding" / help replay, if the app ever gets a tutorial
 * Not built now since nothing in the current app needs them yet - this
 * panel only holds what was actually asked for (audio controls).
 */
export default function SettingsPanel({ open, onClose }) {
  const { t, musicVolume, setMusicVolume, musicMuted, setMusicMuted, sfxVolume, setSfxVolume, sfxMuted, setSfxMuted } =
    useSettings();

  return (
    <Modal open={open} onClose={onClose}>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-4">{t("settingsTitle")}</p>

      <div className="space-y-5">
        <div>
          <label className="text-sm text-slate-600 dark:text-slate-300">{t("musicLabel")}</label>
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={() => setMusicMuted(!musicMuted)}
              title={musicMuted ? t("unmute") : t("mute")}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <img
                src={musicMuted ? "/icons/music-muted.png" : "/icons/music-on.png"}
                alt={musicMuted ? t("unmute") : t("mute")}
                className="w-5 h-5 object-contain"
              />
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={musicVolume}
              disabled={musicMuted}
              onChange={(e) => setMusicVolume(Number(e.target.value))}
              className="w-full accent-violet-600 disabled:opacity-40"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-600 dark:text-slate-300">{t("sfxLabel")}</label>
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={() => setSfxMuted(!sfxMuted)}
              title={sfxMuted ? t("unmute") : t("mute")}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <img
                src={sfxMuted ? "/icons/speaker-muted.png" : "/icons/speaker-on.png"}
                alt={sfxMuted ? t("unmute") : t("mute")}
                className="w-5 h-5 object-contain"
              />
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVolume}
              disabled={sfxMuted}
              onChange={(e) => setSfxVolume(Number(e.target.value))}
              className="w-full accent-violet-600 disabled:opacity-40"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
