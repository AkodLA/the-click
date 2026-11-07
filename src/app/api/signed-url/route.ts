// Returns a short-lived signed URL for the ElevenLabs agent.
// The API key stays on the server – it is never sent to the browser.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!apiKey || !agentId) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY eller ELEVENLABS_AGENT_ID mangler i .env.local" },
      { status: 500 },
    );
  }

  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
    { headers: { "xi-api-key": apiKey }, cache: "no-store" },
  );
  if (!res.ok) {
    return NextResponse.json({ error: `ElevenLabs svarte ${res.status}` }, { status: 502 });
  }
  const data = (await res.json()) as { signed_url: string };
  return NextResponse.json({ signedUrl: data.signed_url });
}
