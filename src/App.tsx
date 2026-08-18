import { useEffect, useMemo, useState } from "react";
import type { Entry, Estimate } from "./types";
import {
  addEntry,
  deleteEntry,
  getEntriesForDay,
  newId,
  todayKey,
} from "./lib/storage";
import { estimate as callEstimate } from "./lib/estimate";
import { DailyTotal } from "./components/DailyTotal";
import { EntryInput } from "./components/EntryInput";
import { EstimateCard } from "./components/EstimateCard";
import { EntryList } from "./components/EntryList";

type Pending = { description: string; estimate: Estimate };

function shiftDay(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return todayKey(dt);
}

function prettyDate(dateKey: string): string {
  if (dateKey === todayKey()) return "Today";
  if (dateKey === shiftDay(todayKey(), -1)) return "Yesterday";
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function App() {
  const [date, setDate] = useState(todayKey());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [pending, setPending] = useState<Pending | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isToday = date === todayKey();

  function refresh(forDate = date) {
    setEntries(getEntriesForDay(forDate));
  }

  useEffect(() => {
    refresh(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function handleEstimate(text: string) {
    setError(null);
    setPending(null);
    setLoading(true);
    try {
      const est = await callEstimate(text);
      setPending({ description: text, estimate: est });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleSave(calories: number) {
    if (!pending) return;
    const e = pending.estimate;
    const entry: Entry = {
      id: newId(),
      date, // save under the day currently being viewed
      description: pending.description,
      foodName: e.foodName,
      quantity: e.quantity,
      calories,
      protein: e.protein,
      carbs: e.carbs,
      fat: e.fat,
      confidence: e.confidence,
      createdAt: Date.now(),
    };
    addEntry(entry);
    setPending(null);
    refresh();
  }

  function handleDelete(id: string) {
    deleteEntry(id);
    refresh();
  }

  const header = useMemo(() => prettyDate(date), [date]);

  return (
    <div className="app">
      <header className="app-header">
        <button
          className="nav"
          aria-label="Previous day"
          onClick={() => setDate((d) => shiftDay(d, -1))}
        >
          ‹
        </button>
        <div className="day-label">{header}</div>
        <button
          className="nav"
          aria-label="Next day"
          disabled={isToday}
          onClick={() => setDate((d) => shiftDay(d, 1))}
        >
          ›
        </button>
      </header>

      <DailyTotal entries={entries} />

      {isToday && (
        <section className="composer">
          <EntryInput onEstimate={handleEstimate} loading={loading} />
          {error && <p className="error">{error}</p>}
          {pending && (
            <EstimateCard
              description={pending.description}
              estimate={pending.estimate}
              onSave={handleSave}
              onDiscard={() => setPending(null)}
            />
          )}
        </section>
      )}

      <EntryList entries={entries} onDelete={handleDelete} />

      <footer className="foot">
        Estimates are approximate — tap a number to adjust before saving.
      </footer>
    </div>
  );
}
