import { ok } from "@/lib/api";
import { authenticatePartner } from "@/server/partners";

/** GET /api/v1/me: partner API "who am I". Lets a partner test that their key works. */
export async function GET(req: Request) {
  const auth = authenticatePartner(req, "content:read");
  if (!auth.ok) return auth.response;
  return ok({ partner: auth.partner.id, scopes: auth.partner.scopes, apiVersion: "v1" });
}
