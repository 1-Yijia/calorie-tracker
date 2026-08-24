import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { AppBar } from "../components/AppBar";
import { SLOTS, slot } from "../lib/slots";
import { estimate } from "../lib/estimate";
import {
  addEntries,
  addFoodItem,
  deleteEntry,
  deleteFoodItem,
  entriesForSlot,
  entryTotals,
  favouriteCount,
  favourites,
  newId,
  searchFoodItems,
  todayKey,
  toggleFavourite,
  updateEntry,
  updateFoodItem,
  FAVOURITE_CAP,
} from "../lib/storage";
import type { FoodItem, LogEntry, MealSlotId } from "../types";

type Pending = { key: string; item: FoodItem; quantity: number };
const STEP = 0.25;

export default function LogSlot() {
  const { slot: slotParam } = useParams();
  const [params] = useSearchParams();
  const date = params.get("date") ?? todayKey();

  const [slotId, setSlotId] = useState<MealSlotId>(
    (SLOTS.find((s) => s.id === slotParam)?.id ?? "morning") as MealSlotId,
  );
  const [tab, setTab] = useState<"slot" | "fav">("slot");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const searching = query.trim().length > 0;
  const showAiRow = query.trim().length >= 2;

  // Saved entries for THIS slot + date (slot-specific).
  const logged = useMemo(
    () => entriesForSlot(date, slotId),
    [date, slotId, tick],
  );
  const favs = useMemo(() => favourites(), [tick]);
  const favCount = useMemo(() => favouriteCount(), [tick]);
  const favIds = useMemo(() => new Set(favs.map((f) => f.id)), [favs]);
  const matches = useMemo(
    () => (searching ? searchFoodItems(query) : []),
    [query, searching, tick],
  );

  /* ---- cache item actions ---- */
  function star(id: string) {
    const ok = toggleFavourite(id);
    setNotice(ok ? null : `Favourites are full (max ${FAVOURITE_CAP}).`);
    setTick((t) => t + 1);
  }
  function editItemCalories(item: FoodItem) {
    const v = prompt(
      `Calories in 1 ${item.unit} of "${item.name}":`,
      String(item.perUnit.calories),
    );
    if (v == null) return;
    const cals = Math.max(0, Math.round(Number(v) || 0));
    updateFoodItem(item.id, { perUnit: { ...item.perUnit, calories: cals } });
    setTick((t) => t + 1);
  }
  function deleteItem(item: FoodItem) {
    if (confirm(`Remove "${item.name}" from your saved items?`)) {
      deleteFoodItem(item.id);
      setTick((t) => t + 1);
    }
  }

  /* ---- pending (unsaved additions) ---- */
  function addToPending(item: FoodItem, quantity = 1) {
    setPending((p) => [...p, { key: newId(), item, quantity }]);
  }
  function setPendingQty(key: string, q: number) {
    setPending((p) =>
      p.map((x) => (x.key === key ? { ...x, quantity: Math.max(STEP, q) } : x)),
    );
  }
  function setPendingCalories(key: string, item: FoodItem, cals: number) {
    const perUnit = { ...item.perUnit, calories: Math.max(0, Math.round(cals || 0)) };
    updateFoodItem(item.id, { perUnit }); // persist correction to the cache
    setPending((p) =>
      p.map((x) => (x.key === key ? { ...x, item: { ...x.item, perUnit } } : x)),
    );
    setTick((t) => t + 1);
  }
  function removePending(key: string) {
    setPending((p) => p.filter((x) => x.key !== key));
  }

  async function runEstimate() {
    const q = query.trim();
    if (!q || loading) return;
    setError(null);
    setLoading(true);
    try {
      const est = await estimate(q);
      const item = addFoodItem({
        name: est.foodName,
        unit: est.unit,
        perUnit: {
          calories: est.caloriesPerUnit,
          sugarG: est.sugarPerUnitG,
          sodiumMg: est.sodiumPerUnitMg,
        },
        source: "ai",
      });
      addToPending(item, est.defaultQuantity);
      setQuery("");
      setTick((t) => t + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  /* ---- saved-entry actions ---- */
  function setEntryQty(id: string, q: number) {
    updateEntry(id, { quantity: Math.max(STEP, q) });
    setTick((t) => t + 1);
  }
  function removeEntry(id: string) {
    deleteEntry(id);
    setTick((t) => t + 1);
  }

  function save() {
    const entries: LogEntry[] = pending.map((p) => ({
      id: newId(),
      date,
      slot: slotId,
      foodItemId: p.item.id,
      name: p.item.name,
      unit: p.item.unit,
      perUnit: p.item.perUnit,
      quantity: p.quantity,
      createdAt: Date.now(),
    }));
    addEntries(entries);
    setPending([]);
    setTab("slot");
    setTick((t) => t + 1);
  }

  const totalKcal = pending.reduce(
    (s, p) => s + Math.round(p.item.perUnit.calories * p.quantity),
    0,
  );

  /* ---- render helpers ---- */
  function CacheRow({ f }: { f: FoodItem }) {
    return (
      <div className="result">
        <button
          className={`star ${favIds.has(f.id) ? "on" : ""}`}
          aria-label="Favourite"
          onClick={() => star(f.id)}
        >
          {favIds.has(f.id) ? "★" : "☆"}
        </button>
        <div className="info">
          <div className="rname">{f.name}</div>
          <div className="rmeta tnum">
            {f.perUnit.calories} kcal for 1 {f.unit}
          </div>
        </div>
        <button className="rowicon" aria-label="Edit calories" onClick={() => editItemCalories(f)}>
          ✎
        </button>
        <button className="rowicon" aria-label="Delete item" onClick={() => deleteItem(f)}>
          🗑
        </button>
        <button className="add" aria-label="Add" onClick={() => addToPending(f)}>
          +
        </button>
      </div>
    );
  }

  return (
    <div className="screen">
      <AppBar title="Meal Log" back />
      <div className="content">
        {/* slot picker */}
        <div className="field" style={{ margin: 0 }}>
          <select
            className="choice"
            style={{ width: "100%", fontWeight: 700 }}
            value={slotId}
            onChange={(e) => setSlotId(e.target.value as MealSlotId)}
          >
            {SLOTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.range})
              </option>
            ))}
          </select>
        </div>

        {/* search */}
        <div className="searchrow">
          <div className="search">
            <span className="mag">⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search or describe a food"
              autoComplete="off"
            />
            {query && (
              <button className="clr" onClick={() => setQuery("")} aria-label="Clear">
                ×
              </button>
            )}
          </div>
        </div>

        {error && <p className="error">{error}</p>}
        {notice && <p className="muted-note">{notice}</p>}

        {searching ? (
          /* ---- SEARCH MODE: cache matches + AI estimate ---- */
          <>
            {showAiRow && (
              <button className="ai-row" onClick={runEstimate} disabled={loading}>
                <span>✨</span>
                <span className="txt">
                  {loading
                    ? "Estimating with AI…"
                    : `Estimate “${query.trim()}” with AI`}
                </span>
              </button>
            )}
            {matches.length > 0 && (
              <div className="list">
                {matches.map((f) => (
                  <CacheRow key={f.id} f={f} />
                ))}
              </div>
            )}
          </>
        ) : (
          /* ---- BROWSE MODE: this slot's entries, or favourites ---- */
          <>
            <div className="tabs">
              <button
                className={tab === "slot" ? "active" : ""}
                onClick={() => setTab("slot")}
              >
                In {slot(slotId).name}
              </button>
              <button
                className={tab === "fav" ? "active" : ""}
                onClick={() => setTab("fav")}
              >
                My Favourites ({favCount}/{FAVOURITE_CAP})
              </button>
            </div>

            {tab === "slot" ? (
              logged.length > 0 ? (
                <div className="list">
                  {logged.map((e) => (
                    <div className="card pending" key={e.id}>
                      <div className="phead">
                        <div className="info">
                          <div className="pname">{e.name}</div>
                          <div className="pmeta tnum">
                            {e.perUnit.calories} kcal / {e.unit}
                          </div>
                        </div>
                        <button
                          className="trash"
                          aria-label="Remove"
                          onClick={() => removeEntry(e.id)}
                        >
                          🗑
                        </button>
                      </div>
                      <div className="pfoot">
                        <div className="stepper">
                          <button
                            aria-label="Less"
                            onClick={() => setEntryQty(e.id, e.quantity - STEP)}
                          >
                            −
                          </button>
                          <span className="qty tnum">{e.quantity}</span>
                          <button
                            aria-label="More"
                            onClick={() => setEntryQty(e.id, e.quantity + STEP)}
                          >
                            +
                          </button>
                          <span className="unit">{e.unit}</span>
                        </div>
                        <span className="pkcal tnum">{entryTotals(e).calories} kcal</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty">
                  <span className="big">🍽️</span>
                  Nothing logged for {slot(slotId).name} yet. Search a food above to add
                  it.
                </div>
              )
            ) : favs.length > 0 ? (
              <div className="list">
                {favs.map((f) => (
                  <CacheRow key={f.id} f={f} />
                ))}
              </div>
            ) : (
              <div className="empty">
                <span className="big">⭐</span>
                No favourites yet. Tap the ☆ on any item to save it here.
              </div>
            )}
          </>
        )}

        {/* pending additions */}
        {pending.length > 0 && (
          <>
            <div className="section-title">Adding to {slot(slotId).name}</div>
            <div className="list">
              {pending.map((p) => {
                const kcal = Math.round(p.item.perUnit.calories * p.quantity);
                return (
                  <div className="card pending" key={p.key}>
                    <div className="phead">
                      <div className="info">
                        <div className="pname">{p.item.name}</div>
                        <div className="pmeta">
                          <input
                            className="cal-inline tnum"
                            type="number"
                            inputMode="numeric"
                            value={p.item.perUnit.calories}
                            onChange={(e) =>
                              setPendingCalories(p.key, p.item, Number(e.target.value))
                            }
                          />{" "}
                          kcal / {p.item.unit} — tap to fix
                        </div>
                      </div>
                      <button
                        className="trash"
                        aria-label="Remove"
                        onClick={() => removePending(p.key)}
                      >
                        🗑
                      </button>
                    </div>
                    <div className="pfoot">
                      <div className="stepper">
                        <button
                          aria-label="Less"
                          onClick={() => setPendingQty(p.key, p.quantity - STEP)}
                        >
                          −
                        </button>
                        <span className="qty tnum">{p.quantity}</span>
                        <button
                          aria-label="More"
                          onClick={() => setPendingQty(p.key, p.quantity + STEP)}
                        >
                          +
                        </button>
                        <span className="unit">{p.item.unit}</span>
                      </div>
                      <span className="pkcal tnum">{kcal} kcal</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {pending.length > 0 && (
        <div className="savebar">
          <div className="total">
            Total intake for {slot(slotId).name}: <strong>{totalKcal} kcal</strong>
          </div>
          <button className="btn primary block" onClick={save}>
            Save {pending.length} item{pending.length > 1 ? "s" : ""}
          </button>
        </div>
      )}
    </div>
  );
}
