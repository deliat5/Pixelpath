import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "../i18n/translations";
import { setSfxVolume, setSfxMuted } from "../sound";

const SettingsContext = createContext(null);

function loadNumber(key, fallback) {
  const raw = localStorage.getItem(key);
  return raw === null ? fallback : Number(raw);
}

function loadBool(key, fallback) {
  const raw = localStorage.getItem(key);
  return raw === null ? fallback : raw === "true";
}

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("pixelpath-theme") || "light");
  const [lang, setLang] = useState(() => localStorage.getItem("pixelpath-lang") || "ro");

  const [musicVolume, setMusicVolumeState] = useState(() => loadNumber("pixelpath-music-volume", 0.15));
  const [musicMuted, setMusicMutedState] = useState(() => loadBool("pixelpath-music-muted", false));
  const [sfxVolume, setSfxVolumeState] = useState(() => loadNumber("pixelpath-sfx-volume", 0.6));
  const [sfxMuted, setSfxMutedState] = useState(() => loadBool("pixelpath-sfx-muted", false));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("pixelpath-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("pixelpath-lang", lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("pixelpath-music-volume", String(musicVolume));
  }, [musicVolume]);

  useEffect(() => {
    localStorage.setItem("pixelpath-music-muted", String(musicMuted));
  }, [musicMuted]);

  useEffect(() => {
    setSfxVolume(sfxVolume);
    localStorage.setItem("pixelpath-sfx-volume", String(sfxVolume));
  }, [sfxVolume]);

  useEffect(() => {
    setSfxMuted(sfxMuted);
    localStorage.setItem("pixelpath-sfx-muted", String(sfxMuted));
  }, [sfxMuted]);

  function toggleTheme() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  function toggleLang() {
    setLang((prev) => (prev === "ro" ? "en" : "ro"));
  }

  function t(key) {
    return translations[lang][key] ?? translations.ro[key] ?? key;
  }

  return (
    <SettingsContext.Provider
      value={{
        theme,
        toggleTheme,
        lang,
        toggleLang,
        t,
        musicVolume,
        setMusicVolume: setMusicVolumeState,
        musicMuted,
        setMusicMuted: setMusicMutedState,
        sfxVolume,
        setSfxVolume: setSfxVolumeState,
        sfxMuted,
        setSfxMuted: setSfxMutedState,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}
