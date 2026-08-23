import type { SlotDef } from "../lib/slots";

export function MealSlotRow({
  def,
  calories,
  count,
  onOpen,
}: {
  def: SlotDef;
  calories: number;
  count: number;
  onOpen: () => void;
}) {
  return (
    <button className="slot" onClick={onOpen}>
      <span className="emoji" aria-hidden>
        {def.emoji}
      </span>
      <span className="mid">
        <span className="range">{def.range}</span>
        <div className="name">{def.name}</div>
        {count > 0 && (
          <span className="sub">
            {count} item{count > 1 ? "s" : ""}
          </span>
        )}
      </span>
      {calories > 0 && <span className="kcal tnum">{calories} kcal</span>}
      <span className="plus" aria-hidden>
        +
      </span>
    </button>
  );
}
