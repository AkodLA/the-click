import { NextResponse } from "next/server";
import { addEvent, clearEvents, listEvents } from "@/lib/store";
import type { EventKind, NewFeedEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

const KINDS: EventKind[] = ["session_start", "step_done", "task_done", "problem", "question", "return_grade"];
const MAX = 500; // max characters per text field

function str(v: unknown, max = MAX): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length === 0 ? null : s.slice(0, max);
}

export async function GET() {
  try {
    return NextResponse.json({ events: await listEvents(100) });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const kind = body.kind as EventKind;
  const worker = str(body.worker, 40);
  const language = str(body.language, 10);
  const text_no = str(body.text_no);
  if (!KINDS.includes(kind) || !worker || !language || !text_no) {
    return NextResponse.json({ error: "Mangler kind, worker, language eller text_no" }, { status: 400 });
  }

  // Only allow a flat map of short strings in meta.
  let meta: Record<string, string> | null = null;
  if (body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)) {
    meta = {};
    for (const [k, v] of Object.entries(body.meta as Record<string, unknown>).slice(0, 10)) {
      const val = str(v, 100);
      if (val) meta[k.slice(0, 30)] = val;
    }
  }

  const event: NewFeedEvent = {
    kind,
    worker,
    language,
    text_no,
    text_original: str(body.text_original),
    meta,
  };

  try {
    return NextResponse.json({ event: await addEvent(event) }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// Reset the feed before a demo run. Protected by DEMO_RESET_TOKEN if set.
export async function DELETE(req: Request) {
  const token = process.env.DEMO_RESET_TOKEN;
  if (token && req.headers.get("x-reset-token") !== token) {
    return NextResponse.json({ error: "Ikke tillatt" }, { status: 401 });
  }
  await clearEvents();
  return NextResponse.json({ ok: true });
}
