// Server-only event store.
// - If SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set: events go to Supabase (needed on Vercel,
//   because serverless instances do not share memory).
// - Otherwise: in-memory store (fine for `npm run dev` on one laptop).
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { FeedEvent, NewFeedEvent } from "./types";

const TABLE = "events";

let supabase: SupabaseClient | null = null;
function db(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!supabase) supabase = createClient(url, key, { auth: { persistSession: false } });
  return supabase;
}

// Survives hot reloads in dev.
const g = globalThis as unknown as { __events?: FeedEvent[] };
const memory: FeedEvent[] = (g.__events ??= []);

export async function addEvent(e: NewFeedEvent): Promise<FeedEvent> {
  const client = db();
  if (client) {
    const { data, error } = await client.from(TABLE).insert(e).select().single();
    if (error) throw new Error(error.message);
    return data as FeedEvent;
  }
  const event: FeedEvent = { ...e, id: crypto.randomUUID(), created_at: new Date().toISOString() };
  memory.push(event);
  if (memory.length > 500) memory.shift();
  return event;
}

export async function listEvents(limit = 100): Promise<FeedEvent[]> {
  const client = db();
  if (client) {
    const { data, error } = await client
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as FeedEvent[];
  }
  return [...memory].reverse().slice(0, limit);
}

export async function clearEvents(): Promise<void> {
  const client = db();
  if (client) {
    const { error } = await client.from(TABLE).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw new Error(error.message);
    return;
  }
  memory.length = 0;
}
