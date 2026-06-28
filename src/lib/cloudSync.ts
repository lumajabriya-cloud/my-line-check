import {
  getAllChecks,
  getAllStructs,
  upsertCheck,
  upsertStruct,
} from "./lineCheck.functions";

const CHECK_PREFIX = "linecheck:";
const STRUCT_PREFIX = "linecheck:section-items:";

function isDateKey(suffix: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(suffix);
}

/** Pull all team data from Cloud into localStorage, then dispatch updates. */
export async function bootstrapFromCloud(): Promise<void> {
  if (typeof window === "undefined") return;
  const [checks, structs] = await Promise.all([
    getAllChecks(),
    getAllStructs(),
  ]);

  // Wipe existing linecheck:* keys so removed-on-server rows don't linger.
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(CHECK_PREFIX) && !k.startsWith("linecheck:settings:"))
      toRemove.push(k);
  }
  for (const k of toRemove) localStorage.removeItem(k);

  for (const row of structs) {
    localStorage.setItem(
      `${STRUCT_PREFIX}${row.section_name}`,
      JSON.stringify(row.data),
    );
  }
  for (const row of checks) {
    localStorage.setItem(
      `${CHECK_PREFIX}${row.section_name}:${row.check_date}`,
      JSON.stringify(row.data),
    );
  }

  window.dispatchEvent(new Event("linecheck:update"));
}

/** Push a single (section, date) check row to Cloud. Fire-and-forget. */
export function syncCheck(sectionName: string, date: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(`${CHECK_PREFIX}${sectionName}:${date}`);
    if (!raw) return;
    const data = JSON.parse(raw);
    void upsertCheck({
      data: { section_name: sectionName, check_date: date, data },
    }).catch((e) => console.error("[cloudSync] upsertCheck failed", e));
  } catch (e) {
    console.error("[cloudSync] syncCheck error", e);
  }
}

/** Push a single section struct to Cloud. Fire-and-forget. */
export function syncStruct(sectionName: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(`${STRUCT_PREFIX}${sectionName}`);
    if (!raw) return;
    const data = JSON.parse(raw);
    void upsertStruct({
      data: { section_name: sectionName, data },
    }).catch((e) => console.error("[cloudSync] upsertStruct failed", e));
  } catch (e) {
    console.error("[cloudSync] syncStruct error", e);
  }
}

/** Clear all line-check cached data from this browser (used on sign-out). */
export function clearLocalCache() {
  if (typeof window === "undefined") return;
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(CHECK_PREFIX)) toRemove.push(k);
  }
  for (const k of toRemove) localStorage.removeItem(k);
}

// Expose helper to extract date-keyed entries (used elsewhere if needed).
export const isCheckDateKey = isDateKey;
