# Releasing RPGM Forge

This runbook documents the repeatable release path for `rpgm-forge`, including the GitHub release, the Foundry package publication, and the Creator Portal marketplace presentation update.

## Requirements

- `gh` authenticated for `RPGM-Tools/foundry`
- `pnpm install` completed in `rpgm/foundry`
- One-time local browser install for the marketplace automation:
    - `pnpm setup:playwright`
- Workspace or repo `.env` contains:
    - `FOUNDRY_PACKAGE_RELEASE_TOKEN`
    - `FOUNDRY_MARKETPLACE_USERNAME`
    - `FOUNDRY_MARKETPLACE_PASSWORD`
- Module version updated in `modules/rpgm-forge/package.json`
- Matching changelog file created in `modules/rpgm-forge/assets/changelog/`

## Source files used by the release process

- GitHub release notes: `modules/rpgm-forge/assets/changelog/vX.Y.Z.md`
- Marketplace template: `modules/rpgm-forge/assets/foundry-marketplace/body.template.md`
- Generated marketplace body: `modules/rpgm-forge/assets/foundry-marketplace/body.generated.md`

## Release flow

### 1. Prepare the release locally

Run the standard build and regenerate the marketplace body:

```text
pnpm build
pnpm build:foundry-marketplace
```

Review:

- `modules/rpgm-forge/.dist/module.json`
- `modules/rpgm-forge/assets/foundry-marketplace/body.generated.md`

### 2. Commit and push the release-ready changes

Commit the version bump, changelog, workflow changes, and marketplace-body updates, then push `main`.

### 3. Create and push the release tag

Create a tag such as `forge-v2.2.0` and push it.

That tag triggers `.github/workflows/release.yaml`, which:

- validates the module version against the tag
- verifies the matching changelog file exists
- installs dependencies and builds the project
- uploads the versioned zip and manifest assets
- creates a GitHub draft release

### 4. Publish the GitHub draft release

Publish the draft release from GitHub or with `gh`:

```text
gh release edit forge-v2.2.0 --repo RPGM-Tools/foundry --draft=false --latest
```

Publishing the draft triggers `.github/workflows/publish-foundry-package.yaml`, which submits the matching version to Foundry through the official Package Release API.

### 5. Update the marketplace presentation page

Run the Playwright automation after the GitHub release is live and the Foundry release workflow has succeeded:

```text
pnpm publish:foundry:marketplace
```

This script:

- loads `FOUNDRY_MARKETPLACE_USERNAME` and `FOUNDRY_MARKETPLACE_PASSWORD` from the nearest available `.env` up the directory tree
- opens `https://foundryvtt.com/packages/rpgm-forge/edit`
- logs into Foundry if needed
- converts `body.generated.md` to HTML
- updates the `Description` field in the Creator Portal form
- saves the package page
- verifies the public package page reflects the new marketplace heading

For a no-save validation pass:

```text
pnpm publish:foundry:marketplace:dry-run
```

### 6. Verify the public result

Check:

- `https://github.com/RPGM-Tools/foundry/releases/tag/forge-vX.Y.Z`
- `https://github.com/RPGM-Tools/foundry/releases/download/forge-vX.Y.Z/rpgm-forge.json`
- `https://foundryvtt.com/packages/rpgm-forge/`

Confirm:

- the GitHub release is published
- the manifest version matches the tag
- Foundry shows the expected compatibility
- the marketplace body reflects the generated presentation copy and bottom-mounted changelog

## Scripts involved

- `pnpm build:foundry-marketplace`
    - builds the marketplace Markdown body from the template plus changelog files
- `pnpm publish:foundry`
    - local helper for Foundry Package Release API publication
- `pnpm publish:foundry:marketplace`
    - Playwright automation for Creator Portal description updates
- `pnpm publish:foundry:marketplace:dry-run`
    - login and form-update dry run without saving
- `pnpm release:forge:prepare`
    - runs the main build and marketplace-body generation together
- `pnpm setup:playwright`
    - installs the Chromium runtime used by the Playwright marketplace updater

## Failure recovery notes

- If the tag-driven GitHub release workflow fails, fix the root cause on `main`, move the release tag to the corrected commit, and push the tag again.
- If the Foundry Package Release workflow fails, inspect the workflow logs first. The release API path is separate from the Creator Portal page update.
- If the marketplace update fails, rerun `pnpm publish:foundry:marketplace:dry-run` to validate login, editor access, and generated body wiring before saving again.