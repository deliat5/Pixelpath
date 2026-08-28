/**
 * Critical Path Method (CPM).
 *
 * WHY THIS EXISTS:
 * Given a DAG of tasks with durations, CPM finds the longest path through
 * the graph (the "critical path"). Tasks on this path have zero slack -
 * delaying any of them delays the entire project. This is classic
 * project-scheduling theory (see PERT/CPM literature), which gives this
 * thesis a well-grounded theoretical chapter, not an invented one.
 *
 * ALGORITHM OUTLINE (two passes over the topologically sorted tasks):
 *
 *   1. FORWARD PASS (earliest times):
 *      earliestStart(task)  = max(earliestFinish(dep) for dep in dependencies,
 *                                  task.notBeforeOffset ?? 0)
 *      earliestFinish(task) = earliestStart(task) + duration(task)
 *
 *      EXTENSION: `notBeforeOffset` is an optional user-chosen "ready
 *      date" floor (translated from a real calendar date to a day offset
 *      before this function is called - see services/projectGraph.js).
 *      This is a standard CPM/PERT extension for resource-availability /
 *      ready-date constraints, not an override of the algorithm: it just
 *      participates in the same max() as the dependency-derived value, so
 *      dependencies can still push a task later than its ready date, but
 *      never earlier.
 *
 *   2. BACKWARD PASS (latest times), processed in REVERSE topological order:
 *      latestFinish(task) = min(latestStart(dependent) for dependent in dependents),
 *                            or projectDuration if task has no dependents
 *      latestStart(task)  = latestFinish(task) - duration(task)
 *
 *   3. SLACK:
 *      slack(task) = latestStart(task) - earliestStart(task)
 *      A task is CRITICAL if slack === 0.
 *
 * COMPLEXITY: O(V + E), same as topological sort, since each pass visits
 * every node and every edge exactly once.
 *
 * INPUT FORMAT:
 *   tasks = [
 *     { id: 1, duration: 3, dependencies: [], notBeforeOffset: null },
 *     { id: 2, duration: 2, dependencies: [1] },
 *     { id: 3, duration: 4, dependencies: [1] },
 *     { id: 4, duration: 1, dependencies: [2, 3] },
 *   ]
 *
 * OUTPUT:
 *   {
 *     projectDuration: <total duration of the critical path>,
 *     criticalPath: [ids of tasks with zero slack, in order],
 *     tasks: [ ...original task, plus earliestStart/earliestFinish/
 *              latestStart/latestFinish/slack/isCritical ]
 *   }
 */

const { topologicalSort } = require("./topologicalSort");

function computeCPM(tasks) {
  const order = topologicalSort(tasks); // throws if the graph has a cycle

  const taskById = new Map(tasks.map((t) => [t.id, { ...t }]));

  // Reverse adjacency: for each task, which tasks depend on it directly.
  const dependents = new Map(tasks.map((t) => [t.id, []]));
  for (const task of tasks) {
    for (const depId of task.dependencies) {
      dependents.get(depId).push(task.id);
    }
  }

  // --- FORWARD PASS: earliest start / earliest finish ---
  for (const taskId of order) {
    const task = taskById.get(taskId);
    const dependencyEarliest =
      task.dependencies.length === 0
        ? 0
        : Math.max(...task.dependencies.map((depId) => taskById.get(depId).earliestFinish));
    const readyDateFloor = task.notBeforeOffset ?? 0;

    task.earliestStart = Math.max(dependencyEarliest, readyDateFloor);
    task.earliestFinish = task.earliestStart + task.duration;
  }

  // Project duration = the latest earliestFinish across all tasks
  // (the length of the longest path through the graph).
  const projectDuration = Math.max(...order.map((id) => taskById.get(id).earliestFinish));

  // --- BACKWARD PASS: latest finish / latest start ---
  // Must process tasks in REVERSE topological order, because a task's
  // latestFinish depends on the latestStart of everything that comes after it.
  const reverseOrder = [...order].reverse();
  for (const taskId of reverseOrder) {
    const task = taskById.get(taskId);
    const taskDependents = dependents.get(taskId);

    if (taskDependents.length === 0) {
      // No task depends on this one -> it can finish as late as the project end.
      task.latestFinish = projectDuration;
    } else {
      task.latestFinish = Math.min(
        ...taskDependents.map((depId) => taskById.get(depId).latestStart)
      );
    }
    task.latestStart = task.latestFinish - task.duration;
  }

  // --- SLACK + CRITICALITY ---
  const criticalPath = [];
  for (const taskId of order) {
    const task = taskById.get(taskId);
    task.slack = task.latestStart - task.earliestStart;
    task.isCritical = task.slack === 0;
    if (task.isCritical) criticalPath.push(taskId);
  }

  return {
    projectDuration,
    criticalPath,
    tasks: order.map((id) => taskById.get(id)),
  };
}

module.exports = { computeCPM };
