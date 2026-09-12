
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { topologicalSort } = require("./topologicalSort");

describe("topologicalSort", () => {
  test("un task fara nicio dependenta se sorteaza singur", () => {
    const tasks = [{ id: 1, dependencies: [] }];
    assert.deepEqual(topologicalSort(tasks), [1]);
  });

  test("un lant simplu A -> B -> C pastreaza exact ordinea asta", () => {
    const tasks = [
      { id: "A", dependencies: [] },
      { id: "B", dependencies: ["A"] },
      { id: "C", dependencies: ["B"] },
    ];
    assert.deepEqual(topologicalSort(tasks), ["A", "B", "C"]);
  });

  test("fiecare task apare strict dupa toate dependentele lui", () => {
    const tasks = [
      { id: 1, dependencies: [] },
      { id: 2, dependencies: [1] },
      { id: 3, dependencies: [1] },
      { id: 4, dependencies: [2, 3] },
    ];
    const order = topologicalSort(tasks);
    const pozitia = (id) => order.indexOf(id);

    assert.equal(order.length, tasks.length);
    for (const task of tasks) {
      for (const depId of task.dependencies) {
        assert.ok(
          pozitia(depId) < pozitia(task.id),
          `dependenta ${depId} ar trebui sa apara inaintea task-ului ${task.id}`
        );
      }
    }
  });

  test("arunca eroare cand graful are un ciclu de 2 task-uri (A depinde de B, B depinde de A)", () => {
    const tasks = [
      { id: "A", dependencies: ["B"] },
      { id: "B", dependencies: ["A"] },
    ];
    assert.throws(() => topologicalSort(tasks), /Dependency cycle detected/);
  });

  test("arunca eroare cand graful are un ciclu mai lung (A -> B -> C -> A)", () => {
    const tasks = [
      { id: "A", dependencies: ["C"] },
      { id: "B", dependencies: ["A"] },
      { id: "C", dependencies: ["B"] },
    ];
    assert.throws(() => topologicalSort(tasks), /Dependency cycle detected/);
  });

  test("arunca eroare cand un task depinde de un id care nu exista in lista", () => {
    const tasks = [{ id: 1, dependencies: [999] }];
    assert.throws(() => topologicalSort(tasks), /depends on unknown task/);
  });

  test("nu marcheaza gresit un task independent ca facand parte dintr-un ciclu", () => {

    const tasks = [
      { id: "A", dependencies: ["B"] },
      { id: "B", dependencies: ["A"] },
      { id: "C", dependencies: [] },
    ];
    assert.throws(() => topologicalSort(tasks), (err) => {
      assert.match(err.message, /A/);
      assert.match(err.message, /B/);
      assert.doesNotMatch(err.message, /\bC\b/);
      return true;
    });
  });
});