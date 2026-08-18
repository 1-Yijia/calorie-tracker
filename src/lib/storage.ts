import type { Entry } from "../types";

const KEY = "calorie-tracker/entries/v1";

/** Local calendar day as "YYYY-MM-DD" (not UTC). */
export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function readAll(): Entry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Entry[]) : [];
  } catch {
    return [];
  }
}

function writeAll(entries: Entry[]): void {
  localStorage.setItem(KEY, JSON.stringify(entries));
}

export function getEntriesForDay(date: string): Entry[] {
  return readAll()
    .filter((e) => e.date === date)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function addEntry(entry: Entry): void {
  const all = readAll();
  all.push(entry);
  writeAll(all);
}

export function deleteEntry(id: string): void {
  writeAll(readAll().filter((e) => e.id !== id));
}

export function updateEntry(id: string, patch: Partial<Entry>): void {
  writeAll(readAll().map((e) => (e.id === id ? { ...e, ...patch } : e)));
}

/** Days that have at least one entry, newest first — used by the date switcher. */
export function daysWithEntries(): string[] {
  const set = new Set(readAll().map((e) => e.date));
  return [...set].sort((a, b) => b.localeCompare(a));
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
