import type { MealSlotId } from "../types";

export type SlotDef = {
  id: MealSlotId;
  name: string;
  range: string; // human label
  startHour: number; // inclusive
  endHour: number; // exclusive (24 == midnight)
  emoji: string;
};

// Ordered through the day. Mirrors Healthy 365's bands.
export const SLOTS: SlotDef[] = [
  { id: "early", name: "Early Morning", range: "12am – 5am", startHour: 0, endHour: 5, emoji: "🌙" },
  { id: "morning", name: "Morning", range: "5am – 11am", startHour: 5, endHour: 11, emoji: "🌅" },
  { id: "midday", name: "Midday", range: "11am – 2pm", startHour: 11, endHour: 14, emoji: "☀️" },
  { id: "afternoon", name: "Afternoon", range: "2pm – 5pm", startHour: 14, endHour: 17, emoji: "🌤️" },
  { id: "evening", name: "Evening", range: "5pm – 9pm", startHour: 17, endHour: 21, emoji: "🌆" },
  { id: "night", name: "Night", range: "9pm – 12am", startHour: 21, endHour: 24, emoji: "🌛" },
];

const BY_ID: Record<MealSlotId, SlotDef> = Object.fromEntries(
  SLOTS.map((s) => [s.id, s]),
) as Record<MealSlotId, SlotDef>;

export function slot(id: MealSlotId): SlotDef {
  return BY_ID[id];
}

/** The slot the current local time falls into — the default when logging. */
export function currentSlot(now = new Date()): MealSlotId {
  const h = now.getHours();
  return (SLOTS.find((s) => h >= s.startHour && h < s.endHour) ?? SLOTS[1]).id;
}
