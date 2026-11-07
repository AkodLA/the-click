# Client tools – add each one in the ElevenLabs agent ("Tools" → Add tool → **Client**)

For every tool: type **Client**, tick **Wait for response**. Names and parameter names must match exactly – the app (`src/app/page.tsx`) listens for these names.

| Tool | Description (paste) | Parameters (all type string unless noted) |
|---|---|---|
| `show_step` | Show a step of a task on the worker's screen. Call before saying the step. | `task_id` (required; one of: retur, varemottak, plukk, pakking) · `step_number` (number, required) · `text_translated` (required; the step in the worker's language) |
| `step_done` | Mark a step as done when the worker confirms. Returns the next step. | `task_id` (required) · `step_number` (number, required) |
| `task_done` | Mark the whole task as finished after the last step. | `task_id` (required) |
| `report_problem` | Report a problem on the floor to the manager. | `problem_type` (required; tom_hylle, skadet_vare, feil_vare, annet) · `location` (optional; hylleplass e.g. B-12) · `text_original` (required; what the worker said) · `text_no` (required; short Norwegian summary) |
| `ask_manager` | Send a question the procedures do not answer to the manager. Use instead of guessing. | `question_original` (required; in the worker's language) · `question_no` (required; Norwegian translation) |
| `grade_return` | Save the suggested grade for a returned item. | `grade` (required; A, B or C) · `reason_no` (required; short reason in Norwegian) · `reason_original` (optional; reason in the worker's language) |

## Other agent settings

- **Knowledge base:** upload `agent/kunnskapsbase/lager-rutiner.md`. Turn on RAG if offered.
- **Language:** default Norwegian. Under **Additional languages**, add every language in `src/lib/languages.ts` (so, ar, pl, uk, en).
- **Security tab → Overrides:** enable **Language** and **First message** (the app sets both when the session starts).
- **Security tab → Authentication:** turn ON (the app uses a signed URL from the server, so the API key never reaches the browser).
- **Voice / TTS model:** pick a multilingual model and test Somali before anything else. If Somali sounds bad, switch the model; if it is still bad, demo Arabic.
- **LLM:** a model that accepts images if you want the return-photo feature.
