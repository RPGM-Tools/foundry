> Use Forge during play to craft or refine Lore on demand.

## 1. Token-Based Generation
Select a token to allow context-aware operations (its current name and actor prototype contribute to naming/description prompts when no subject is specified).

### Token HUD & Crystal Menu
- Generate Name: Produces four candidate names. Selecting one applies it (and optionally the Actor if Rename Actors is on).
- Generate Description: Produces a descriptive Lore snippet shaped by the token's name, System, Genre, and the active provider for Descriptions.
- Homebrew: Opens the interactive wizard to scaffold custom Lore objects.

## 2. Chat Commands
All commands begin with `*` and support autocomplete.

Context:
- Omitted subject → uses selected token
- Provided subject → uses your text only

### `*name [subject?]`
Examples:
- `*name` (selected goblin token)
- `*name eerie ghost ship`

Returns four clickable names in a private GM chat card that can either apply directly to the selected token or use in creating lore.

### `*description [subject?]`
Examples:
- `*description` (selected token)
- `*description obsidian spire fortress`

Returns a descriptive paragraph in a private GM chat card which can be copied (https host only) or saved to a journal.

### `*homebrew [type?]`
Examples:
- `*homebrew` (random preset)
- `*homebrew cursed sword`

Launches the Homebrew wizard in a private GM chat card for customization of homebrew generation.

### `*help`
Pops out the help reference in the RPGM Tools menu.

## 3. Applying Names
Click a listed name to assign it. The previous name is rotated back into the candidate list, enabling fast iteration.

## 4. Provider Awareness
- Each Lore type (Names, Descriptions, Homebrew) uses its configured provider.
- Switching a provider affects subsequent results immediately.
- Offline option (`rpgm-tools-offline`) applies to Names only.

## 5. Best Practices
- Keep Language/System/Genre aligned to avoid stylistic drift.
- Use vivid but concise prompts for subject-based commands.
- For large NPC batches, enable Auto Name Tokens, then refine selectively.
