# RPGM Forge

**Enhance your Foundry VTT experience with an AI-assisted toolkit for Game Masters! RPGM Forge helps you generate immersive content, manage homebrew assets, and streamline your storytelling—right from within Foundry.**

---

## Features

- **Intelligent Name Generation**
  Quickly generate character names, place names, and more—customized to fit your campaign’s setting and style.

- **AI-Powered Description Generation**
  Instantly create evocative scene and NPC descriptions, lore snippets, and adventure hooks to keep your sessions dynamic and engaging.

- **Homebrew Generation Tools**
  Effortlessly generate complex homebrew content such as monsters, items, places, and characters—tailored for your campaign’s needs.

- **Seamless Foundry Integration**
  All features are designed to work directly within the Foundry VTT interface for a smooth and intuitive workflow.

---

## Installation

### 1. **Foundry Virtual Tabletop Package Manager**

1. In Foundry VTT, go to the **Add-on Modules** section.
2. Click **Install Module**.
3. Search for `RPGM Forge` in the package list.
4. Click **Install**.

---

### 2. **Manual Installation (Manifest URL)**

1. In Foundry VTT, go to the **Add-on Modules** section.
2. Click **Install Module**.
3. Paste the following Manifest URL into the field:

```text
https://github.com/RPGM-Tools/foundry/releases/latest/download/rpgm-forge.json
```

1. Click **Install**.

---

## Authors

- **dallenb4** ([dallenb4@rpgm.tools](mailto:dallenb4@rpgm.tools))
- **Aragorn** ([aragorn@rpgm.tools](mailto:aragorn@rpgm.tools))
- **jack_indaboks** ([jack_indaboks@rpgm.tools](mailto:jack_indaboks@rpgm.tools))

---

## Screenshots

_Coming soon! Here you'll find images and examples showing RPGM Forge in action._

---

_Thank you for using RPGM Forge! Stay tuned for more features and updates and future tools from your friends at RPGM Tools!_

## Development

### Installation

`pnpm install`

### Local development

- To run a dev server for a specific module, run `pnpm --filter <module-name> dev`
    - With this, the dev server will HMR Vue files and reload the page for TS files.
    - Changes to i18n require a build and dev server restart
- Each .env file must be placed in the module's folder it is being used for (will be used for that module's dev server)
    - VITE_FOUNDRY_URL: The foundry instance url to proxy
    - VITE_RPGM_URL (optional): The rpgm.tools server to use (https://rpgm.tools is the default)

### Versioned local testing against Foundry dev lanes

- `pnpm test:v13` runs the `rpgm-forge` Vite dev proxy against the Foundry 13 dev lane at `fvtt-v13-dev.localhost:30013`
- `pnpm test:v14` runs the `rpgm-forge` Vite dev proxy against the Foundry 14 dev lane at `fvtt-v14-dev.localhost:30014`
- Equivalent aliases: `pnpm dev:v13` and `pnpm dev:v14`
- The proxy URLs you open in the browser are:
    - V13 dev test proxy: `http://127.0.0.13:32013`
    - V14 dev test proxy: `http://127.0.0.14:32014`
- These commands expect the corresponding Foundry lane to already be running through the workspace Foundry runtime wrappers.
- The versioned scripts set the target Foundry URL, proxy hostname, and proxy port for you, so you do not need to edit `modules/rpgm-forge/.env` when switching between V13 and V14 testing.
- Use the version-specific loopback proxy URLs rather than plain `localhost` so browser cookies stay isolated between the V13 and V14 test lanes without relying on hosts-file DNS aliases.

### RPGM Tools

This project uses [RPGM Tools](https://github.com/RPGM-Tools/tools).

To update the module after changes, run `pnpm update @rpgm/tools`

### Building

`pnpm build`

- This will build all modules at once

### Releasing to GitHub and Foundry

- Pushing a module tag such as `forge-v2.2.0` still creates the GitHub release draft and uploads the versioned manifest and zip assets.
- Publishing that GitHub release now triggers `.github/workflows/publish-foundry-package.yaml`, which submits the matching version to Foundry through the official Package Release API.
- The Foundry publish workflow expects a GitHub Actions secret named `FOUNDRY_PACKAGE_RELEASE_TOKEN`. A repo-local `.env` can still supply the same variable for local dry runs with `scripts/publish-foundry-package.mjs`.
- Manual dry runs are also available through the `Publish Foundry Package` workflow dispatch path when you want to validate the payload before publishing the GitHub release.
- The Foundry automation uses the version-specific GitHub release asset URL for the manifest and the published GitHub release page as the release notes URL.
