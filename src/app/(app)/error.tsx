"use client";
/**
 * If a screen crashes, the learner sees this inside the app shell (top bar and bottom nav still work)
 * instead of a blank page. Progress is safe: it lives in the signed token, not in this screen.
 */
import { useEffect } from "react";
import { Mascot } from "@/components/mascot";
import { Button, Card } from "@/components/ui";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("screen error", error.digest ?? error.message);
  }, [error]);

  return (
    <Card className="mx-auto mt-6 flex max-w-md flex-col items-center gap-3 text-center" role="alert">
      <Mascot className="h-20 w-20" still />
      <h1 className="font-display text-2xl font-bold">
        <span lang="nb">«Oi!»</span> Something went wrong here.
      </h1>
      <p className="text-muted">Your progress is safe. Try again, or go back home.</p>
      <div className="flex w-full flex-col gap-2">
        <Button onClick={reset}>🔄 Try again</Button>
        <Button href="/learn" variant="secondary">
          🏠 Home
        </Button>
      </div>
    </Card>
  );
}
