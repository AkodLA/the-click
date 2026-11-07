# Tutor agent – client tools

In ElevenLabs → your tutor agent → Tools → Add tool → **Client**. Tick **Wait for response**. Names must match exactly; the app (`src/app/snakk/page.tsx`) listens for them.

| Tool | Description (paste) | Parameters (string unless noted) |
|---|---|---|
| `correct_me` | Show a correction card when the learner says something wrong or in the wrong register. | `said` (required) · `better` (required) · `why` (required, max 8 words, Norwegian) · `register` (required: kompis, hverdag, formell, unnga) |
| `pronunciation_tip` | Show a pronunciation tip for one word. | `word` (required) · `tip` (required, one sentence) |
| `target_hit` | The learner used a target phrase. | `phrase` (required, the exact target phrase) |
| `finish_lesson` | The conversation goal is reached. | `xp` (number, required, 30–150) |

## Agent settings

- **Language:** Norwegian (`no`). Add the learner languages from `src/lib/content.ts` under Additional languages if you want hints spoken in them.
- **Voice:** a natural Norwegian voice from the voice library (test 2–3, pick the least "newsreader" one).
- **Dynamic variables:** the app sends `nick`, `level`, `home_language`, `role`, `goal`, `register`, `targets`.
- **Security → Authentication:** ON (the app uses a signed URL).
- **Turn timeout:** a bit longer than default; learners pause to think.
