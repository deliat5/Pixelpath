
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { computeCPM } = require("./cpm");

function dupaId(result, id) {
  return result.tasks.find((t) => t.id === id);
}

describe("computeCPM", () => {
  test("graf tip diamant: valorile calculate corespund cu ce am calculat de mana", () => {
    const tasks = [
      { id: 1, duration: 3, dependencies: [] },
      { id: 2, duration: 2, dependencies: [1] },
      { id: 3, duration: 4, dependencies: [1] },
      { id: 4, duration: 1, dependencies: [2, 3] },
    ];

    const result = computeCPM(tasks);

    assert.equal(result.projectDuration, 8);
    assert.deepEqual(result.criticalPath.slice().sort(), [1, 3, 4]);

    assert.deepEqual(
      { earliestStart: dupaId(result, 1).earliestStart, earliestFinish: dupaId(result, 1).earliestFinish, slack: dupaId(result, 1).slack },
      { earliestStart: 0, earliestFinish: 3, slack: 0 }
    );
    assert.deepEqual(
      { earliestStart: dupaId(result, 2).earliestStart, earliestFinish: dupaId(result, 2).earliestFinish, slack: dupaId(result, 2).slack },
      { earliestStart: 3, earliestFinish: 5, slack: 2 }
    );
    assert.deepEqual(
      { earliestStart: dupaId(result, 3).earliestStart, earliestFinish: dupaId(result, 3).earliestFinish, slack: dupaId(result, 3).slack },
      { earliestStart: 3, earliestFinish: 7, slack: 0 }
    );
    assert.deepEqual(
      { earliestStart: dupaId(result, 4).earliestStart, earliestFinish: dupaId(result, 4).earliestFinish, slack: dupaId(result, 4).slack },
      { earliestStart: 7, earliestFinish: 8, slack: 0 }
    );

    assert.equal(dupaId(result, 1).isCritical, true);
    assert.equal(dupaId(result, 2).isCritical, false);
    assert.equal(dupaId(result, 3).isCritical, true);
    assert.equal(dupaId(result, 4).isCritical, true);
  });

  test("un singur task fara dependente e mereu critic", () => {
    const result = computeCPM([{ id: 1, duration: 5, dependencies: [] }]);
    assert.equal(result.projectDuration, 5);
    assert.equal(dupaId(result, 1).slack, 0);
    assert.equal(dupaId(result, 1).isCritical, true);
  });

  test("un lant liniar are slack 0 pe fiecare task (nu exista nicio ramura paralela in spatele careia sa se 'ascunda')", () => {
    const tasks = [
      { id: 1, duration: 2, dependencies: [] },
      { id: 2, duration: 3, dependencies: [1] },
      { id: 3, duration: 1, dependencies: [2] },
    ];
    const result = computeCPM(tasks);
    for (const task of result.tasks) {
      assert.equal(task.slack, 0, `task-ul ${task.id} ar trebui sa fie critic intr-un lant simplu`);
    }
    assert.equal(result.projectDuration, 6);
  });

  test("notBeforeOffset impinge earliestStart mai tarziu, dar niciodata mai devreme decat permit dependentele", () => {
    const tasks = [{ id: 1, duration: 2, dependencies: [], notBeforeOffset: 5 }];
    const result = computeCPM(tasks);
    assert.equal(dupaId(result, 1).earliestStart, 5);
    assert.equal(dupaId(result, 1).earliestFinish, 7);
  });

  test("notBeforeOffset nu micsoreaza earliestStart sub ce cer deja dependentele", () => {
    const tasks = [
      { id: 1, duration: 3, dependencies: [] },
      { id: 2, duration: 1, dependencies: [1], notBeforeOffset: 1 },
    ];
    const result = computeCPM(tasks);
    assert.equal(dupaId(result, 2).earliestStart, 3);
  });

  test("propaga eroarea de ciclu din topologicalSort (CPM nu poate rula pe un graf invalid)", () => {
    const tasks = [
      { id: 1, duration: 1, dependencies: [2] },
      { id: 2, duration: 1, dependencies: [1] },
    ];
    assert.throws(() => computeCPM(tasks), /Dependency cycle detected/);
  });
});