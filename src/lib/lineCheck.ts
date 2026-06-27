import data from "@/data/lineCheck.json";

export type Slot = "op" | "mid" | "cl";
export type Entry = { status: string; note: string };
export type SectionState = {
  date: string;
  opening: string;
  mid: string;
  closing: string;
  entries: Record<string, Record<Slot, Entry>>;
};

export const STATUSES = data.statuses;
export const STAFF = data.staff;
export const SECTIONS = data.sections.filter((s) => s.items.length > 0);

export const FLAG_STATUSES = new Set([
  "ABOUT TO EXPIRE",
  "EXPIRED",
  "NEED TO CLEAN",
  "WRONG LABEL",
]);
export const OK_STATUSES = new Set(["OK", "N/A", "F/O", "PREPPING"]);

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function storageKey(name: string, date = todayISO()) {
  return `linecheck:${name}:${date}`;
}

export function emptyEntry(): Entry {
  return { status: "", note: "" };
}

export function loadSection(name: string, date = todayISO()): SectionState {
  try {
    const raw = localStorage.getItem(storageKey(name, date));
    if (raw) return JSON.parse(raw);
  } catch {}
  return { date, opening: "", mid: "", closing: "", entries: {} };
}

export function defaultShift(): Slot {
  const h = new Date().getHours();
  if (h < 11) return "op";
  if (h < 17) return "mid";
  return "cl";
}

export function sectionProgress(name: string, slot: Slot, date = todayISO()) {
  const sec = SECTIONS.find((s) => s.name === name);
  if (!sec) return { done: 0, total: 0, flagged: 0 };
  const state = loadSection(name, date);
  let done = 0;
  let flagged = 0;
  for (const item of sec.items) {
    const e = state.entries[item.name]?.[slot];
    if (e?.status) done++;
    if (e?.status && FLAG_STATUSES.has(e.status)) flagged++;
  }
  return { done, total: sec.items.length, flagged };
}

export type FlaggedRow = {
  section: string;
  item: string;
  status: string;
  slot: Slot;
};

export function allFlagged(slot: Slot, date = todayISO()): FlaggedRow[] {
  const rows: FlaggedRow[] = [];
  for (const sec of SECTIONS) {
    const state = loadSection(sec.name, date);
    for (const item of sec.items) {
      const e = state.entries[item.name]?.[slot];
      if (e?.status && FLAG_STATUSES.has(e.status)) {
        rows.push({ section: sec.name, item: item.name, status: e.status, slot });
      }
    }
  }
  return rows;
}

export type DayHistory = {
  date: string;
  stationsTouched: number;
  stationsComplete: number;
  flagged: number;
  totalItems: number;
  checkedItems: number;
};

export function listHistoryDates(): string[] {
  const dates = new Set<string>();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith("linecheck:")) continue;
      const parts = k.split(":");
      const d = parts[parts.length - 1];
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) dates.add(d);
    }
  } catch {}
  return [...dates].sort((a, b) => (a < b ? 1 : -1));
}

export function dayHistory(date: string): DayHistory {
  let stationsTouched = 0;
  let stationsComplete = 0;
  let flagged = 0;
  let totalItems = 0;
  let checkedItems = 0;
  for (const sec of SECTIONS) {
    const state = loadSection(sec.name, date);
    let anyTouched = false;
    let allDone = true;
    for (const item of sec.items) {
      totalItems++;
      const slots: Slot[] = ["op", "mid", "cl"];
      let itemDoneAnyShift = false;
      for (const slot of slots) {
        const e = state.entries[item.name]?.[slot];
        if (e?.status) {
          anyTouched = true;
          itemDoneAnyShift = true;
          if (FLAG_STATUSES.has(e.status)) flagged++;
        }
      }
      if (itemDoneAnyShift) checkedItems++;
      else allDone = false;
    }
    if (anyTouched) stationsTouched++;
    if (anyTouched && allDone && sec.items.length > 0) stationsComplete++;
  }
  return { date, stationsTouched, stationsComplete, flagged, totalItems, checkedItems };
}
