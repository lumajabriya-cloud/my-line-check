import { supabase } from "@/integrations/supabase/client";
import {
  SECTIONS,
  loadSection,
  loadMember,
  shiftHistory,
  type Slot,
  type SectionState,
} from "@/lib/lineCheck";
import { lsStore } from "@/lib/lsStore";

export type SharedShiftPayload = {
  date: string;
  shift: Slot;
  member: string;
  brand_name: string;
  summary: ReturnType<typeof shiftHistory>;
  sections: Array<{ name: string; state: SectionState }>;
};

function buildPayload(date: string, slot: Slot): SharedShiftPayload {
  const sections = SECTIONS.map((s) => ({
    name: s.name,
    state: loadSection(s.name, date),
  }));
  const brand_name = lsStore.getItem("linecheck:settings:brand:name") || "LUMA";
  return {
    date,
    shift: slot,
    member: loadMember(date, slot),
    brand_name,
    summary: shiftHistory(date, slot),
    sections,
  };
}

/**
 * Publish the current shift snapshot to the database and return a public URL.
 * Uses upsert on (owner_id, date, shift) so re-sharing keeps the same link.
 */
export async function publishSharedShift(date: string, slot: Slot): Promise<string> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Sign in required to share");
  const owner_id = userData.user.id;
  const payload = buildPayload(date, slot);

  const { data, error } = await supabase
    .from("shared_shifts")
    .upsert(
      {
        owner_id,
        date,
        shift: slot,
        member: payload.member || null,
        brand_name: payload.brand_name,
        payload: JSON.parse(JSON.stringify(payload)),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner_id,date,shift" },
    )
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Failed to publish share");
  return `${window.location.origin}/s/${data.id}`;
}
