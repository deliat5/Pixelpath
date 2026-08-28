/**
 * Topological sort (Kahn's algorithm) over the task dependency graph.
 *
 * WHY THIS EXISTS:
 * The task graph must be a DAG (Directed Acyclic Graph) - a task cannot
 * (directly or indirectly) depend on itself, or the whole notion of
 * "critical path" breaks down. This function does two things at once:
 *   1. Detects cycles and rejects them (data validation).
 *   2. Produces a valid execution order, which the CPM algorithm (cpm.js)
 *      needs as a prerequisite for its forward pass.
 *
 * COMPLEXITY: O(V + E) where V = number of tasks, E = number of dependency edges.
 *
 * INPUT FORMAT:
 *   tasks = [
 *     { id: 1, dependencies: [] },         // no prerequisites
 *     { id: 2, dependencies: [1] },        // depends on task 1
 *     { id: 3, dependencies: [1, 2] },
 *   ]
 *   (dependencies = array of task IDs that must finish before this task starts)
 *
 * OUTPUT:
 *   Array of task IDs in a valid topological order.
 *   Throws an Error if a cycle is detected.
 */

function topologicalSort(tasks) {
  const adjacency = new Map();
  const inDegree = new Map();

  for (const task of tasks) {
    adjacency.set(task.id, []);
    inDegree.set(task.id, 0);
  }

  for (const task of tasks) {
    for (const depId of task.dependencies) {
      if (!adjacency.has(depId)) {
        throw new Error("Task " + task.id + " depends on unknown task " + depId);
      }
      adjacency.get(depId).push(task.id);
      inDegree.set(task.id, inDegree.get(task.id) + 1);
    }
  }

  const queue = [];
  for (const [taskId, degree] of inDegree.entries()) {
    if (degree === 0) queue.push(taskId);
  }

  const sortedOrder = [];

  while (queue.length > 0) {
    const current = queue.shift();
    sortedOrder.push(current);

    for (const neighbor of adjacency.get(current)) {
      inDegree.set(neighbor, inDegree.get(neighbor) - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (sortedOrder.length !== tasks.length) {
    const stuckTasks = tasks.map((t) => t.id).filter((id) => !sortedOrder.includes(id));
    throw new Error("Dependency cycle detected involving task(s): " + stuckTasks.join(", "));
  }

  return sortedOrder;
}

module.exports = { topologicalSort };
