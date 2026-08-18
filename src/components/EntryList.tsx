import type { Entry } from "../types";

export function EntryList({
  entries,
  onDelete,
}: {
  entries: Entry[];
  onDelete: (id: string) => void;
}) {
  if (entries.length === 0) {
    return <p className="empty">No entries yet. Add your first meal above.</p>;
  }

  return (
    <ul className="entry-list">
      {entries.map((e) => (
        <li key={e.id} className="entry">
          <div className="entry-main">
            <div className="entry-name">{e.foodName}</div>
            <div className="entry-desc">
              {e.description}
              {e.quantity ? ` · ${e.quantity}` : ""}
            </div>
          </div>
          <div className="entry-cal">{e.calories}</div>
          <button
            className="delete"
            aria-label={`Delete ${e.foodName}`}
            onClick={() => onDelete(e.id)}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}
