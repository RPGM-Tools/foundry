# Foundry host model and launch workflow

This runbook captures the lane model used for local RPGM Foundry work.

## Lane map

- `foundryv13.rpgm.tools` -> Foundry 13 live production lane
- `foundryv13dev.rpgm.tools` -> Foundry 13 dev overlay lane
- `foundryv14.rpgm.tools` -> Foundry 14 live production lane
- `foundryv14dev.rpgm.tools` -> Foundry 14 dev overlay lane

The live lanes are intended to stay up. The dev lanes are created only when you need to test a mounted module.

## Start the production lane

Use the live profile for the always-on host:

```powershell
pwsh -File _tools/foundry-runtime/Start-Foundry.ps1 -Version 13 -Profile live
pwsh -File _tools/foundry-runtime/Start-Foundry.ps1 -Version 14 -Profile live
```

These profiles keep their own data roots and do not reuse the dev overlay.

## Create the dev overlay lane

Use the dev profile only when you need a module-under-test mount:

```powershell
pwsh -File _tools/foundry-runtime/Start-Foundry.ps1 -Version 13 -Profile dev
pwsh -File _tools/foundry-runtime/Start-Foundry.ps1 -Version 14 -Profile dev
```

The first dev launch seeds `Config` and `Data` from the matching live lane once, then the dev lane diverges as its own sandbox.

## Mount the module under test

Mount the built module into the dev lane with the helper:

```powershell
pwsh -File _tools/foundry-runtime/Mount-FoundryModule.ps1 -Version 14 -Profile dev -ModuleId rpgm-forge -SourcePath c:\Repositories\rpgm\foundry\modules\rpgm-forge\.dist
```

On Windows, the helper defaults to a junction. Use `-LinkType symlink` when the test scenario specifically needs a symbolic link.

## Validate the versioned dev proxies

Once the matching dev lane is running, point the repo proxy at it:

- `pnpm test:v13` -> Foundry 13 dev lane
- `pnpm test:v14` -> Foundry 14 dev lane
- `pnpm test:v13:beta` -> Foundry 13 dev lane with the beta RPGM surface
- `pnpm test:v14:beta` -> Foundry 14 dev lane with the beta RPGM surface

The prod lanes stay separate, so you can keep the live host available while you iterate on the dev overlay.

## Sync the public AWS-backed dev lanes

When you need the public `foundryv13dev.rpgm.tools` or `foundryv14dev.rpgm.tools` hosts to serve the current Forge build, use the repo test commands instead of relying on the local Vite proxy alone:

```powershell
pnpm test:v13
pnpm test:v14
pnpm test:v13:beta
pnpm test:v14:beta
```

Those commands build `modules/rpgm-forge/.dist/`, copy that payload onto the matching remote dev lane, start the lane if it is down, and verify the public asset URLs afterward. Keep using `pnpm dev:v13` or `pnpm dev:v14` when you specifically want the local HMR proxy layered on top of a lane that is already serving the right module files.

On a shared public host, the dev hostnames must reverse-proxy to dedicated dev backend ports rather than the always-on live ports. The current AWS lane split uses separate internal ports for the public dev hostnames so `foundryv13dev.rpgm.tools` and `foundryv14dev.rpgm.tools` can serve their own `*-dev` data paths without stealing or mirroring the live production lanes.