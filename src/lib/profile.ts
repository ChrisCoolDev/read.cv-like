import fs from "node:fs";
import path from "node:path";
import type { ProfileData } from "./types";

const PROFILE_PATH = path.join(process.cwd(), "data", "profile.json");

export function getProfile(): ProfileData {
  const raw = fs.readFileSync(PROFILE_PATH, "utf-8");
  return JSON.parse(raw) as ProfileData;
}

export function saveProfile(data: ProfileData): ProfileData {
  const dir = path.dirname(PROFILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(PROFILE_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
  return data;
}

export function isLocalEditorEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}
