// Returns a short-lived signed URL for one of our ElevenLabs agents.
// The API key stays on the server – it is never sent to the browser.
//   GET /api/signed-url?agent=tutor   -> speaking tutor
//   GET /api/signed-url?agent=tolk    -> interpreter
//   GET /api/signed-url               -> warehouse assistant (/lager)
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const AGENTS: Record<string, string | undefined> = {
  tutor: process.env.ELEVENLABS_TUTOR_AGENT_ID,
  tolk: process.env.ELEVENLABS_TOLK_AGENT_ID,
  lager: process.env.ELEVENLABS_AGENT_ID,
};

export async function GET(req: NextRequest) {
  const which = req.nextUrl.searchParams.get("agent") ?? "lager";
  if (!(which in AGENTS)) {
    return NextResponse.json({ error: "Ukjent agent." }, { status: 400 });
  }
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = AGENTS[which];
  if (!apiKey || !agentId) {
    return NextResponse.json(
      { error: `Stemmen er ikke satt opp ennå (mangler nøkkel for «${which}» i .env.local).` },
      { status: 500 },
    );
  }

  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
    { headers: { "xi-api-key": apiKey }, cache: "no-store" },
  );
  if (!res.ok) {
    return NextResponse.json({ error: `Stemmetjenesten svarte ${res.status}.` }, { status: 502 });
  }
  const data = (await res.json()) as { signed_url: string };
  return NextResponse.json({ signedUrl: data.signed_url });
}
