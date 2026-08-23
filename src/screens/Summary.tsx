import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppBar } from "../components/AppBar";
import { SLOTS } from "../lib/slots";
import {
  dayTotals,
  deleteEntry,
  entriesForSlot,
  entryTotals,
  todayKey,
} from "../lib/storage";

function prettyDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Summary() {
  const [params] = useSearchParams();
  const date = params.get("date") ?? todayKey();
  const [tick, setTick] = useState(0);

  void tick; // re-read storage on each render after a delete
  const total = dayTotals(date);

  function remove(id: string, name: string) {
    if (confirm(`Delete “${name}” from your log?`)) {
      deleteEntry(id);
      setTick((t) => t + 1);
    }
  }

  return (
    <div className="screen">
      <AppBar title="Daily Summary" back />
      <div className="content">
        <div className="datebar">
          <span className="day">{prettyDate(date)}</span>
        </div>

        <div className="big-total">
          <div className="n tnum">{total.calories.toLocaleString()}</div>
          <div className="u">total calories consumed</div>
          <div className="u tnum" style={{ marginTop: 6 }}>
            {total.sugarG}g sugar · {total.sodiumMg}mg sodium
          </div>
        </div>

        <div className="timeline">
          {SLOTS.map((s) => {
            const entries = entriesForSlot(date, s.id);
            const kcal = entries.reduce((sum, e) => sum + entryTotals(e).calories, 0);
            const has = entries.length > 0;
            return (
              <div className="tl-item" key={s.id}>
                <span className={`tl-dot ${has ? "filled" : ""}`} />
                {has ? (
                  <div className="tl-card">
                    <div className="tl-head">
                      <span className="lbl">
                        {s.name} <span className="rng">· {s.range}</span>
                      </span>
                      <span className="kc tnum">{kcal} kcal</span>
                    </div>
                    {entries.map((e) => (
                      <div className="tl-line" key={e.id}>
                        <span>
                          {e.name}{" "}
                          <span className="qn tnum">
                            × {e.quantity} {e.unit}
                          </span>
                        </span>
                        <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <span className="tnum">{entryTotals(e).calories} kcal</span>
                          <button
                            className="trash"
                            aria-label={`Delete ${e.name}`}
                            onClick={() => remove(e.id, e.name)}
                            style={{ border: "none", background: "none", cursor: "pointer" }}
                          >
                            🗑
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="tl-empty">
                    <span className="rng">
                      {s.name} · {s.range}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
