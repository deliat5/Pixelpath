import React, { useState, useRef, useEffect } from "react";
import { askAssistant, createTask } from "../api";
import { useSettings } from "../contexts/SettingsContext";

/**
 * Floating task-breakdown assistant (crab mascot + speech bubble, bottom
 * corner - click to open). Backed by DeepSeek (see backend/src/services/assistant.js).
 *
 * SCOPE: conversation history lives only in this component's state - it
 * is NOT persisted to the backend/database (deliberate simplification,
 * see conversation notes). Refreshing the page clears it.
 *
 * ADDING SUBTASKS: when the assistant proposes a breakdown, "Adauga in
 * proiect" creates the subtasks as a sequential dependency chain (each
 * depends on the previous one) - editable afterward like any other task,
 * via the normal edit form.
 */
export default function ChatWidget({ projectId, onTasksAdded }) {
  const { t } = useSettings();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [addingIndex, setAddingIndex] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const history = messages.map((m) => ({ role: m.role, content: m.text }));
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const reply = await askAssistant(projectId, text, history);
      if (reply.type === "breakdown") {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: reply.message, subtasks: reply.subtasks },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", text: reply.message }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", text: `${t("assistantError")} ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSubtasks(subtasks, messageIndex) {
    setAddingIndex(messageIndex);
    try {
      let previousId = null;
      for (const subtask of subtasks) {
        const created = await createTask(projectId, {
          title: subtask.title,
          duration: Math.max(1, Number(subtask.duration) || 1),
          dependencies: previousId ? [previousId] : [],
        });
        previousId = created.id;
      }
      onTasksAdded?.();
      setMessages((prev) =>
        prev.map((m, i) => (i === messageIndex ? { ...m, added: true } : m))
      );
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", text: `${t("assistantError")} ${err.message}` }]);
    } finally {
      setAddingIndex(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 z-40 flex items-end gap-1"
        title={t("assistantTitle")}
      >
        <img src="/chatbot/bubble.png" alt="" className="w-10 h-10 object-contain mb-3" />
        <img
          src="/chatbot/crab.png"
          alt={t("assistantTitle")}
          className="w-16 h-16 object-contain drop-shadow-lg hover:scale-105 transition"
        />
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-40 w-80 max-h-[28rem] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-violet-600 text-white">
            <span className="text-sm font-medium">{t("assistantTitle")}</span>
            <button type="button" onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
              <img src="/icons/cancel.png" alt="" className="w-4 h-4 object-contain" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3 text-sm">
            {messages.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500">{t("assistantIntro")}</p>
            )}

            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={
                    "inline-block rounded-lg px-3 py-2 max-w-[85%] " +
                    (m.role === "user"
                      ? "bg-violet-600 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100")
                  }
                >
                  <p className="break-words">{m.text}</p>

                  {m.subtasks && (
                    <div className="mt-2 space-y-1 text-left">
                      {m.subtasks.map((st, si) => (
                        <p key={si} className="text-xs opacity-80">
                          {si + 1}. {st.title} ({st.duration}z)
                        </p>
                      ))}
                      {m.added ? (
                        <p className="text-xs text-emerald-500 mt-1">{t("subtasksAdded")}</p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddSubtasks(m.subtasks, i)}
                          disabled={addingIndex === i}
                          className="mt-2 text-xs bg-violet-600 text-white px-2 py-1 rounded hover:bg-violet-700 disabled:opacity-50"
                        >
                          {addingIndex === i ? t("loading") : t("addToProject")}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && <p className="text-xs text-slate-400 dark:text-slate-500">{t("assistantThinking")}</p>}
          </div>

          <form onSubmit={handleSend} className="flex gap-2 p-2 border-t border-slate-100 dark:border-slate-700">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("assistantPlaceholder")}
              className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={loading}
              className="text-xs bg-violet-600 text-white px-3 py-1 rounded-lg hover:bg-violet-700 disabled:opacity-50"
            >
              {t("send")}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
