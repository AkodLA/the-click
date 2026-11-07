"use client";
/**
 * Browser side of progress.
 *  - Keeps the server-signed progress token in localStorage (no account, no personal data on the server).
 *  - Shows progress instantly by reading the token's payload.
 *  - Every change goes to the SERVER (POST /api/progress/event), which applies the rules and signs a new token.
 *    The browser never decides XP amounts; editing localStorage just breaks the signature.
 *
 *   const progress = useProgress();
 *   progressActions.send({ type: "phrase_learned", phraseId: "digg" });
 *
 * Owner: T6. Other features only call progressActions.
 */
import { useSyncExternalStore } from "react";
import { apiFetch } from "@/lib/api-client";
import type { Progress } from "@/lib/content/types";
import { DEFAULT_PROGRESS } from "./defaults";
import type { ProgressEvent, RewardNotice } from "./events";

const KEY = "snakk.progress.token.v1";

// ---------- token storage + decoding (display only; the server verifies) ----------
let cachedToken: string | null | undefined;
let cachedProgress: Progress = DEFAULT_PROGRESS;
const listeners = new Set<() => void>();

function decodePayload(token: string | null): Progress {
  if (!token) return DEFAULT_PROGRESS;
  try {
    const data = token.split(".")[0].replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as { p: Progress };
    return { ...DEFAULT_PROGRESS, ...payload.p };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function readToken(): string | null {
  if (cachedToken === undefined) {
    try {
      cachedToken = window.localStorage.getItem(KEY);
    } catch {
      cachedToken = null;
    }
    cachedProgress = decodePayload(cachedToken);
  }
  return cachedToken;
}

function read(): Progress {
  readToken();
  return cachedProgress;
}

function writeToken(token: string | null) {
  cachedToken = token;
  cachedProgress = decodePayload(token);
  try {
    if (token) window.localStorage.setItem(KEY, token);
    else window.localStorage.removeItem(KEY);
  } catch {
    // private mode: progress lasts for this tab only
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cachedToken = undefined;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_PROGRESS);
}

// ---------- reward toasts ----------
export interface Reward extends RewardNotice {
  id: number;
}
let rewardSeq = 0;
const rewardListeners = new Set<(r: Reward) => void>();

export function onReward(listener: (r: Reward) => void) {
  rewardListeners.add(listener);
  return () => {
    rewardListeners.delete(listener);
  };
}

function emitReward(notice: RewardNotice) {
  const reward = { ...notice, id: ++rewardSeq };
  rewardListeners.forEach((l) => l(reward));
}

// ---------- actions ----------
interface EventResult {
  token: string;
  progress: Progress;
  rewards: RewardNotice[];
}

// Events are sent one at a time so each uses the latest token.
let queue: Promise<unknown> = Promise.resolve();

export const progressActions = {
  /** Report something the learner did. Resolves with the new progress (or throws a readable error). */
  send(event: ProgressEvent): Promise<Progress> {
    const run = async () => {
      try {
        const result = await apiFetch<EventResult>("/api/progress/event", {
          method: "POST",
          body: JSON.stringify({ token: readToken(), event }),
        });
        writeToken(result.token);
        result.rewards.forEach(emitReward);
        return result.progress;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.startsWith("invalid_token")) {
          // Token was edited or the server secret changed: start fresh instead of getting stuck.
          writeToken(null);
          emitReward({ emoji: "⚠️", title: "Progress reset", detail: "Your saved progress couldn't be verified." });
        } else {
          emitReward({ emoji: "⚠️", title: "Couldn't save that", detail: "Check your connection and try again." });
        }
        throw err;
      }
    };
    const p = queue.then(run, run);
    queue = p.catch(() => undefined);
    return p;
  },

  /** Demo helper: start fresh (e.g. before the pitch). */
  reset() {
    writeToken(null);
  },
};
