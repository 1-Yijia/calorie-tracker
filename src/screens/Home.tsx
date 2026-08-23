import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppBar } from "../components/AppBar";
import { NutrientCard } from "../components/NutrientCard";
import { MealSlotRow } from "../components/MealSlotRow";
import { SLOTS } from "../lib/slots";
import {
  dayTotals,
  entriesForSlot,
  getLimits,
  slotTotals,
  todayKey,
} from "../lib/storage";
import type { Limits, Nutrients } from "../types";

function shiftDay(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return todayKey(new Date(y, m - 1, d + delta));
}
function prettyDate(dateKey: string): string {
  if (dateKey === todayKey()) return "Today";
  if (dateKey === shiftDay(todayKey(), -1)) return "Yesterday";
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Home() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [date, setDate] = useState(params.get("date") ?? todayKey());
  const [limits, setLimits] = useState<Limits | null>(null);
  const [totals, setTotals] = useState<Nutrients>({
    calories: 0,
    sugarG: 0,
    sodiumMg: 0,
  });
  const [perSlot, setPerSlot] = useState<Record<string, { kcal: number; count: number }>>(
    {},
  );

  useEffect(() => {
    setLimits(getLimits());
    setTotals(dayTotals(date));
    const map: Record<string, { kcal: number; count: number }> = {};
    for (const s of SLOTS) {
      map[s.id] = {
        kcal: slotTotals(date, s.id).calories,
        count: entriesForSlot(date, s.id).length,
      };
    }
    setPerSlot(map);
  }, [date]);

  const isToday = date === todayKey();

  return (
    <div className="screen">
      <AppBar
        title="Meal Log"
        right={
          <button
            className="iconbtn"
            aria-label="Trends"
            onClick={() => nav("/trends")}
          >
            📊
          </button>
        }
      />
      <div className="content">
        <div className="datebar">
          <button
            className="iconbtn"
            aria-label="Previous day"
            onClick={() => setDate((d) => shiftDay(d, -1))}
          >
            ‹
          </button>
          <span className="day">{prettyDate(date)}</span>
          <button
            className="iconbtn"
            aria-label="Next day"
            disabled={isToday}
            onClick={() => setDate((d) => shiftDay(d, 1))}
          >
            ›
          </button>
        </div>

        {limits && (
          <NutrientCard
            totals={totals}
            limits={limits}
            onEditLimits={() => nav("/limits")}
            onViewSummary={() => nav(`/summary?date=${date}`)}
          />
        )}

        <div className="section-title">What I have consumed</div>
        <div className="list">
          {SLOTS.map((s) => (
            <MealSlotRow
              key={s.id}
              def={s}
              calories={perSlot[s.id]?.kcal ?? 0}
              count={perSlot[s.id]?.count ?? 0}
              onOpen={() => nav(`/log/${s.id}?date=${date}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
