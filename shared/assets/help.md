# Welcome to RPGM Tools for Foundry VTT

Welcome! RPGM Tools is a suite of highly specialized tools for GMs and players of TTRPGs inside Foundry VTT. This documentation covers all RPGM modules for Foundry. As new modules are released, each will have its own section with features, usage, settings, and tips.

---

## Forge

Forge adds instant creative tools to your Foundry VTT experience—right from the HUD or via chat commands. Use the **Crystal Menu** on tokens and the `*` chat commands to generate names, descriptions, and custom content in seconds.

### Using the Crystal Menu (Token HUD)

- **Right-click any token** to open the TokenHUD.
- At the **top-right of the token**, the **Crystal Menu** appears with:
  - **Generate Name**
    Generates a new name (using **AI** or **Simple/offline**; set in settings). Automatically renames the token—and the actor, if **Rename Actors** is enabled.
  - **Generate Description**
    Creates an AI-generated description using the token’s context and your selected **Language, System,** and **Genre**. The description appears as a chat card.

### Using Chat Commands

Each command starts with an asterisk (`*`). All output uses your current **Language, System, Genre,** and **Method** settings.

- `*name`
  - No argument: Uses the selected token’s context to generate four clickable names. Click any name to rename the token (and actor, if enabled).
  - With argument: (e.g., `*name smelly, hairy troll`) Uses your text to theme the names.
- `*description`
  - No argument: Describes the selected token.
  - With argument: (e.g., `*description ancient crypt guardian`) Describes the provided subject.
- `*homebrew`
  - No argument: Launches the Homebrew Creator wizard (random preset).
  - With argument: (e.g., `*homebrew Insect`) Starts wizard for the given subject.
- `*help`
  - No argument: Shows this help page.
  - With argument: (`name`, `description`, `homebrew`, `hud`, or `settings`) Shows focused help for that feature.

#### Example Commands

- `*name dwarven city`
- `*description magical tavern`
- `*homebrew cursed sword`

### Module Settings

Open **Foundry’s Game Settings** and select “RPGM Forge” to adjust:

- **Auto Name Tokens**
  Automatically name tokens when placed. Hold **Shift** to bypass.
- **Rename Actors**
  Renames the actor when the token is renamed (if enabled).
- **Language**
  Sets the language for all generated content.
- **System**
  Sets the game system for system-aware content.
- **Genre**
  Sets the genre for all generated content.
- **Method**
  Choose **AI** (richer results, online/API key) or **Simple** (offline).
- **Radial Menu**
  Configure the Crystal Menu.
- **Secrets**
  Manage API keys for AI generation.
- **Developer Settings**
  Advanced/testing options.

### Tips & Help

- Drag results from chat cards into journals, sheets, or scenes.
- All output uses your **Language, System, Genre,** and **Method** settings.
- **Auto Name Tokens** and **Rename Actors** make naming seamless.
- **Plans are available to remove daily AI generation restrictions.** If you reach your free daily limit and want unlimited access, upgrade via your RPGM Tools account or the settings menu.
- Need help? Join our [Discord](https://discord.gg/YegtwbHTBQ).
- To check for updates, visit the Foundry module manager regularly.

---


Enjoy fast, AI-powered creativity—right at your fingertips in Foundry VTT!

