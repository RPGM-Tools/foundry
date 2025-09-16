## RPGM Core Terms
- Forge: The module layer enabling AI-assisted Lore inside Foundry.
- Lore: Any generated or curated narrative element (names, descriptions, homebrew objects).
- Homebrew Wizard: Interactive chat-based interface for structured Lore creation.
- Crystal Menu: A branching crystal-styled interface offering quick access to Lore actions.
- Dabbler: Free membership level that enables the use of offline generation and limited use of hosted AI generation.
- Crafter: $5/month membership level that removes daily generation limits and unlocks priority support via Discord.
- Provider: A configured AI backend (hosted or user-supplied) used per Lore type.
- Offline Names Provider: The special `rpgm-tools-offline` option for Name generation without a network call.
- Auto Name Tokens: Automatic naming behavior applied on token placement.
- Rename Actors: Setting that propagates token name changes to the underlying Actor.

## AI & Generation Terms
- API Base URL: A URL supplied by an AI provider or configured in your local LLM.
- API Key: Credential authenticating requests to a provider.
- Prompt: Text subject or instruction guiding generation.
- Context Settings: Language, System, Genre values injecting thematic bias.
- Provider Assignment: Per-type selection of which backend handles Names, Descriptions, or Homebrew.

## Foundry Terms (Relevant to Forge Integration)
- Actor: Source entity definition for tokens.
- Token: Canvas representation of an Actor.
- Token HUD: On-canvas overlay with quick actions (Forge buttons may appear here).
- World Setting: Persisted configuration at world scope.
- Canvas: The scene area where tokens are placed and selected.
- Sidebar: UI region where modules and panels appear.

## Interaction & UI Terms
- Chat Command: Asterisk-prefixed directive (`*name`, `*homebrew`) parsed by Forge.
- Autocomplete: Inline suggestion system triggered after typing `*`.
- Wizard (Chat Wizard): Persistent interactive chat card (e.g., homebrew creation interface).
- Setup Card: Initial configuration prompt on first use.
- Candidate List: Generated set of names displayed for selection.
