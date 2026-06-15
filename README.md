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

### Foundry host workflow

Keep the live production lanes running at `foundryv13.rpgm.tools` and `foundryv14.rpgm.tools` with `-Profile live`.

Create `foundryv13dev.rpgm.tools` and `foundryv14dev.rpgm.tools` only when you need a module overlay. The dev lane seeds from the matching live lane once, then becomes its own sandbox.

Mount the built module into the dev lane with `_tools/foundry-runtime/Mount-FoundryModule.ps1`.

The reproducible startup sequence lives in `docs/foundry-host-model.md`.

### Versioned local testing against Foundry dev lanes

- The matching live lane stays available separately from the dev overlay lane.
- `pnpm test:v13` builds `rpgm-forge`, syncs the built `.dist/` payload into the public Foundry 13 dev lane, starts that lane if needed, and verifies the public assets at `https://foundryv13dev.rpgm.tools`
- `pnpm test:v14` builds `rpgm-forge`, syncs the built `.dist/` payload into the public Foundry 14 dev lane, starts that lane if needed, and verifies the public assets at `https://foundryv14dev.rpgm.tools`
- `pnpm test:v13:beta` does the same sync-and-verify flow, but builds against the public beta RPGM surface at `https://beta.rpgm.tools`
- `pnpm test:v14:beta` does the same sync-and-verify flow for the Foundry 14 lane against the public beta RPGM surface at `https://beta.rpgm.tools`
- `pnpm dev:v13` and `pnpm dev:v14` remain the local Vite proxy commands when you want live HMR against the matching public dev lane
- `pnpm dev:v13:beta` and `pnpm dev:v14:beta` remain the local Vite proxy commands for the beta RPGM surface
- The proxy URLs you open in the browser are:
    - V13 dev test proxy: `http://127.0.0.13:32013`
    - V14 dev test proxy: `http://127.0.0.14:32014`
    - V13 beta test proxy: `http://127.0.1.13:32113`
    - V14 beta test proxy: `http://127.0.1.14:32114`
- The `test:*` commands now handle the real public dev-lane payload update. They no longer stop at a local proxy smoke and they verify the public `module.json`, `account-session-return.html`, and `account-session-return.js` assets after sync.
- The `dev:*` proxy commands still expect the corresponding Foundry lane to be available.
- When the public dev hosts are reverse-proxied through a shared server, they must point at dedicated dev backend ports instead of the always-on live backends. Otherwise the hostname will look healthy while still serving the live module payload.
- The versioned scripts set the target Foundry URL, proxy hostname, and proxy port for you, so you do not need to edit `modules/rpgm-forge/.env` when switching between V13 and V14 testing.
- The Foundry lane target is now host-based instead of depending on fixed `:30013` or `:30014` browser origins, so the account handoff path matches the same host-safe flow used on arbitrary Foundry deployments.
- Use the version-specific proxy URLs rather than plain `localhost` so browser cookies stay isolated between the Foundry 13 compatibility lane and the Foundry 14 testing lane. Steward now accepts the Foundry browser origin you configure for that deployment, so the same dev workflow also works against user-hosted Foundry instances outside the RPGM-owned lanes.
- The beta variants keep production defaults unchanged but swap the shared account-center and Steward-backed Forge usage surface over to `https://beta.rpgm.tools`, which is the preferred local smoke path before any separate beta manifest or release channel exists.
- The public dev-lane sync helper reads `RPGM_FOUNDRY_TEST_SSH_KEY_PATH` when you want to override the SSH key path explicitly. In this workspace it also falls back to the newest private `.pem` in the workspace-root `.temp/` folder.

### Manual beta smoke with built module archives

- The default beta validation flow is still the local injected dev proxy path above, because it exercises the live beta service origin without changing production packaging.
- When you need to hand a tester a built module instead of a live dev proxy, run `pnpm build:forge:beta` first. That helper keeps the ordinary production-oriented build untouched, but injects the beta service and account-center origins into the packaged Forge module.
- The installable beta Forge payload lands in `modules/rpgm-forge/.dist/`, and that folder is the source of truth for manual archive smoke.
- For a local manual install, copy the contents of `modules/rpgm-forge/.dist/` into a test Foundry world's `Data/modules/rpgm-forge/` folder, then launch the same non-production Foundry lane you would use for beta proxy testing.
- For a shareable archive, package the contents of `modules/rpgm-forge/.dist/` as `rpgm-forge-v<version>.zip` and pair it with a manifest copied from `modules/rpgm-forge/.dist/module.json` as `rpgm-forge.json`. That matches the release workflow's artifact shape, so manual beta archive tests exercise the same files that later become published release assets.
- Use that built-archive path only for beta or local smoke worlds. Do not repoint the production manifest or release channel just to rehearse beta behavior.

### RPGM Tools

This project still targets the RPGM Tools service surface, but the old Forge
module no longer consumes the legacy `@rpgm/tools` package as a shared runtime
dependency.

### Building

`pnpm build`

- This will build all modules at once

### Releasing to GitHub and Foundry

- Pushing a module tag such as `forge-v2.2.0` still creates the GitHub release draft and uploads the versioned manifest and zip assets.
- Publishing that GitHub release now triggers `.github/workflows/publish-foundry-package.yaml`, which submits the matching version to Foundry through the official Package Release API.
- The Foundry publish workflow expects a GitHub Actions secret named `FOUNDRY_PACKAGE_RELEASE_TOKEN`. A repo-local `.env` can still supply the same variable for local dry runs with `scripts/publish-foundry-package.mjs`.
- Manual dry runs are also available through the `Publish Foundry Package` workflow dispatch path when you want to validate the payload before publishing the GitHub release.
- The Foundry automation uses the version-specific GitHub release asset URL for the manifest and the published GitHub release page as the release notes URL.

### Foundry marketplace presentation body

- Foundry documents an official API for publishing package releases, but not a documented API for editing the marketplace presentation body.
- `pnpm build:foundry-marketplace` regenerates `modules/rpgm-forge/assets/foundry-marketplace/body.generated.md` from the hand-edited template at `modules/rpgm-forge/assets/foundry-marketplace/body.template.md` and the release notes in `modules/rpgm-forge/assets/changelog/`.
- `pnpm publish:foundry:marketplace` uses Playwright to log into the Creator Portal, convert `body.generated.md` to HTML, update the `Description` field, save the package page, and verify the public listing.
- `pnpm publish:foundry:marketplace:dry-run` validates the login and editor wiring without saving.
- The full runbook lives in `docs/releasing-rpgm-forge.md`.
