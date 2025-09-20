Access:
- Foundry: Configure Settings → RPGM Forge
- RPGM Tools sidebar → Forge

All settings influence generated Lore output or behavior.

## Auto Name Tokens
Automatically generates and applies a name when a token is placed. Hold Shift while placing to bypass for that token.

## Rename Actors
If enabled, applying a generated token name also renames the underlying Actor. Disable to keep Actor names static while token names vary.

## Language
Primary language used for generated Lore phrasing.

## System
Rule system context (e.g., Dungeons & Dragons Fifth Edition). Affects terminology and mechanical flavor references.

## Genre
High-level thematic lens (Fantasy, Sci-Fi, Horror, etc.) guiding tone, motifs, and stylistic choices. You can get very specific or niche here.

## Providers (Per Generation Type)
Instead of a global method toggle, Forge now lets you choose a provider for each kind of Lore:
- Names
- Descriptions
- Homebrew

Options include:
- Hosted RPGM provider(s)
- Your own configured external provider(s)
- Offline curated list `rpgm-names-offline` (Names only) for quick, connection-light name generation
- Adjective mode `rpgm-names-adjective` (Names only) for random adjective + base subject

Changing a provider immediately affects subsequent Lore requests of that type.
> External providers vary in quality and payload shapes; results are not guaranteed.

### Offline Names Provider
Select `rpgm-names-offline` in the Names provider slot for an offline-friendly fallback. This applies only to Name generation; Descriptions and Homebrew require an online provider.

### Adjective Names Provider
Select `rpgm-names-adjective` to build names by prepending a random adjective (recent repeats suppressed) to the base subject or actor name. Great for fast flavorful variety. No quota usage.

## Tips
- Keep Genre/System aligned with the current campaign to maintain cohesive style.
- Use a consistent Language across a world for immersion.
- If experimenting, switch only one provider type at a time to isolate differences.
