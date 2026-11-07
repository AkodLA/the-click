/**
 * Browser-side helper: call one of our API routes and get `data`, or throw a readable error.
 *   const step = await apiFetch<PickStep | null>("/api/picks/next?workerId=w-olena");
 */
import type { ApiResponse } from "./api";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = (await res.json()) as ApiResponse<T>;
  if (!body.ok) throw new Error(`${body.error.code}: ${body.error.message}`);
  return body.data;
}
