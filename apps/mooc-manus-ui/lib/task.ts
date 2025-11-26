export type TaskResult<T = unknown> =
  | { success: true; value: T }
  | { success: false; error: unknown };

export function createParallelTask(n: number) {
  const taskQueue: Array<() => Promise<unknown>> = [];
  const results: TaskResult[] = [];
  let runningCount = 0;
  let resolveRun: ((results: TaskResult[]) => void) | null = null;
  let hasStarted = false;

  function addTask(task: () => Promise<unknown>) {
    if (hasStarted) {
      throw new Error('Cannot add task after run() has been called');
    }
    taskQueue.push(task);
  }

  async function executeNext() {
    if (taskQueue.length === 0 && runningCount === 0) {
      if (resolveRun) {
        resolveRun(results);
      }
      return;
    }

    if (taskQueue.length === 0 || runningCount >= n) {
      return;
    }

    const task = taskQueue.shift();
    if (!task) {
      return;
    }

    runningCount++;

    try {
      const value = await task();
      results.push({ success: true, value });
    } catch (error) {
      results.push({ success: false, error });
    } finally {
      runningCount--;
      await executeNext();
    }
  }

  async function run(): Promise<TaskResult[]> {
    if (hasStarted) {
      throw new Error('run() has already been called');
    }
    hasStarted = true;

    return new Promise<TaskResult[]>((resolve) => {
      resolveRun = resolve;

      if (taskQueue.length === 0) {
        resolve([]);
        return;
      }

      const initialTasks = Math.min(n, taskQueue.length);
      for (let i = 0; i < initialTasks; i++) {
        executeNext();
      }
    });
  }

  return { addTask, run };
}
