
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { recommendDailyTasks } = require("./dailyRecommendation");

describe("recommendDailyTasks", () => {
  test("sorteaza dupa slack crescator - task-ul cel mai urgent (slack cel mai mic) apare primul", () => {
    const tasks = [
      { id: "A", slack: 5, duration: 2, status: "pending" },
      { id: "B", slack: 0, duration: 1, status: "pending" },
      { id: "C", slack: 2, duration: 1, status: "pending" },
    ];
    const ranked = recommendDailyTasks(tasks);
    assert.deepEqual(ranked.map((t) => t.id), ["B", "C", "A"]);
  });

  test("la slack egal, departajarea se face dupa durata - task-ul mai lung apare primul", () => {
    const tasks = [
      { id: "scurt", slack: 0, duration: 1, status: "pending" },
      { id: "lung", slack: 0, duration: 5, status: "pending" },
    ];
    const ranked = recommendDailyTasks(tasks);
    assert.deepEqual(ranked.map((t) => t.id), ["lung", "scurt"]);
  });

  test("task-urile cu status 'done' sunt excluse din recomandare", () => {
    const tasks = [
      { id: "finalizat", slack: 0, duration: 10, status: "done" },
      { id: "in-asteptare", slack: 3, duration: 1, status: "pending" },
    ];
    const ranked = recommendDailyTasks(tasks);
    assert.deepEqual(ranked.map((t) => t.id), ["in-asteptare"]);
  });

  test("lista goala la intrare -> lista goala la iesire", () => {
    assert.deepEqual(recommendDailyTasks([]), []);
  });

  test("nu modifica array-ul primit ca parametru (returneaza un array nou, sortat)", () => {
    const tasks = [
      { id: "A", slack: 5, duration: 2, status: "pending" },
      { id: "B", slack: 0, duration: 1, status: "pending" },
    ];
    const original = [...tasks];
    recommendDailyTasks(tasks);
    assert.deepEqual(tasks, original);
  });
});