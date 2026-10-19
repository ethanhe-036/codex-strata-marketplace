---
name: strata-theme
description: Create, refine and manage local full-interface Codex themes through Strata.
---

# Strata theme authoring

Use the installed Strata tools on the desktop host. Start with status; explain
an unavailable desktop connection rather than targeting a remote localhost.
The library, UI and diagnostic CLI use the same operations.

For creation, determine mood, visual signature, functional palette, material
hierarchy, artwork placement and quiet reading areas. Scale direction exploration
to the request; an already chosen style needs no fixed preview count. Plan the
global rail, navigation, conversation, composer, settings, panels, overlays and
Strata itself. Preserve native controls and readable code, diffs and terminals.
Host selectors belong to shared runtime adaptation.

Save personal copies when refining bundled or imported work. Keep drafts and
references local. Use synthetic conversation, composer, settings, work-panel and
menu scenes for sample previews; never collect private conversations. Clearly
label live preview as changing real Codex, and offer cancel, apply, undo and
Original through shared tools.

Artwork requests require actual artwork when image generation is available.
Report a missing generation capability and retain the draft; do not substitute
swatches and claim success. Respect the assets' redistribution conditions.
Saving or applying never authorizes publishing.

## Shared operations

Call `strata_operation` with `action: "status"` first. If there are several
desktops, retain the selected `desktopId` for subsequent calls. A setup-required
result permits library work but does not mean that desktop application succeeded.
The user controls the restart confirmation in Strata Settings. Do not restart or
terminate another Codex instance from a theme-creation task.

- `library` returns portable library keys such as `bundled:paper-atlas`.
- `details` reads the selected key, variant and adjustments. Preserve existing
  art variants, materials, composition/quiet zones and provenance during edits.
  Artwork uses shared smart balance by default (`adjustments.adaptiveArtwork`).
  Preserve an explicit `false` and the user's `artOpacity`, `materialOpacity`,
  `focusX` and `focusY`; do not bake adaptive masks into their source image.
  Both focus axes affect cover crops, only where that axis is actually cropped.
- `copy` saves a personal copy; it does not mutate the upstream theme.
- `save` accepts a theme object and a map of relative resource names to base64
  file contents. For real generated images, prefer a local folder and `import`
  with `paths: [absoluteFolder]`, avoiding huge image strings in a conversation.
- `select` chooses a library key; `preview` changes a selected ordinary window.
  Use `targetId` when status reports more than one window.
- `cancel`, `apply`, `undo`, `original` and `recover` use the same controller.
  A tool call returning `Unknown`, `Degraded` or `operationError` is not success.
- `export` produces a portable JSON package. Export is local sharing preparation;
  it is not permission to upload or publish the result.

The diagnostic fallback is `node <plugin-root>/dist/cli.mjs --profile
"<verified browser profile>"`; its `help` documents commands. An SSH task must
not run a desktop fallback against its own localhost.

## Create an actual theme

1. Read an existing draft if the user came from the creation page. Its brief and
   optional reference resource stay with that draft. An image attached to the
   creation request is design input, not automatically a finished wallpaper.
2. Define functional colors for canvas, reading/raised surfaces, primary/muted
   text, action/focus/border, semantic success/warning/danger/info, code, terminal,
   diff additions/removals and approvals. Use the bundled presets as examples.
   One variant is sufficient when the design calls for one.
3. If the brief calls for artwork, generate it with the available image tool and
   copy the actual file into the theme folder. Use relative `art.file` and
   optional `art.variants` entries. Set `composition.mode` to `continuous` for a
   shared workspace canvas or `regional` for deliberately regional art. Preserve
   focal placement, quiet reading zones and the user’s chosen story/material.
4. Save `theme.json`, needed images, optional `theme.css` and creative notes in a
   local folder. Include `cssFile: "theme.css"` when used. Every needed resource
   must be portable within that folder. Avoid private screenshot content in
   previews; use the library’s synthetic conversation/settings/panel/menu scenes.
5. Import the folder to the personal library, select the returned key, inspect
   warnings and generated samples, then perform the user-authorized preview or
   application. Report actual host observations and any surfaces not verified.
   Missing artwork, unsupported independent guests or an unobserved result must
   not be described as completed full-interface design.

Iterate through the user’s request rather than imposing a fixed number of design
rounds. A subsequent personal copy can retain all prior resources while changing
the requested palette, materials or crop. Keep the source pack and its rights
information intact, particularly for imported personal anime artwork.
