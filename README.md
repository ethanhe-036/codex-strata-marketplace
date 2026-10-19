# Strata for Codex — Windows beta

Strata adds an offline theme library, theme creation Skill, personal copies,
preview/apply, undo and Original restoration to Codex Desktop. This repository
contains the prebuilt **0.3.16-beta.1** plugin and its Git marketplace.
It is an independent project, not affiliated with or endorsed by OpenAI.

## Requirements

- Windows with the Microsoft Store installation of Codex Desktop. The desktop
  adapter has been exercised on 26.930.3748.0 and 26.930.4958.0. Other desktop
  versions need compatibility checks; macOS, Linux and remote execution are
  not supported by this beta.
- A Codex client with `codex plugin marketplace add` support, and Git on PATH.
- Codex's bundled Node runtime, or Node.js 22+ on PATH. No npm install or build
  is required to use this distribution.

## Install

```powershell
codex plugin marketplace add ethanhe-036/codex-strata-marketplace --ref main
codex plugin add strata@strata-marketplace --json
```

You can also select **Strata themes** in Codex's plugin browser after adding
the marketplace and install Strata there. Open Strata from Explore and pin it
to the global rail if desired. If a running Codex session has not refreshed its
plugin list, save your work and restart it when convenient.

For an offline checkout, run `codex plugin marketplace add .` from this folder,
then the same plugin-install command. This is a separate marketplace from the
developer's `strata-local`; do not enable both copies in the same desktop profile.

## First desktop connection

The library can be browsed before enabling the desktop connection. Live preview
and Apply require a local connection to the chosen Codex profile.

1. Save your work. In Strata, choose **Enable desktop connection** and prepare
   the reconnection helper. A Codex + Strata shortcut is optional.
2. Only when it is safe to interrupt that Codex instance, use **File → Exit**.
   The helper waits for this normal exit; it does not force-close Codex.
3. Reopen Strata after the helper relaunches the same profile, reconnect if
   needed, then preview or apply a bundled theme. Use the optional shortcut for
   subsequent connected starts; the ordinary Codex shortcut does not retain
   the connection flags.

Do not perform the restart while other chats need the same running instance.
The connection uses a loopback debugging endpoint and a version-dependent
desktop adapter. This beta does not promise compatibility with every Codex
update. Details and recovery instructions are in [RUNNING.md](docs/RUNNING.md).

## Update and remove

```powershell
codex plugin marketplace upgrade strata-marketplace
codex plugin add strata@strata-marketplace --json
```

Reopen Strata after updating. If Codex retains the old App resource or service,
restart only after saving work and allowing other chats to finish. Updates keep
personal data under `%LOCALAPPDATA%/Strata`, outside the installed package.

Before removal, choose **Original** in Strata. If the App is unavailable, use
`node dist/cli.mjs --profile "<browser profile>"` from this package and run
`recover`. Then uninstall:

```powershell
codex plugin remove strata@strata-marketplace
codex plugin marketplace remove strata-marketplace
```

Keep personal themes and recovery data unless you deliberately want to remove
them. Delete the optional Codex + Strata shortcut if it is no longer needed.

## Package contents and verification

Only Blue Hour, Sand and the original Paper Atlas artwork are bundled. Personal
theme archives, reference images, screenshots, credentials, development files
and the private development repository's Git history are not distributed.
The release repository starts with its own history.

With Node 22+ available, verify the exact file allowlist and checksums:

```powershell
node scripts/verify-package.mjs
```

This verifies package integrity, not live desktop behavior. The beta still
requires native acceptance of first-time setup, complete host scenes, restart,
upgrade and uninstall/recovery. Isolated browser/controller checks do not
replace that acceptance.

See the [MIT license](LICENSE), [third-party notices](dist/THIRD_PARTY_NOTICES.md)
and [file checksums](SHA256SUMS.json). Report reproducible issues in this
repository's Issues, including your Codex version and the operation attempted;
omit conversation content, credentials and private theme artwork.
