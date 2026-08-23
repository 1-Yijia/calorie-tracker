import type {
  FoodItem,
  Limits,
  LogEntry,
  MealSlotId,
  Nutrients,
  Profile,
} from "../types";

const K = {
  profile: "ct/profile/v2",
  limits: "ct/limits/v2",
  foods: "ct/foods/v2",
  logs: "ct/logs/v2",
};

export const FAVOURITE_CAP = 25;

/* ---------- generic helpers ---------- */

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Local calendar day as "YYYY-MM-DD". */
export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ---------- profile + limits ---------- */

export function getProfile(): Profile | null {
  return read<Profile | null>(K.profile, null);
}
export function setProfile(p: Profile): void {
  write(K.profile, p);
}

export function getLimits(): Limits | null {
  return read<Limits | null>(K.limits, null);
}
export function setLimits(l: Limits): void {
  write(K.limits, l);
}

export function isOnboarded(): boolean {
  return getProfile() !== null && getLimits() !== null;
}

/* ---------- food items (cache + favourites) ---------- */

function readFoods(): FoodItem[] {
  return read<FoodItem[]>(K.foods, []);
}
function writeFoods(items: FoodItem[]): void {
  write(K.foods, items);
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export function getFoodItem(id: string): FoodItem | undefined {
  return readFoods().find((f) => f.id === id);
}

/** Instant, API-free search over cached items by name substring. */
export function searchFoodItems(query: string): FoodItem[] {
  const q = normalize(query);
  const items = readFoods();
  const matched = q ? items.filter((f) => normalize(f.name).includes(q)) : items;
  return matched.sort(byRecency);
}

export function recentItems(limit = 50): FoodItem[] {
  return readFoods().sort(byRecency).slice(0, limit);
}

export function favourites(): FoodItem[] {
  return readFoods()
    .filter((f) => f.favourite)
    .sort(byRecency);
}

export function favouriteCount(): number {
  return readFoods().filter((f) => f.favourite).length;
}

function byRecency(a: FoodItem, b: FoodItem): number {
  return b.lastUsedAt - a.lastUsedAt || b.useCount - a.useCount;
}

/** Insert a new cached food item (from AI or manual entry). */
export function addFoodItem(
  data: Omit<FoodItem, "id" | "favourite" | "useCount" | "lastUsedAt">,
): FoodItem {
  const item: FoodItem = {
    ...data,
    id: newId(),
    favourite: false,
    useCount: 0,
    lastUsedAt: Date.now(),
  };
  writeFoods([item, ...readFoods()]);
  return item;
}

export function updateFoodItem(id: string, patch: Partial<FoodItem>): void {
  writeFoods(readFoods().map((f) => (f.id === id ? { ...f, ...patch } : f)));
}

/** Toggle favourite; returns false (and no-ops) if it would exceed the cap. */
export function toggleFavourite(id: string): boolean {
  const items = readFoods();
  const item = items.find((f) => f.id === id);
  if (!item) return false;
  if (!item.favourite && items.filter((f) => f.favourite).length >= FAVOURITE_CAP)
    return false;
  writeFoods(
    items.map((f) => (f.id === id ? { ...f, favourite: !f.favourite } : f)),
  );
  return true;
}

export function bumpUsage(id: string, at = Date.now()): void {
  writeFoods(
    readFoods().map((f) =>
      f.id === id ? { ...f, useCount: f.useCount + 1, lastUsedAt: at } : f,
    ),
  );
}

/* ---------- log entries ---------- */

function readLogs(): LogEntry[] {
  return read<LogEntry[]>(K.logs, []);
}
function writeLogs(entries: LogEntry[]): void {
  write(K.logs, entries);
}

export function entriesForDay(date: string): LogEntry[] {
  return readLogs()
    .filter((e) => e.date === date)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function entriesForSlot(date: string, slotId: MealSlotId): LogEntry[] {
  return entriesForDay(date).filter((e) => e.slot === slotId);
}

export function addEntries(entries: LogEntry[]): void {
  if (entries.length === 0) return;
  writeLogs([...readLogs(), ...entries]);
  // Bump usage on the underlying cached items.
  const now = Date.now();
  for (const e of entries) bumpUsage(e.foodItemId, now);
}

export function deleteEntry(id: string): void {
  writeLogs(readLogs().filter((e) => e.id !== id));
}

/* ---------- totals ---------- */

const ZERO: Nutrients = { calories: 0, sugarG: 0, sodiumMg: 0 };

export function entryTotals(e: LogEntry): Nutrients {
  return {
    calories: Math.round(e.perUnit.calories * e.quantity),
    sugarG: Math.round(e.perUnit.sugarG * e.quantity),
    sodiumMg: Math.round(e.perUnit.sodiumMg * e.quantity),
  };
}

export function sumNutrients(list: Nutrients[]): Nutrients {
  return list.reduce(
    (acc, n) => ({
      calories: acc.calories + n.calories,
      sugarG: acc.sugarG + n.sugarG,
      sodiumMg: acc.sodiumMg + n.sodiumMg,
    }),
    { ...ZERO },
  );
}

export function slotTotals(date: string, slotId: MealSlotId): Nutrients {
  return sumNutrients(entriesForSlot(date, slotId).map(entryTotals));
}

export function dayTotals(date: string): Nutrients {
  return sumNutrients(entriesForDay(date).map(entryTotals));
}
