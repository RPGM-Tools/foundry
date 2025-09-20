## RPGM Multi-Codebase – AI Agent Quick Orientation (Authoritative Coding Aids)

Scope: This file guides AI assistants working across these sibling folders: `foundry/` (Foundry VTT modules), `tools/` (shared TS lib + OpenAPI
client), `nexicore/` (Nuxt 4 edge app + API), `dashboard/` (single Cloudflare Worker), `loremaster_next/` (knowledge canon + decision records). Keep
answers concrete; prefer citing existing patterns over inventing new ones.

1. Architecture Flow (Forge Feature Loop) Forge (Foundry module `modules/rpgm-forge/src/forge.ts`) → Tools library (`tools/shared/src/tools.ts`
   provider abstraction + OpenAI‑compatible bridge & monkey‑patch for structured outputs) → Nexicore API
   (`nexicore/server/api/forge/chat/completions.post.ts` maps internal model ids -> OpenRouter model, enforces text limit) → External LLM → Response
   back to ChatWizard UI & radial menu actions. Usage quota displayed via `useTextLimit()` in Forge (fetches `/api/forge/usage` through generated
   client) and decremented server‑side after completion.
2. Repos & Roles foundry/: Monorepo (pnpm) with `shared/` (base module infra, UI atoms, i18n, settings, radial menu, chat command system) +
   `modules/rpgm-forge/` (Forge specific assets, chats, settings). tools/: Compiles to dist; exports `@rpgm/tools` (base abstractions + openapi
   client + domain helpers). nexicore/: User auth, billing tiers, Discord integration, Forge chat completion + usage endpoints. dashboard/:
   Operational console editing users/patreon/kv usage in one file (`worker.js`). loremaster_next/: Canonical product/process knowledge & DR files
   (consult before creating new architectural constructs).
3. Build / Dev Commands Root foundry: `pnpm build` (recursive) / `pnpm lint`. Forge live dev: `cd foundry/modules/rpgm-forge && pnpm dev` (vite build
   --watch + dev server). Tools: `cd tools && pnpm build` (tsc -b + tsc-alias). Nexicore: `cd nexicore && pnpm dev` (Nuxt edge). Dashboard worker: no
   build—deploy / run directly (`worker.js` is self‑contained). Keep changes incremental; do not introduce new build systems.
4. Path & Import Conventions (Forge) Forge uses three path alias prefixes: hash (shared module sources), single dollar (current module src), double
   dollar (module assets). Preserve these imports and rely on existing vite auto imports. Colocate Vue component, style, and any small utility.
5. i18n Type Safety Shared keys: `foundry/shared/lang/en.ts` + types in `foundry/shared/types/lang.d.ts`. Module keys:
   `modules/rpgm-forge/lang/en.ts` + `types/lang.d.ts`. Always add new keys to both runtime object and the corresponding interface; use the
   `satisfies` operator pattern already present. Never hardcode user‑facing strings in logic—reference localized keys.
6. Chat Command System Register inside module `registerSettings()` using brigadier‑ts‑lite:
   `rpgm.chat.registerCommand(literal('name').then(argument('prompt', string('greedy_phrase')).executes(...)).executes(...));`. Follow existing
   examples in `forge.ts`; keep commands idempotent and side‑effect free except for chat output.
7. ChatWizard Pattern Create a Vue component in `modules/rpgm-forge/src/chat/`; instantiate
   `new ChatWizard(this.id, 'your-scope', Component, this.name, this.logger)` during `init()` and call `.load()`. Persisted state relies on world
   settings; avoid storing large blobs—store minimal config and regenerate content via AI.
8. Text Usage / Limits Client: `RpgmForge.useTextLimit()` (global state) displays remaining allowance. Server:
   `nexicore/server/api/forge/chat/completions.post.ts` checks `checkTextLimit()` & decrements with `decrementTextLimit()` after non‑stream completion
   (stream path still enforces pre‑check). Admin adjustments happen via Dashboard Worker KV key `text-usage:<userId>` editing—never bypass this path
   in new code.
9. Adding a New AI Model or DIY Provider Extend `DIY_PROVIDERS` in `tools/shared/src/tools.ts` (implement `create()` & optional `fetchModels`). Map
   new internal slug -> upstream model in `nexicore/.../completions.post.ts:modelMap`. Keep internal slugs stable (`rpgm-names`, `rpgm-descriptions`,
   `rpgm-homebrew` pattern). Update Forge UI only after backend + tools changes land.
10. Structured Outputs The tools layer monkey‑patches `OpenAICompatibleChatLanguageModel.doGenerate` to flag structured output support. Reuse this
    path—do NOT add parallel bespoke OpenAI clients; route through `AbstractTools.rpgmTextAi()` so quota + logging remain centralized.
11. Dashboard Worker Constraints Single file (`dashboard/worker.js`): preserve inline caching strategy (`getCachedTextUsage`), per‑field audit
    logging, Gmail normalization, and PATCH whitelist. When adding fields: extend whitelist + audit insert + UI diff renderer together—never
    mass‑update outside audited tables.
12. Lore & Decision Records Before adding new domain terms, boundaries, or lifecycle rules: consult the Big-10 files (00 through 09) inside
    loremaster_next. Add or modify via a Decision Record (DR) and reference its id in code comments where architectural rationale applies.
13. Safe Extension Checklist (apply mentally before PR) (a) Reuse provider + quota hooks (b) Localize new UI strings (c) Register commands/settings in
    existing lifecycle hooks (`init()`, `registerSettings()`) (d) Keep Forge UI reactive—avoid direct DOM ops; use Vue (e) Reflect structural shifts
    in Loremaster docs + DR.
14. When Unsure Prefer reading cited files first: `forge.ts`, `shared/src/tools.ts`, `tools/shared/src/tools.ts`,
    `nexicore/server/api/forge/chat/completions.post.ts`, `dashboard/worker.js`, and `loremaster_next/09.0_change_control_and_decisions.md`.

Output answers referencing concrete files & existing patterns; avoid speculative refactors unless a DR path is provided.

---

Aaron / neostryder Preference Note (scoped): When assisting Aaron specifically, you may assume push-by-default multi-repo commit workflow (see root
`.github/copilot-instructions.md` Personal Workflow Preferences). For all other users (e.g., Dallen `dallenb4`, Nate `jack-indaboks`), revert to
conservative defaults (no implicit push, explicit staging flags, verbose explanations).
