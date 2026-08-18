import { useState } from "react";

export function EntryInput({
  onEstimate,
  loading,
}: {
  onEstimate: (text: string) => void;
  loading: boolean;
}) {
  const [text, setText] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t || loading) return;
    onEstimate(t);
  }

  return (
    <form className="entry-input" onSubmit={submit}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. two big spoons of oats"
        enterKeyHint="go"
        autoComplete="off"
        disabled={loading}
      />
      <button type="submit" disabled={loading || !text.trim()}>
        {loading ? "Estimating…" : "Estimate"}
      </button>
    </form>
  );
}
