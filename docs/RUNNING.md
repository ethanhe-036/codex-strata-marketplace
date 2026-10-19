# Run the Strata development candidate

Windows is the current target. Local checks used Windows Store Codex
26.930.3748.0, with the restart helper additionally checked on 26.930.4958.0,
and Node 24.19.0; Node 22 or newer is required. This candidate
is not a completed public release. Native App display, everyday-profile setup,
all desktop scenes and the complete creation journey still need acceptance.

## Build and install from source

From the repository root:

```powershell
npm ci
npm run package
codex plugin marketplace add .
codex plugin add strata@strata-local --json
```

The repository marketplace points to `dist/plugin`. The package contains bundled
JavaScript, offline HTML, connection helpers, the authoring Skill, three public
themes, the MIT license and exact bundled dependency notices. It excludes the
repository history, development dependencies, diagnostic captures and personal
theme assets. `SHA256SUMS.json` records the packaged files. Building requires the
locked npm dependencies; ordinary use of the installed package does not.

In Codex, open Strata through Explore and pin its entry to the narrow global
rail if desired. The entry was observed on the installed host. After updating,
reopen Strata. The desktop can retain an older sidebar entry or already-open
App resource until its plugin list refreshes; returning focus from another
application may trigger that refresh. A normal Codex exit/restart is a fallback
for a retained plugin server, after saving work. From 0.3.6, a companion whose
installed directory was removed drains accepted operations and releases its
local connection promptly, preserving the saved theme and recovery records.
Install changed candidates under a new plugin version instead of overwriting an
installed version in place: Codex persists App resources using the plugin version
and resource URI. From 0.3.2, Strata also includes the served HTML fingerprint in
that URI. The old unversioned URI remains readable for existing saved tool results.
A normal restart loads an installed update; it does not enable the separate
desktop connection described below.

### Full-page Strata and conversation controls

From 0.3.14, a connected standalone Strata page uses the main content area and
temporarily hides its duplicated host headers and floating conversation. Use
**显示会话** to restore those controls, and **专注视图** to expand Strata again.
Starting a creation/refinement chat also restores the conversation controls.
This does not change the selected/applied theme or its undo record.

The layout adapter matches the requesting sandbox's visible standalone frame.
Split panels, unknown structures and disconnected desktops keep native layout
and the host's composer safe area. Navigation releases the layout, and a lost
heartbeat restores host controls within 15 seconds. The focused and restored
bounds were checked on Codex 26.930.4958.0. Future host structures require fresh
verification. The layered SVG mark is shared by the page and the MCP service's
`initialize.serverInfo.icons` data URI. Codex's global entry uses tool icons or
this server icon fallback; plugin `composerIcon`/`logo` metadata alone does not
reach the rail. Version 0.3.15 verifies the actual initialization handshake in
addition to packaging the local plugin assets.

## Desktop connection

The plugin identifies the desktop process and its actual browser profile from
verified Store executable/process ancestry and command-line data. It does not
assume that an SSH task’s localhost is the desktop, or that browser storage is
identical to Electron’s application-data directory. Multiple profiles require
a deliberate profile choice when process ancestry cannot identify the caller.

The everyday Codex process currently has no appearance connection by default.
Before first enablement, saved themes and synthetic samples remain available,
but live preview and Apply are disabled. The theme details explain this beside
the disabled actions and offer **Enable desktop connection**; Settings also
contains **Enable connection (restart required)**. Reconnect alone does not
enable a running process that was launched without connection parameters. A
normal Windows Codex shortcut does not retain flags from an earlier relaunch.
Saved theme details load before reconnecting, so connection delays do not block
offline browsing.

Either enablement entry prepares the same one-time plan. In 0.3.3, the dialog
explicitly separates preparing the helper from exiting Codex:

1. Save work and choose **Prepare reconnection helper**. Wait for readiness.
2. In the chosen Codex window, use **File → Exit** (`Ctrl+Q`). Closing the window
   with × can leave Codex running in the tray and does not complete setup.
3. Wait for the helper to reopen the same browser profile with the local
   connection. Reopen Strata, reconnect if needed, then apply the chosen theme.

The helper does not close windows or force-stop Codex. The App reports
`AwaitingExit` when the helper is ready, shows a deadline, and keeps exit
instructions accessible while waiting. Launch/validation failures are reported
instead of claiming a restart. Since 0.3.4, the existing Windows desktop Explorer
process launches the Node supervisor through its desktop Shell automation object.
This puts the supervisor outside the Codex process tree, which Codex cleans up
when quitting; Node `detached: true` alone does not survive that cleanup. The
supervisor keeps the Windows PowerShell helper alive until relaunch completes.
The launcher must be available and the supervisor must acknowledge readiness;
there is no fallback to an unsafe child-process lifetime. Waiting expires after
15 minutes; an expired attempt needs a new confirmation before the user exits.
This wait is for application exit, not for other conversations to finish.
Cancelling the initial dialog does not start a helper. **Got it** dismisses the
ready-helper instructions while leaving the confirmed plan active until expiry.

From 0.3.15, the confirmation offers **Create Codex + Strata desktop shortcut**.
When checked, the helper copies a small launcher into the profile's Strata data
directory and creates its own desktop shortcut, preserving unrelated shortcuts.
Use that entry for subsequent starts: it resolves the currently installed Store
package, preserves the selected browser profile, and requests a loopback port.
The launcher survives plugin-cache replacement and does not change Windows
startup tasks or the original Codex shortcut. If that profile is already running
without a connection, it asks for a normal File > Exit instead of stopping it.
Deleting the extra shortcut returns to the ordinary launch workflow.

Setup results are tied to the original or verified relaunched process identity.
A later ordinary launch no longer inherits an old relaunch failure. The production
helper's process identity/shortcut result, Store path refresh, quoted profile
arguments, existing-process handling and shortcut ownership have isolated Windows
regressions; these are not an everyday-profile restart acceptance result.

An isolated real Codex profile completed normal application exit and automatic
same-profile relaunch with a reachable endpoint. Its initial disconnected state
was controlled and its exit used the renderer quit message through a test-only
diagnostic endpoint. This is not everyday-profile or manual-menu acceptance.
The Windows regression separately ends a newly spawned fixture requester and
its complete process tree, then verifies the independent helper finishes.
The App also shows the helper's current phase: starting, waiting for application
exit, relaunching, failed or timed out. An active plan is reused across clients;
repeated clicks do not start another helper. A failed or expired attempt needs
a fresh confirmation. Setup status is read from local recovery data on refresh.

For development, `scripts/start.ps1` starts or attaches to the separate
`%LOCALAPPDATA%/Strata/codex-profile` instance on port 9449. The live test refuses
to run against a different profile. The Codex account/plugin home can still be
shared with the everyday instance; this is renderer/profile isolation, not a
separate OS account or an isolated credentials store.

## Browsing and adjusting themes

The theme library has search and All / Built-in / Mine filters. The compact list
scrolls independently of theme details; Preview and Apply stay at the bottom of
the window. In a narrow window, **Switch theme** opens the same searchable list
in a dialog. Escape closes it and returns focus to the switch button.
The embedded App owns its canvas and composer safe area inside a dedicated
container. Host resets on `html`/`body` cannot replace its dark background or
erase the bottom reserve. The reserve updates with the host context.

Press `/` outside a text field to search. Arrow keys, Home and End navigate the
theme list; scene tabs also support arrow keys. A loading theme cannot be applied
with the preceding theme's settings. Changing the desktop profile discards late
responses from the previous profile.

Picture controls and region choices remain in the details pane. **Reset
adjustments** restores that theme variant's defaults. **Save copy** preserves the
chosen variant and current adjustments in a personal copy. Export packages the
saved design; save a copy first if you want to export unsaved adjustments.

**智能平衡 (Smart balance)** is on by default for artwork themes. It samples only
the local theme image, recalculates a reading veil for the current crop and
palette, and moves secondary/link ink toward the primary text color when
necessary. This avoids hiding a whole illustration merely to protect a faint
label. Original image files and stored palette values are unchanged. The scene
preview and desktop use the same calculation; different viewport proportions
can produce different crops and protection. This bounded image sampling is a
readability aid, not a guarantee for every pixel, custom CSS or future host UI.

Art intensity controls the base image contribution. Reading protection controls
the requested quietness; smart balance can raise its effective veil when the
sampled background would otherwise obscure text. The status explains when that
protection takes over. Code, terminal, composer and transient surfaces keep their
existing opaque treatments. OS contrast/transparency preferences take priority.
Turn smart balance off to use the manual material behavior.

Horizontal and vertical focus control which part survives a cover crop; an axis
without cropping will not move the image. The preview explains its current crop.
Both opacity sliders support 1% steps, retaining values such as 62% and 84%.
Smart balance and both focus values travel with preview, apply, saved copies and
exports. Older saved appearances without the flag use smart balance; explicit
`adjustments.adaptiveArtwork: false` retains manual control.

## Codex updates and adaptation checks

When Codex initializes the Strata MCP service, Strata checks the running desktop
and starts its normal appearance maintenance, before the library is opened. A
host that loads plugins lazily performs this on first plugin use, not before
loading the plugin. No separate Windows startup task is installed.

Settings contains **Codex 更新与主题适配** and **检查并修复适配**. The check
records the version of the running verified package, which can differ from a
Store update already installed on disk. A version change appears in Strata and
triggers a fresh check. The controller also observes mounted views during normal
maintenance. Reports distinguish connected, checked, unsupported/unrecognized,
and not-yet-mounted areas; a connected renderer is not proof of readable colors.

Checks cover recognized main/composer structure, owned style integrity, text
selection contrast, composer caret contrast, opaque overlay text contrast, and
known workspace/new-tab backdrops that would hide continuous artwork. Those
layout backdrops become transparent; editors, terminals, controls, document
canvases and independent webviews retain their own reading surfaces.
They read geometry and computed styles only. They do not read conversation text,
editor values or selected text, and do not inspect independent embedded content
or OS dialogs. Unopened settings, panels or menus remain explicitly unverified.

**检查并修复适配** reidentifies the current surfaces and reapplies the effective
appearance with the installed adapter. It preserves selection, committed theme,
adjustments, active preview's before-image, and undo history. It does not apply a
browsed draft, enable the connection, install Codex, or download/execute a guessed
adapter. Unrecognized new host structures require an updated Strata release;
persistent failures remain visible with diagnostic copy and Original recovery.

## Theme lifecycle

Selection and synthetic samples do not apply a theme. Live preview changes the
chosen window. Cancel restores the retained before-image; Apply commits to the
profile, and Undo restores the previous committed appearance once. Original
removes identifiable Strata effects while preserving native appearance choices.
An explicit Cancel can dismiss the current preview from another Strata client.
Browsing or adjusting a different theme does not take over an existing preview.
Automatic live adjustment only updates a matching preview owned by that App.

Closing the App or CLI leaves applied appearance active. Each client cancels
only its own preview when it exits normally. A lost UI heartbeat expires its
preview after about 45 seconds; an unreachable window remains unknown and keeps
its recovery record. An installed companion independently maintains ordinary
same-profile windows. Controlled tests cover new-window and restart behavior;
full native lifecycle acceptance is still pending.
If cancellation loses its acknowledgment, the controller retains a pending
restoration and retries it; heartbeats do not renew that cancelled preview.

Personal themes, references and profile recovery state live under
`%LOCALAPPDATA%/Strata`, outside the installation cache. Copy, folder import and
portable JSON packages preserve local images/CSS/notes, including variant CSS
and CSS-relative images in subdirectories. Imports do not execute
old launchers. Saving or applying does not publish anything. The gallery page
honestly indicates that online discovery is not yet available.

## Shared diagnostic CLI and recovery

From a source checkout or installed package root:

```powershell
node dist/cli.mjs --profile "<verified Codex browser profile>" --json
```

Example commands:

```text
library
select bundled:blue-hour
apply
select bundled:sand
preview
cancel
undo
original
quit
```

Use `targets` and `target <id>` to choose a preview window. `import <folder>`
copies a local pack; `export <key> <new-file>` writes a portable package without
overwriting an existing file. Quote paths containing spaces. `restore` aliases
Original. CLI exit cancels its preview and preserves committed appearance.

If the App is unavailable, use `recover` from this CLI on the correct profile.
Before disabling or uninstalling the plugin, use Original or this recovery
command. To remove the installed package, use `codex plugin remove
strata@strata-local`. Keep personal data if it may be needed later. Native
disable/uninstall/reconnect acceptance remains pending; unknown removal results
must not be treated as a successful recovery.

## Verification

```powershell
npm test
npm run test:live
```

The first command includes the built MCP resource’s executable-JavaScript check,
controlled runtime tests and five Windows helper regressions, including survival
after the requesting process exits and error/acknowledgment behavior. Those
regressions use harmless scripts or an invalid process identity. The second applies/undoes/previews themes only in
the dedicated test profile, exercises two clients and the bundled CLI, and
restores Original. It reads computed appearance and ownership, not chat content.

`tests/adapter-browser.mjs` additionally checks a synthetic Chromium surface
fixture. It requires Playwright, optionally resolved with
`STRATA_PLAYWRIGHT_MODULE`, and uses Edge by default. This fixture does not
establish actual Codex settings, terminal or menu coverage. The historical
`tests/live.mjs` belongs to the earlier two-region experiment and is not the
current live-test command.

After building, `node tests/plugin-browser.mjs` checks the offline App through
AppBridge with real library/controller code and controlled desktop observations.
It uses the same optional Playwright/module and browser-channel settings, creates
only a temporary test library, and verifies actual large-artwork decoding,
sample adjustments, switching and App background restoration. Set
`STRATA_UI_SCREENSHOT` to an output path to retain its synthetic scene screenshot.
This is a browser regression check, not acceptance of the native global entry.
