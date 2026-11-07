#!/usr/bin/env node
/**
 * Sync our ElevenLabs agents from the repo: agent/*.md is the SOURCE OF TRUTH.
 *
 *   npm run agents:sync            # tutor + tolk + message
 *   npm run agents:sync -- tutor   # only one
 *   npm run agents:check           # read-only: compare live agents with the repo
 *
 * Needs ELEVENLABS_API_KEY (ElevenAgents: Write) in .env.local. Never prints the key.
 * If ELEVENLABS_TOLK_AGENT_ID (or ELEVENLABS_MESSAGE_AGENT_ID) is empty, that agent is CREATED and its id printed
 * (agent ids are not secret: add it to .env.local and Vercel).
 */
import { readFileSync } from "node:fs";

const API = "https://api.elevenlabs.io/v1/convai";
const KEY = process.env.ELEVENLABS_API_KEY;
const ALLOWLIST = ["localhost", "the-click-grind6.vercel.app"];
const CHECK_ONLY = process.argv.includes("--check");
const only = process.argv.slice(2).find((a) => !a.startsWith("--"));

if (!KEY) {
  console.error("ELEVENLABS_API_KEY is missing. Run with: node --env-file=.env.local scripts/sync-agents.mjs");
  process.exit(1);
}

/** The system prompt is the first fenced block under "## System prompt" in the .md file. */
function readPrompt(file) {
  const md = readFileSync(new URL(`../agent/${file}`, import.meta.url), "utf8");
  const section = md.split(/^## System prompt\s*$/m)[1];
  const block = section?.match(/```[a-z]*\n([\s\S]*?)```/);
  if (!block) throw new Error(`No system prompt block found in agent/${file}`);
  return block[1].trim();
}

const str = (description, extra = {}) => ({ type: "string", description, ...extra });

const AGENTS = {
  tutor: {
    name: "Snakk Tutor",
    envVar: "ELEVENLABS_TUTOR_AGENT_ID",
    promptFile: "tutor-prompt.md",
    firstMessage: "{{opening_line}}",
    language: "no",
    extraLanguages: ["en"],
    llm: "claude-haiku-5-5",
    temperature: 0.3,
    speed: 0.9, // a bit slower for learners
    // Helps speech recognition hear slang correctly (that's what the tutor corrects).
    keywords: ["halla", "skjer'a", "digg", "sykt", "ass", "chille", "lættis", "kebabnorsk", "snakkes", "takk for sist", "koselig", "gidder"],
    placeholders: {
      scenario_id: "party",
      scenario_title: "Small talk at a party",
      agent_role: "a relaxed 24-year-old from Oslo at a house party",
      goal: "Greet someone your age, ask what they do, make a plan for the weekend.",
      register: "slang",
      learner_level: "A2",
      opening_line: "Halla! Har vi møttes før?",
      nickname: "Tester",
      native_language: "English",
      key_phrases: "Halla!, Skjer'a?, Digg!, chille",
      age_group: "adult",
      field: "unknown",
      interests: "football, cooking",
    },
    tools: [
      {
        name: "flag_register",
        description: "Show the learner a correction card when they used the wrong register or an unnatural phrase.",
        properties: {
          said: str("What the learner said, exactly"),
          register: str("The register of what they said: slang, informal, neutral or formal", {
            enum: ["slang", "informal", "neutral", "formal"],
          }),
          better: str("What to say instead in this situation"),
        },
        required: ["said", "register", "better"],
      },
      {
        name: "scenario_complete",
        description: "End the scenario when the goal is reached or the learner wants to stop.",
        properties: { slang_flags: { type: "number", description: "How many times you called flag_register" } },
        required: ["slang_flags"],
      },
    ],
  },
  tolk: {
    name: "Snakk Tolk",
    envVar: "ELEVENLABS_TOLK_AGENT_ID",
    promptFile: "tolk-prompt.md",
    firstMessage: "",
    language: "no",
    extraLanguages: ["en", "uk", "ar", "pl", "es", "fr", "tr"],
    llm: "claude-haiku-5-5",
    temperature: 0,
    speed: 1,
    keywords: [],
    placeholders: { lang_a: "nb", lang_a_name: "Norwegian", lang_b: "uk", lang_b_name: "Ukrainian", setting: "parent-teacher meeting" },
    tools: [
      {
        name: "show_translation",
        description: "Show the interpretation of the last utterance on the screen. Call it every time, before you speak the translation.",
        properties: {
          spoken_language: str("Who just spoke: a = person A, b = person B", { enum: ["a", "b"] }),
          original: str("Exactly what they said, in their language"),
          translation: str("Your translation into the other language"),
        },
        required: ["spoken_language", "original", "translation"],
      },
    ],
  },
  // T23 "Say it in Norwegian": text-only (no audio), English in -> natural Norwegian out via show_message.
  message: {
    name: "Snakk Message",
    envVar: "ELEVENLABS_MESSAGE_AGENT_ID",
    promptFile: "message-prompt.md",
    firstMessage: "",
    language: "en",
    extraLanguages: [],
    llm: "claude-haiku-5-5",
    temperature: 0.2,
    speed: 1,
    keywords: [],
    textOnly: true,
    placeholders: { tone: "friendly", learner_level: "A2", context: "none" },
    tools: [
      {
        name: "show_message",
        description: "Show the Norwegian version of the learner's message. Call it exactly once per message.",
        properties: {
          norwegian: str("The message in natural Norwegian Bokmål"),
          register: str("The register you used", { enum: ["slang", "informal", "neutral", "formal"] }),
          literal: str("A short word-for-word English gloss of the Norwegian"),
          tip: str("One short tip in English, max 20 words (optional)"),
        },
        required: ["norwegian", "register"],
      },
    ],
  },
};

async function call(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : {};
}

function toolConfig(t) {
  return {
    type: "client",
    name: t.name,
    description: t.description,
    expects_response: false,
    parameters: { type: "object", properties: t.properties, required: t.required },
  };
}

/** Create the client tools, or update them if a tool with the same name already exists. */
async function upsertTools(tools) {
  const existing = (await call("GET", "/tools")).tools ?? [];
  const ids = [];
  for (const t of tools) {
    const found = existing.find((e) => e.tool_config?.name === t.name);
    if (found) {
      await call("PATCH", `/tools/${found.id}`, { tool_config: toolConfig(t) });
      ids.push(found.id);
    } else {
      const created = await call("POST", "/tools", { tool_config: toolConfig(t) });
      ids.push(created.id);
    }
  }
  return ids;
}

function agentBody(spec, prompt, toolIds) {
  return {
    name: spec.name,
    conversation_config: {
      agent: {
        first_message: spec.firstMessage,
        language: spec.language,
        dynamic_variables: { dynamic_variable_placeholders: spec.placeholders },
        prompt: { prompt, tool_ids: toolIds, llm: spec.llm, temperature: spec.temperature },
      },
      turn: {
        turn_eagerness: "patient",
        // Learners need time to think before the agent takes the turn.
        turn_timeout: 10,
        // Hesitations never count as an answer or an interruption.
        interruption_ignore_terms: ["eh", "ehh", "øh", "øhm", "hmm", "mm", "ja", "ok", "uh", "um"],
        merge_with_default_ignore_terms: true,
      },
      // Noisy venues: ignore voices in the background.
      vad: { background_voice_detection: true },
      asr: { keywords: spec.keywords },
      tts: { speed: spec.speed },
      // No "interruption" event: the agent always finishes its short turn (1–2 sentences),
      // so a cough, an "ehh" or room noise can't cut it off mid-word.
      conversation: {
        client_events: ["audio", "user_transcript", "agent_response", "agent_response_correction"],
        // T23 message agent: text only (no audio, cheaper). Other agents are unchanged.
        ...(spec.textOnly ? { text_only: true } : {}),
      },
      language_presets: Object.fromEntries(
        spec.extraLanguages.map((code) => [code, { overrides: { agent: { language: code } } }]),
      ),
    },
    platform_settings: {
      auth: { enable_auth: true, allowlist: ALLOWLIST.map((hostname) => ({ hostname })) },
    },
  };
}

async function check(key, agentId) {
  const spec = AGENTS[key];
  const a = await call("GET", `/agents/${agentId}`);
  const ag = a.conversation_config?.agent ?? {};
  const prompt = readPrompt(spec.promptFile);
  const toolNames = [];
  for (const id of ag.prompt?.tool_ids ?? []) {
    const t = await call("GET", `/tools/${id}`).catch(() => null);
    if (t) toolNames.push(t.tool_config?.name);
  }
  const rows = [
    [ag.first_message === spec.firstMessage, "first message", JSON.stringify(ag.first_message)],
    [ag.language === spec.language, "language", ag.language],
    [(ag.prompt?.prompt ?? "").trim() === prompt, "system prompt matches repo", `${(ag.prompt?.prompt ?? "").length} chars`],
    [spec.tools.every((t) => toolNames.includes(t.name)), "client tools", toolNames.join(", ") || "none"],
    [a.platform_settings?.auth?.enable_auth === true, "authentication", String(a.platform_settings?.auth?.enable_auth)],
    [ag.prompt?.llm === spec.llm, "model", ag.prompt?.llm],
    [!(a.conversation_config?.conversation?.client_events ?? []).includes("interruption"), "interruptions off", String(!(a.conversation_config?.conversation?.client_events ?? []).includes("interruption"))],
    [a.conversation_config?.vad?.background_voice_detection === true, "background voice filter", String(a.conversation_config?.vad?.background_voice_detection)],
    [a.conversation_config?.turn?.turn_timeout === 10, "turn timeout 10 s", String(a.conversation_config?.turn?.turn_timeout)],
    ...(spec.textOnly ? [[a.conversation_config?.conversation?.text_only === true, "text only", String(a.conversation_config?.conversation?.text_only)]] : []),
  ];
  console.log(`\n${spec.name} (${agentId})`);
  for (const [ok, label, value] of rows) console.log(`  ${ok ? "✅" : "❌"} ${label}: ${value}`);
  return rows.every(([ok]) => ok);
}

let allOk = true;
for (const key of Object.keys(AGENTS)) {
  if (only && only !== key) continue;
  const spec = AGENTS[key];
  let agentId = process.env[spec.envVar];

  if (!CHECK_ONLY) {
    const prompt = readPrompt(spec.promptFile);
    const toolIds = await upsertTools(spec.tools);
    const body = agentBody(spec, prompt, toolIds);
    if (agentId) {
      await call("PATCH", `/agents/${agentId}`, body);
      console.log(`Updated ${spec.name}`);
    } else {
      const created = await call("POST", "/agents/create", body);
      agentId = created.agent_id;
      console.log(`Created ${spec.name}. Add this to .env.local and Vercel:\n  ${spec.envVar}=${agentId}`);
    }
  }
  if (agentId) allOk = (await check(key, agentId)) && allOk;
  else console.log(`\n${spec.name}: no ${spec.envVar} yet (run without --check to create it)`);
}
process.exit(allOk ? 0 : 1);
