/**
 * Task-breakdown assistant, backed by the DeepSeek API.
 *
 * The API key lives ONLY server-side (process.env.DEEPSEEK_API_KEY, from
 * backend/.env) - the frontend never sees it, and never talks to DeepSeek
 * directly. This is the standard pattern for any third-party API key: the
 * browser can't be trusted to keep a secret, so all calls are proxied
 * through this backend.
 *
 * MODEL CHOICE: deepseek-v4-flash - DeepSeek's cheap/fast tier, chosen for
 * cost (a fraction of the price of GPT-4-class models), which matters for
 * a student project making many test calls during development. Quality
 * is more than sufficient for short, structured task-breakdown replies.
 *
 * JSON MODE: DeepSeek supports response_format: {type: "json_object"},
 * which we use to make EVERY reply parseable - both plain chat replies
 * and structured task breakdowns are wrapped in a small JSON envelope
 * (see SYSTEM_PROMPT), so the frontend never has to guess which kind of
 * reply it got.
 */

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-v4-flash";

const SYSTEM_PROMPT = `
Esti Crabby, un asistent prietenos, in forma de crab, integrat intr-o aplicatie
de gestionare a proiectelor care foloseste metoda drumului critic (CPM).
Scopul tau principal este sa ajuti utilizatorul sa sparga un task mare
intr-un lant de sub-task-uri mai mici, realizabile, in ordine logica.

Raspunde STRICT in format JSON, fara text in afara JSON-ului, cu una din
cele doua forme:

1. Cand utilizatorul cere sa sparga un task mare in bucati mai mici:
{"type": "breakdown", "message": "un mesaj scurt, prietenos", "subtasks": [{"title": "...", "duration": 1}, ...]}
("duration" e un numar intreg de zile, minim 1, o estimare rezonabila)

2. Pentru orice alt raspuns conversational (intrebari generale, clarificari):
{"type": "chat", "message": "raspunsul tau"}

Fii concis. Nu propune mai mult de 8 sub-task-uri intr-o singura spargere.
`.trim();

function buildContextNote(existingTasks) {
  if (!existingTasks || existingTasks.length === 0) {
    return "Proiectul nu are inca niciun task.";
  }
  const titles = existingTasks.map((t) => `- ${t.title}`).join("\n");
  return `Task-urile deja existente in acest proiect, pentru context:\n${titles}`;
}

/**
 * @param {string} userMessage
 * @param {{role: "user"|"assistant", content: string}[]} history - recent
 *   turns, sent by the frontend since nothing is persisted server-side
 *   (see conversation notes - deliberately kept simple, no chat-history table).
 * @param {{title: string}[]} existingTasks - current project's tasks, for context.
 */
async function askAssistant(userMessage, history, existingTasks) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error(
      "DEEPSEEK_API_KEY is not set. Add it to backend/.env (see .env for the placeholder)."
    );
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT + "\n\n" + buildContextNote(existingTasks) },
    ...history,
    { role: "user", content: userMessage },
  ];

  const response = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      response_format: { type: "json_object" },
      // deepseek-v4-flash defaults to "thinking" mode (internal chain-of-
      // thought) ON, which competes with max_tokens for budget - it can
      // consume the whole budget on reasoning and leave nothing for the
      // actual reply, which is exactly the "empty response" symptom this
      // fixes. This task (breaking a job into subtasks) doesn't need deep
      // reasoning, so disabling it is both cheaper and more reliable.
      thinking: { type: "disabled" },
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    let readableMessage = errText;
    try {
      const parsed = JSON.parse(errText);
      readableMessage = parsed.error?.message || errText;
    } catch {
      // errText wasn't JSON - just use it as-is.
    }
    throw new Error(`DeepSeek: ${readableMessage}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) {
    throw new Error("DeepSeek returned an empty response - try rephrasing your message.");
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Fall back to treating it as a plain chat message if, despite JSON
    // mode, parsing still fails (DeepSeek's docs note this can happen
    // occasionally) - better to show something than to error out.
    parsed = { type: "chat", message: raw };
  }

  return parsed;
}

module.exports = { askAssistant };
