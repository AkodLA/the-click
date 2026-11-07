# Interpreter agent – client tools

ElevenLabs → interpreter agent → Tools → Add tool → **Client**. Tick **Wait for response**. The app (`src/app/tolk/page.tsx`) listens for these names.

| Tool | Description (paste) | Parameters (string) |
|---|---|---|
| `interpret` | Show one interpreted utterance on the table screen. Call after every translation. | `from` (required: no or home) · `original` (required) · `translation` (required) |
| `end_meeting` | Show the meeting summary and save the phrases the learner needed help with. | `summary_home` (required) · `summary_no` (required) · `phrases` (required, JSON array string of {no, home}) |

## Agent settings

- **Language:** Norwegian (`no`) as default; add every learner language under Additional languages and turn on **language detection** so it switches per speaker.
- **Voice:** multilingual model. Test Somali first. If it sounds bad, demo Arabic.
- **Dynamic variables:** `meeting`, `other_role`, `home_language`, `home_code`.
- **Security → Authentication:** ON.
- **Turn-taking:** set interruptions OFF; an interpreter shouldn't be cut off mid-sentence.

## Stage fallback

The **Demo** button on the table screen plays a scripted parent–teacher meeting without microphone or network, and ends with the real summary and saved phrases. Use it if venue wifi fails.
