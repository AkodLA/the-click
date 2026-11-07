/**
 * The agent's voice model uses expressive tags like "[neutral]", "[gentle]" or "[slow]" to set the tone.
 * They're for the voice, not for reading: strip them before showing a line on screen.
 */
const VOICE_TAG = /\[[a-z][a-z \-]{0,24}\]\s*/gi;

export function stripVoiceTags(text: string): string {
  return text.replace(VOICE_TAG, "").replace(/\s{2,}/g, " ").trim();
}
