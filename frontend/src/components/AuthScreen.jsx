import React, { useState } from "react";
import { login, register } from "../api";
import { useSettings } from "../contexts/SettingsContext";

export default function AuthScreen({ onAuthenticated }) {
  const { t } = useSettings();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
      onAuthenticated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
        <h1 className="font-pixel text-violet-600 dark:text-violet-400 text-sm text-center mb-6">
          PixelPath
        </h1>

        <div className="flex mb-4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={
              "flex-1 py-2 text-sm " +
              (mode === "login"
                ? "bg-violet-600 text-white"
                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300")
            }
          >
            {t("login")}
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={
              "flex-1 py-2 text-sm " +
              (mode === "register"
                ? "bg-violet-600 text-white"
                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300")
            }
          >
            {t("register")}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg p-2 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Email
            </label>
            <input
              type="email"
              required
              className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("password")}
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={mode === "register" ? 8 : undefined}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 pr-10 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                tabIndex={-1}
                title={showPassword ? "Ascunde parola" : "Arată parola"}
              >
                <img
                  src={showPassword ? "/icons/eye-closed.png" : "/icons/eye-open.png"}
                  alt=""
                  className="w-5 h-5 object-contain"
                />
              </button>
            </div>
            {mode === "register" && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t("passwordHint")}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 text-white py-2 rounded-lg hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? t("loading") : mode === "login" ? t("login") : t("register")}
          </button>
        </form>
      </div>
    </div>
  );
}
