/**
 * Helpers every API route uses, so all responses look the same:
 *   success: { ok: true,  data: ... }
 *   error:   { ok: false, error: { code, message } }
 */
import { z } from "zod";

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

const NO_STORE = { "Cache-Control": "no-store" };

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ ok: true, data } satisfies ApiResponse<T>, { status, headers: NO_STORE });
}

export function fail(code: string, message: string, status = 400): Response {
  return Response.json({ ok: false, error: { code, message } } satisfies ApiResponse<never>, { status, headers: NO_STORE });
}

/** Default max JSON body size (bytes). Routes with uploads set their own limit. */
const MAX_JSON_BYTES = 32 * 1024;

/**
 * Read and validate a JSON body (size-limited).
 *   const body = await parseBody(req, z.object({ phraseId: z.string() }));
 *   if (!body.success) return body.response;
 *   body.data.phraseId ...
 */
export async function parseBody<S extends z.ZodType>(
  req: Request,
  schema: S,
  maxBytes = MAX_JSON_BYTES,
): Promise<{ success: true; data: z.infer<S> } | { success: false; response: Response }> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > maxBytes) {
    return { success: false, response: fail("too_large", "Request body is too large", 413) };
  }
  let json: unknown;
  try {
    const text = await req.text();
    if (text.length > maxBytes) return { success: false, response: fail("too_large", "Request body is too large", 413) };
    json = JSON.parse(text);
  } catch {
    return { success: false, response: fail("invalid_json", "Request body must be JSON") };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    return { success: false, response: fail("invalid_input", z.prettifyError(result.error)) };
  }
  return { success: true, data: result.data };
}
