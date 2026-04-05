# RPGM Forge

<h2 style="text-align: center; color: #7d31ff; margin: 0;">RPGM Forge: AI-Augmented Prep &amp; Play for Foundry VTT</h2>

<p><strong>RPGM Forge</strong> keeps your game moving with instant names, flavorful descriptions, and guided homebrew generation right inside Foundry. Use it mid-session for quick improvisation, or between sessions when you want polished material without breaking creative momentum.</p>

<h3>Feature Preview</h3>

<p>Forge fits into the way GMs already work: click from the Token HUD, use the Crystal Menu, drag ideas into place, or fire off a chat command when you want results fast.</p>

<table>
    <tbody>
        <tr>
            <td>
                <video controls muted loop playsinline width="100%">
                    <source src="https://rpgm.tools/assets/names_chat.mp4" type="video/mp4" />
                </video>
            </td>
            <td>
                <video controls muted loop playsinline width="100%">
                    <source src="https://rpgm.tools/assets/names_hud.mp4" type="video/mp4" />
                </video>
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <video controls muted loop playsinline width="100%">
                    <source src="https://rpgm.tools/assets/forge_drag.mp4" type="video/mp4" />
                </video>
            </td>
        </tr>
    </tbody>
</table>

<h3>Automatic Token Naming &amp; Renaming</h3>

<p>Name tokens as they appear, or generate fresh options on demand from the Token HUD's Crystal Menu. Forge can use the selected token as context, offer multiple candidates at once, and make rapid iteration painless when you want just the right fit.</p>

<table>
    <tbody>
        <tr>
            <td><img src="https://rpgm.tools/assets/names_1.png" alt="Token before renaming" /></td>
            <td><img src="https://rpgm.tools/assets/names_2.png" alt="Token after AI-generated name" /></td>
        </tr>
        <tr>
            <td><img src="https://rpgm.tools/assets/names_3.png" alt="Crystal Menu for token naming" /></td>
            <td><img src="https://rpgm.tools/assets/names_4.png" alt="Token after renaming via menu" /></td>
        </tr>
    </tbody>
</table>

![Name suggestions in chat](https://rpgm.tools/assets/names_5.png)

<p>Use <strong><code>*name</code></strong> in chat to get four themed candidates in a private GM card. Click one to apply it instantly, and keep iterating without losing the previous option. It is fast, practical, and built for live table use.</p>

<h3>AI-Generated Descriptions</h3>

<table>
    <tbody>
        <tr>
            <td><img src="https://rpgm.tools/assets/description_1.png" alt="Generate description from TokenHUD" /></td>
            <td><img src="https://rpgm.tools/assets/description_2.png" alt="Generated description in chat" /></td>
        </tr>
    </tbody>
</table>

<p>Generate vivid, system-agnostic descriptions for creatures, NPCs, locations, and scenes. Trigger it from the Crystal Menu or with chat, then read the result aloud, copy it, or save it to a journal when you want to keep the lore.</p>

<h3>Custom Homebrew Generation Forms</h3>

<table>
    <tbody>
        <tr>
            <td><img src="https://rpgm.tools/assets/homebrew_1.png" alt="Homebrew generation form" /></td>
            <td><img src="https://rpgm.tools/assets/homebrew_2.png" alt="Homebrew output" /></td>
        </tr>
    </tbody>
</table>

<p>Open guided forms for homebrew generation, start from a preset, or shape your own prompt path. Forge is built for practical output you can actually use: details you can review, refine, copy to the clipboard, or save directly into a journal for later.</p>

<h3>Chat Commands</h3>

![Chat command examples](https://rpgm.tools/assets/commands.png)

<p>Prefer the keyboard? Every core feature is available through autocomplete-enabled chat commands. Use the selected token for context, or provide your own subject when you want more control.</p>

<p><code>*name</code> | <code>*description &lt;subject&gt;</code> | <code>*homebrew</code> | <code>*help</code></p>

---

**Privacy and data**

_Offline and Adjective Names do not require AI._ Descriptions and Homebrew use a hosted AI provider.

<p>Names can also use different provider modes, including hosted AI, curated offline options, and adjective-style generation, so you can tune the experience to your table and your workflow.</p>

[rpgm.tools](https://rpgm.tools/) • [Discord](https://discord.gg/YegtwbHTBQ) • [GitHub](https://github.com/RPGM-Tools)

## Changelog

### v2.2.0

#### Added


- Added official Foundry V14 support and updated the package metadata to advertise `Verified 14`.

#### Improved


- Reworked chat command autocomplete and command execution to behave correctly across Foundry 12, 13, and 14.
- Updated the V14 chat path to use Foundry's supported ProseMirror APIs and native send flow instead of unsupported internals.
- Refreshed low-risk same-major dependencies used by the Foundry workspace to current compatible releases.

#### Fixed


- Corrected command suggestion selection so the leading `*` stays in place and autocomplete does not append stray keystrokes.
- Fixed V14 chat command submission so pressing `Enter` executes commands cleanly without leaving blank lines behind in the chat input.
- Corrected the notification styling class name so modern Foundry notification elements receive the intended RPGM styling.

### v2.1.4

#### Fixed


- Resolved a regression that caused Foundry to throw `DataCloneError` when other modules injected custom sidebar tabs. The RPGM tab now adjusts the registry in-place so third-party tabs remain intact.

#### Improved


- Ensured the RPGM sidebar button always anchors immediately before the Settings tab while preserving every other tab’s original order.
- Allow Archivist Sync and similar modules to toggle their own tabs without losing spacing or visibility during setup wizards.

### v2.1.3

#### Fixed


- Addressed the packaging regression that made v2.1.2 installs unreliable for some Foundry instances.

#### Changed


- Kept the prompt variety improvements introduced in v2.1.2 while restamping the release as v2.1.3.

### v2.1.2

#### Changed


- Updated prompts to provide more variation on generated names.

### v2.1.1

#### Changed


- Forgot password option added.

### v2.1.0

#### Added

- New Names provider: `rpgm-names-adjective` (offline) – adjective + base subject naming.
- Tooltips for Names provider selector (AI vs Offline vs Adjective vs Custom).

#### Changed

- Updated docs to reflect multiple offline-capable name modes.

### v2.0.1

- Fixed buggy UI on certain input fields in Foundry
- Fixed being unable to generate the first time the world is loaded
- Fixed dice menu glitching when opening the context menu of a chat

### v2.0.0

- **RPGM Tools Sidebar Panel:** A new sidebar panel has been added for quick access to membership, Forge settings, and user documentation
- **Membership Management in Module:** Create a free membership and manage your membership level directly in Foundry
- **Supporter Membership Name:** The $5/month supporter membership has been renamed from `Adventurer` to `Crafter`
- **Add Your Own AI Providers:** You can now add your own AI providers for use generating names, description, and homebrew!  (Results are not guaranteed)
