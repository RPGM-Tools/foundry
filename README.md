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

```
https://github.com/RPGM-Tools/foundry/releases/latest/download/rpgm-forge.json
```

4. Click **Install**.

---

## Authors

- **dallenb4** ([dallenb4@rpgm.tools](mailto:dallenb4@rpgm.tools))
- **Aragorn** ([aragorn@rpgm.tools](mailto:aragorn@rpgm.tools))
- **jack_indaboks** ([jack_indaboks@rpgm.tools](mailto:jack_indaboks@rpgm.tools))

---

## Screenshots

*Coming soon! Here you'll find images and examples showing RPGM Forge in action.*

---

*Thank you for using RPGM Forge! Stay tuned for more features and updates and future tools from your friends at RPGM Tools!*

# Development

## Installation
`pnpm install`

## Development
- To run a dev server for a specific module, run `pnpm --filter <module-name> dev`
  - With this, the dev server will HMR Vue files and reload the page for TS files.
  - Changes to i18n require a build and dev server restart
- Each .env file must be placed in the module's folder it is being used for (will be used for that module's dev server)
  - VITE_FOUNDRY_URL: The foundry instance url to proxy
  - VITE_RPGM_URL (optional): The rpgm.tools server to use (https://rpgm.tools is the default)

### RPGM Tools
This project uses [RPGM Tools](https://github.com/RPGM-Tools/tools).
To update the module after changes, run `pnpm update @rpgm/tools`

## Building
`pnpm build`
- This will build all modules at once
