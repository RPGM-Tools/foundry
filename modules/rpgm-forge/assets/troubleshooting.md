## Nothing Happens After a Command
- Verify the leading asterisk (`*name`).
- Select a token or include a subject.
- Confirm provider configuration and logged-in status (Descriptions/Homebrew need an online provider).

## I Can't Copy the Generated Text from the Chat
- Modern browsers do not allow copying via JavaScript on insecure sites. Configure your Foundry VTT server with SSL (https) to be able to copy from generated chat cards.

## Names Look Repetitive
- Adjust Genre/System for more variation.
- Try switching the Names provider (hosted vs your own vs offline).
- Click the `Regenerate` crystal to cycle the candidate list.

## Descriptions Feel Off-Theme
- Update Genre or System.
- Provide a sharper subject: `*description salt-corroded leviathan hulk`.
- Click the `Regenerate` crystal to resubmit the same request for a different result.

## Homebrew Wizard Does Not Open
- Check exact spelling: `*homebrew`.
- If a type is specified and fails, try without one to ensure base functionality.

## Name Not Applied to Actor
- Enable Rename Actors if you want Actor renaming; otherwise only the token updates.

## Autocomplete Missing
- Type immediately after `*`. Another module may conflict; disable conflicting chat enhancements to test.

## Offline Provider Not Appearing
- The offline option is currently available only for Names. Descriptions and Homebrew require an online provider selection.

## My Custom AI Provider Is Not Working
- `API Base URL` must include the protocol (http:// or https://).
- External providers vary in quality and payload shapes; results are not guaranteed.

## Persistent Issues
1. Refresh the Foundry client.
2. Re-check provider credentials (no trailing spaces, correct endpoint).
3. Inspect browser console for blocked requests.
4. Re-save configuration to ensure settings persisted.
