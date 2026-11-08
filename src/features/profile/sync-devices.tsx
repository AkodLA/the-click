"use client";
/**
 * "Use Snakk on another device": a sync code instead of an email/password.
 * Get a code here → type it on your phone → same progress. Only a hash of the code is stored on the server.
 */
import { useState } from "react";
import { Button, Card, SectionTitle } from "@/components/ui";
import { apiFetch } from "@/lib/api-client";
import { progressActions } from "@/lib/progress/store";

export function SyncDevices() {
  const [code, setCode] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function getCode() {
    setBusy(true);
    setMessage(null);
    try {
      const r = await apiFetch<{ code: string }>("/api/progress/sync", { method: "POST" });
      setCode(r.code);
    } catch (err) {
      setMessage({ tone: "error", text: readable(err) });
    } finally {
      setBusy(false);
    }
  }

  async function restore() {
    setBusy(true);
    setMessage(null);
    try {
      const r = await apiFetch<{ token: string }>("/api/progress/restore", { method: "POST", body: JSON.stringify({ code: input }) });
      progressActions.adopt(r.token);
      setInput("");
      setMessage({ tone: "ok", text: "✅ Your progress is on this device now." });
    } catch (err) {
      setMessage({ tone: "error", text: readable(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="devices" className="scroll-mt-20">
      <SectionTitle>📱 Use Snakk on another device</SectionTitle>
      <Card className="flex flex-col gap-4">
        <p className="text-sm text-muted">No email, no password: get a sync code here, type it on your other device, and your progress follows you.</p>
        {code ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-brand-soft p-4 text-center">
            <p className="text-sm font-semibold text-muted">Your sync code (keep it private)</p>
            <p className="font-mono text-2xl font-bold tracking-widest text-brand" aria-live="polite">
              {code}
            </p>
            <Button variant="secondary" onClick={() => void navigator.clipboard?.writeText(code)}>
              Copy code
            </Button>
          </div>
        ) : (
          <Button onClick={getCode} disabled={busy}>
            {busy ? "Creating…" : "Get my sync code"}
          </Button>
        )}
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            void restore();
          }}
        >
          <label className="sr-only" htmlFor="sync-code">
            Sync code from your other device
          </label>
          <input
            id="sync-code"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX-XXXX"
            autoComplete="off"
            spellCheck={false}
            maxLength={20}
            className="h-11 flex-1 rounded-2xl border border-line bg-surface px-4 font-mono tracking-widest"
          />
          <Button type="submit" variant="secondary" disabled={busy || input.replace(/[^0-9A-Z]/gi, "").length !== 12}>
            Load my progress
          </Button>
        </form>
        {message && (
          <p role="status" className={`text-sm font-semibold ${message.tone === "ok" ? "text-success" : "text-danger"}`}>
            {message.text}
          </p>
        )}
      </Card>
    </section>
  );
}

function readable(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.startsWith("not_configured")) return "Sync isn't available right now.";
  if (msg.startsWith("no_progress")) return "Practise something first (e.g. learn a phrase), then get your code.";
  if (msg.startsWith("not_found")) return "That code doesn't match. Check it and try again.";
  if (msg.startsWith("rate_limited")) return "Too many tries. Wait a few minutes.";
  return "Something went wrong. Try again.";
}
