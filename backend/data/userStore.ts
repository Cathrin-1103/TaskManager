import fs from "fs";
import path from "path";
import { UsersMap } from "../types";


const USERS_FILE = path.resolve("data/users.json");

export function readUsers(): UsersMap {
  if (!fs.existsSync(USERS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8")) as UsersMap;
  } catch {
    return {};
  }
}

export function saveUsers(users: UsersMap): void {
  const dir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}
