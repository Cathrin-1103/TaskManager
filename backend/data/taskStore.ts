import fs from "fs";
import path from "path";
import { TasksMap } from "../types";


const TASKS_FILE = path.resolve("data/tasks.json");

export function readTasks(): TasksMap {
  if (!fs.existsSync(TASKS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(TASKS_FILE, "utf-8")) as TasksMap;
  } catch {
    return {};
  }
}

export function saveTasks(tasks: TasksMap): void {
  const dir = path.dirname(TASKS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), "utf-8");
}

export function getNextTaskId(tasks: TasksMap): string {
  const numericIds = Object.keys(tasks)
    .map((id) => parseInt(id, 10))
    .filter((num) => !isNaN(num));

  const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
  return (maxId + 1).toString();
}

