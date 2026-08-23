import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppBar } from "../components/AppBar";
import { CalorieRing } from "../components/CalorieRing";
import { dayTotals, getLimits, todayKey } from "../lib/storage";

type Mode = "month" | "week";
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
/** Monday-first weekday index (0 = Mon … 6 = Sun). */
function dow(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export default function Trends() {
  const nav = useNavigate();
  const limits = getLimits();
  const limit = limits?.calories ?? 0;
  const today = todayKey();

  const [mode, setMode] = useState<Mode>("month");
  const [cursor, setCursor] = useState(today); // any day inside the shown period

  const cur = toDate(cursor);

  // Build the list of day-keys to render for the current period.
  const days = useMemo(() => {
    if (mode === "week") {
      const start = new Date(cur);
      start.setDate(cur.getDate() - dow(cur));
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return todayKey(d);
      });
    }
    // month: leading blanks + each day of month
    const first = new Date(cur.getFullYear(), cur.getMonth(), 1);
    const daysInMonth = new Date(
      cur.getFullYear(),
      cur.getMonth() + 1,
      0,
    ).getDate();
    const cells: (string | null)[] = Array(dow(first)).fill(null);
    for (let i = 1; i <= daysInMonth; i++)
      cells.push(todayKey(new Date(cur.getFullYear(), cur.getMonth(), i)));
    return cells;
  }, [mode, cursor]);

  // Stats over the days that have passed (up to today) in this period.
  const stats = useMemo(() => {
    const real = days.filter((k): k is string => !!k && k <= today);
    let logged = 0;
    let onTarget = 0;
    let sum = 0;
    for (const k of real) {
      const cals = dayTotals(k).calories;
      if (cals > 0) {
        logged++;
        sum += cals;
        if (limit > 0 && cals <= limit) onTarget++;
      }
    }
    return {
      logged,
      onTarget,
      avg: logged ? Math.round(sum / logged) : 0,
    };
  }, [days, limit, today]);

  function shift(delta: number) {
    const d = toDate(cursor);
    if (mode === "week") d.setDate(d.getDate() + delta * 7);
    else d.setMonth(d.getMonth() + delta);
    setCursor(todayKey(d));
  }

  const periodLabel =
    mode === "month"
      ? cur.toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : `Week of ${toDate(days[0] as string).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
        })}`;

  function renderDay(key: string) {
    const d = toDate(key);
    const cals = dayTotals(key).calories;
    const future = key > today;
    const isToday = key === today;
    return (
      <button
        key={key}
        className={`day-cell ${isToday ? "today" : ""}`}
        disabled={future}
        onClick={() => nav(`/summary?date=${key}`)}
      >
        <span className="daynum">{d.getDate()}</span>
        <CalorieRing consumed={future ? 0 : cals} limit={limit} />
        {mode === "week" && (
          <span className="daycal tnum">{future ? "" : cals || "–"}</span>
        )}
      </button>
    );
  }

  return (
    <div className="screen">
      <AppBar title="Trends" back />
      <div className="content">
        {/* period nav */}
        <div className="trends-head">
          <button className="iconbtn" aria-label="Previous" onClick={() => shift(-1)}>
            ‹
          </button>
          <span className="period">{periodLabel}</span>
          <button
            className="iconbtn"
            aria-label="Next"
            disabled={mode === "month"
              ? cur.getFullYear() === toDate(today).getFullYear() &&
                cur.getMonth() === toDate(today).getMonth()
              : (days[6] as string) >= today}
            onClick={() => shift(1)}
          >
            ›
          </button>
        </div>

        {/* mode toggle */}
        <div className="toggle">
          <button
            className={mode === "week" ? "active" : ""}
            onClick={() => setMode("week")}
          >
            Week
          </button>
          <button
            className={mode === "month" ? "active" : ""}
            onClick={() => setMode("month")}
          >
            Month
          </button>
        </div>

        {/* stats */}
        <div className="stats card">
          <div className="stat">
            <div className="s-n tnum">{stats.avg.toLocaleString()}</div>
            <div className="s-l">avg kcal</div>
          </div>
          <div className="stat">
            <div className="s-n tnum">
              {stats.onTarget}
              <span className="s-of">/{stats.logged}</span>
            </div>
            <div className="s-l">within limit</div>
          </div>
          <div className="stat">
            <div className="s-n tnum">{stats.logged}</div>
            <div className="s-l">days logged</div>
          </div>
        </div>

        {/* grid */}
        {mode === "month" && (
          <div className="weekdays">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
        )}
        <div className={`grid ${mode}`}>
          {days.map((k, i) =>
            k ? renderDay(k) : <span key={`b${i}`} className="day-cell blank" />,
          )}
        </div>

        <div className="legend">
          <span>
            <i className="dot good" /> within limit
          </span>
          <span>
            <i className="dot over" /> over limit
          </span>
          <span>Tap a day to view it</span>
        </div>
      </div>
    </div>
  );
}
