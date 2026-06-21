import { createClient } from "@supabase/supabase-js";

/* ───────────────────────────────────────────────────────────────
   PASTE YOUR TWO SUPABASE VALUES BETWEEN THE QUOTES BELOW.
   Find them in Supabase → your project → Settings → API:
     • "Project URL"        → SUPABASE_URL
     • "anon public" key    → SUPABASE_ANON_KEY
   Until you fill these in, Mise just saves on this device only.
─────────────────────────────────────────────────────────────── */
const SUPABASE_URL = "https://vfnzrgjwxgxfixisquil.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MYqXrOstiE1l7PadsIrfjA_fVYzWQt_";
/* ─────────────────────────────────────────────────────────────── */

const TABLE = "kitchen";
const ROW_ID = "main";

export const cloudEnabled =
  SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 20;

const supabase = cloudEnabled ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Returns the saved kitchen object, or null if there isn't one yet.
export async function cloudLoad() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(TABLE).select("data").eq("id", ROW_ID).maybeSingle();
    if (error) { console.error("Mise cloud load:", error.message); return null; }
    return data?.data ?? null;
  } catch (e) {
    console.error("Mise cloud load failed:", e);
    return null;
  }
}

// Writes the whole kitchen object up to the cloud (overwrites the one row).
export async function cloudSave(payload) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from(TABLE).upsert({ id: ROW_ID, data: payload });
    if (error) console.error("Mise cloud save:", error.message);
  } catch (e) {
    console.error("Mise cloud save failed:", e);
  }
}
