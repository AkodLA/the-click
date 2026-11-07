# Partner API (v1)

Snakk is a learning app first, but other services can **connect to it with an API key**: warehouse systems (staff training in their own language), robots (e.g. Wybe-style service robots that need to speak natural Norwegian), schools and municipalities (Tolk), or other apps.
We don't build anything specific for them. We give them a **stable, secured door**.

## How it works
- Base URL: `https://<our-domain>/api/v1/`
- Auth: `Authorization: Bearer snk_live_…`
- Every key has **scopes**: it can only do what it was given.
- Keys are **never stored**. The server keeps only a SHA-256 hash (`PARTNER_KEYS` env var) and compares in constant time.
- **Rate limit:** 120 requests per minute per partner.
- Responses use the same format as the rest of the app: `{ ok: true, data }` / `{ ok: false, error: { code, message } }`.

| Scope | Allows | Status |
|---|---|---|
| `content:read` | Phrases with register and context, levels | ✅ live |
| `translate` | Interpretation / translation (Tolk as an API) | Roadmap |

## Endpoints
| Method + path | Scope | Description |
|---|---|---|
| `GET /api/v1/me` | `content:read` | Check that your key works: returns partner id + scopes |
| `GET /api/v1/phrases?register=&level=&tag=` | `content:read` | Everyday Norwegian with ✅ use when / 🚫 avoid when / 💡 say instead |

Example:
```bash
curl -H "Authorization: Bearer $SNAKK_KEY" "https://<our-domain>/api/v1/phrases?register=formal&level=B1"
```

## Create a key (Akram / maintainers)
```bash
npm run partner:key -- demo-warehouse content:read
```
1. The script prints the key **once**. Give it to the partner privately (never in Git, chat channels or screenshots).
2. Add the printed `partnerId:scopes:hash` entry to `PARTNER_KEYS` in Vercel (and `.env.local` for testing). Separate multiple partners with commas.
3. Redeploy. **Revoke** a key by removing its entry.

## Adding a new partner endpoint (developers)
1. Create `src/app/api/v1/<name>/route.ts`.
2. First line: `const auth = authenticatePartner(req, "<scope>"); if (!auth.ok) return auth.response;`
3. Validate all input with zod. Never return learner data: partner endpoints only expose content and services.
4. New scope? Add it to `PARTNER_SCOPES` in `src/server/partners.ts` **and** to `scripts/create-partner-key.mjs`.
