// apps/runtime/companion.mjs
import { createServer } from "node:net";
import { readFile as readFile4, access } from "node:fs/promises";
import { join as join4, resolve as resolve3 } from "node:path";
import { timingSafeEqual } from "node:crypto";

// apps/runtime/controller.mjs
import { join as join2 } from "node:path";
import { randomUUID as randomUUID3 } from "node:crypto";

// apps/runtime/storage.mjs
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw new Error(`Cannot read saved Strata data (${error.code ?? error.name}). The file has been preserved.`);
  }
}
async function writeJson(file, value) {
  await mkdir(dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(value, null, 2) + "\n", { mode: 384 });
  await rename(temporary, file);
}

// apps/runtime/library.mjs
import { readdir, readFile as readFile3, mkdir as mkdir2, writeFile as writeFile2, rename as rename2, stat, rm } from "node:fs/promises";
import { join, dirname as dirname2, basename as basename2, extname as extname2 } from "node:path";
import { randomUUID as randomUUID2 } from "node:crypto";
import { homedir } from "node:os";

// apps/runtime/theme.mjs
import { readFile as readFile2, realpath } from "node:fs/promises";
import { resolve, relative, isAbsolute, extname, sep, posix } from "node:path";
import { createHash } from "node:crypto";

// apps/cli/theme.mjs
import { basename } from "node:path";
function parseTheme(value, source = "Local theme", variant) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("This reader needs a theme object with surfaces and CSS style values.");
  }
  const variants = value.variants;
  const variantName = variant ?? (variants && typeof variants === "object" ? Object.keys(variants)[0] : void 0);
  const content = variantName === void 0 ? value : variants?.[variantName];
  if (!content?.surfaces || typeof content.surfaces !== "object" || Array.isArray(content.surfaces)) {
    throw new Error("No usable surfaces in the selected theme/variant.");
  }
  const surfaces = {};
  for (const [name, definition] of Object.entries(content.surfaces)) {
    if (!definition || typeof definition.selector !== "string" || !definition.selector.trim() || !definition.styles || typeof definition.styles !== "object" || Array.isArray(definition.styles)) {
      throw new Error(`Surface ${name} needs a selector and CSS property/value object.`);
    }
    const styles = {};
    for (const [property, cssValue] of Object.entries(definition.styles)) {
      if (typeof cssValue !== "string" && typeof cssValue !== "number") {
        throw new Error(`The CSS value for ${name}.${property} is not usable.`);
      }
      Object.defineProperty(styles, property, { value: String(cssValue), enumerable: true });
    }
    if (!Object.keys(styles).length) throw new Error(`Surface ${name} has no CSS values.`);
    Object.defineProperty(surfaces, name, { value: { selector: definition.selector, styles }, enumerable: true });
  }
  if (!Object.keys(surfaces).length) throw new Error("The theme has no surfaces to apply.");
  return { id: String(value.id ?? basename(source)), name: String(value.name ?? value.id ?? basename(source)), source, variant: variantName ?? null, surfaces };
}

// apps/runtime/theme.mjs
var regions = ["shell", "rail", "navigation", "main", "conversation", "composer", "panels", "settings", "overlays", "strata"];
var defaultTokens = { canvas: "#eeeae2", surface: "#f9f7f2", surfaceRaised: "#ffffff", text: "#292b2d", muted: "#64676b", accent: "#416c87", accentText: "#ffffff", border: "#a8adb0", focus: "#367594", success: "#316d45", warning: "#856120", danger: "#a23943", info: "#356889", codeSurface: "#edeef0", terminalSurface: "#172129", terminalText: "#e4ebef", diffAddSurface: "#deeddf", diffRemoveSurface: "#f1dddf", approvalSurface: "#efe8d6", radiusSmall: "4px", radiusMedium: "8px", radiusLarge: "12px", shadowLow: "0 2px 8px #15212a12", shadowHigh: "0 12px 32px #15212a28" };
var cssString = (value) => JSON.stringify(String(value));
var slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "personal-theme";
function resourceName(value) {
  const name = String(value).replace(/\\/g, "/");
  if (!name || name.includes("\0") || name.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(name) || name.split("/").some((part) => !part || part === "." || part === "..")) throw new Error("Theme resources must use relative paths inside the theme folder.");
  return name;
}
async function localResource(directory2, name) {
  const root2 = await realpath(directory2);
  const file = await realpath(resolve(root2, resourceName(name)));
  const path = relative(root2, file);
  if (path.startsWith(`..${sep}`) || path === ".." || isAbsolute(path)) throw new Error("A theme resource points outside its theme folder.");
  return file;
}
function parseDesign(value, variant) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("A theme must be a JSON object.");
  const names = value.variants && typeof value.variants === "object" ? Object.keys(value.variants) : [];
  const chosen = variant ?? value.defaultVariant ?? names[0] ?? null;
  if (chosen !== null && !Object.hasOwn(value.variants ?? {}, chosen)) throw new Error("The selected appearance variant is unavailable.");
  const content = chosen === null ? value : { ...value, ...value.variants[chosen], tokens: { ...value.tokens, ...value.variants[chosen]?.tokens }, regions: { ...value.regions, ...value.variants[chosen]?.regions } };
  if (!content.tokens && !content.palette && !content.surfaces) throw new Error("This theme has no usable palette or surface definitions.");
  if (content.surfaces) parseTheme({ ...content, variants: void 0 });
  const tokens = { ...defaultTokens, ...content.palette ?? {}, ...content.tokens ?? {} };
  for (const [key, token2] of Object.entries(tokens)) {
    if (!/^[a-z][a-zA-Z0-9-]*$/.test(key) || typeof token2 !== "string" && typeof token2 !== "number" || /[{};<>]/.test(String(token2))) throw new Error(`Unusable theme token: ${key}`);
    tokens[key] = String(token2);
  }
  return { ...content, id: String(value.id ?? "personal-theme"), name: String(value.name ?? value.metadata?.name ?? value.id ?? "Personal theme"), description: String(value.description ?? value.metadata?.description ?? value.metadata?.summary ?? ""), tokens, variant: chosen, variantNames: names, regions: content.regions ?? {} };
}
function assetReferences(value) {
  const found = /* @__PURE__ */ new Set();
  function walk(entry, key = "") {
    if (!entry || typeof entry !== "object") return;
    for (const [name, item] of Object.entries(entry)) {
      if ((name === "file" || name === "reference" || name === "cssFile") && typeof item === "string") found.add(resourceName(item));
      else if (typeof item === "object") walk(item, name);
    }
  }
  walk(value);
  for (const item of value.previews ?? []) if (typeof item === "string") found.add(resourceName(item));
  return [...found];
}
var imageTypes = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml" };
var cssUrl = /url\(\s*['"]?([^'"\)]+)['"]?\s*\)/gi;
function cssAssetName(raw, cssFile = "") {
  const name = raw.trim().replace(/\\/g, "/");
  if (!name || name.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(name)) throw new Error("CSS images must stay inside the theme folder.");
  return resourceName(posix.join(cssFile ? posix.dirname(resourceName(cssFile)) : ".", name));
}
function cssAssetReferences(css, cssFile) {
  const names = /* @__PURE__ */ new Set();
  for (const [, raw] of String(css ?? "").replace(/@import[^;]+;/gi, "").matchAll(cssUrl)) {
    try {
      const name = cssAssetName(raw, cssFile);
      if (imageTypes[extname(name).toLowerCase()]) names.add(name);
    } catch {
    }
  }
  return [...names];
}
async function resolveDesign(value, directory2, { variant, adjustments = {} } = {}) {
  const theme = parseDesign(value, variant);
  const warnings = [];
  const styles = [{ css: String(theme.extraCss ?? ""), file: "" }];
  if (theme.cssFile) {
    try {
      styles.push({ css: await readFile2(await localResource(directory2, theme.cssFile), "utf8"), file: theme.cssFile });
    } catch {
      warnings.push("The saved custom material CSS is unavailable.");
    }
  }
  const assets = {};
  const references = /* @__PURE__ */ new Set([...assetReferences(theme), ...styles.flatMap(({ css: css2, file }) => cssAssetReferences(css2, file))]);
  for (const name of references) {
    try {
      const file = await localResource(directory2, name);
      const mime = imageTypes[extname(name).toLowerCase()];
      if (mime) assets[name] = `data:${mime};base64,${(await readFile2(file)).toString("base64")}`;
    } catch {
      warnings.push(`Missing local resource: ${name}`);
    }
  }
  let css = styles.map(({ css: css2, file }) => css2.replace(/@import[^;]+;/gi, "").replace(cssUrl, (_, raw) => {
    if (raw.startsWith("data:image/")) return `url(${cssString(raw)})`;
    let name;
    try {
      name = cssAssetName(raw, file);
    } catch {
      warnings.push("An external or invalid CSS resource was omitted.");
      return "none";
    }
    if (!assets[name]) {
      warnings.push(`Unresolved CSS resource: ${name}`);
      return "none";
    }
    return `url(${cssString(assets[name])})`;
  })).join("\n");
  css = css.replace(/html\.codex-theme\[data-codex-theme=['"][^'"]+['"]\]/g, "html[data-strata-theme]").replace(/data-ct-composition/g, "data-strata-composition").replace(/data-ct-part/g, "data-strata-legacy-part");
  const art = theme.art ?? {};
  const composition = { mode: art.file ? "continuous" : "none", focusX: 50, focusY: 50, ...theme.composition };
  const focal = String(art.focalPoint ?? "").match(/([\d.]+)%\s+([\d.]+)%/);
  if (focal && !theme.composition) {
    composition.focusX = Number(focal[1]);
    composition.focusY = Number(focal[2]);
  }
  const artworkFile = art.variants?.[composition.asset]?.file ?? art.file ?? null;
  const options = { adaptiveArtwork: true, artOpacity: typeof composition.workbenchScrim === "number" ? 1 - composition.workbenchScrim / 100 : 0.6, materialOpacity: typeof composition.mainTint === "number" ? composition.mainTint / 100 : 0.84, focusX: composition.focusX, focusY: composition.focusY, ...theme.adjustments, ...adjustments };
  if (typeof options.adaptiveArtwork !== "boolean") throw new Error("Adaptive artwork must be enabled or disabled.");
  for (const key of ["artOpacity", "materialOpacity"]) options[key] = Math.max(0, Math.min(1, Number(options[key])));
  for (const key of ["focusX", "focusY"]) options[key] = Math.max(0, Math.min(100, Number(options[key])));
  if (Object.values(options).some((value2) => typeof value2 === "number" && !Number.isFinite(value2))) throw new Error("Theme adjustments must be finite numbers.");
  const disabled = [...new Set(options.disabledRegions ?? [])];
  if (disabled.some((name) => !regions.includes(name))) throw new Error("Unknown region in theme adjustments.");
  const resolved = { id: theme.id, name: theme.name, variant: theme.variant, tokens: theme.tokens, regions: theme.regions, surfaces: theme.surfaces, materialGrammar: theme.materialGrammar, composition, compositionProfile: theme.compositionProfile, art: { file: artworkFile, data: assets[artworkFile] ?? null, variants: art.variants ?? {} }, extraCss: css, adjustments: { ...options, disabledRegions: disabled }, warnings };
  resolved.fingerprint = createHash("sha256").update(JSON.stringify(resolved)).digest("hex").slice(0, 24);
  return resolved;
}

// apps/runtime/library.mjs
var Library = class {
  constructor({ root: root2, builtin }) {
    this.root = root2;
    this.builtin = builtin;
  }
  async entries() {
    const entries = [];
    for (const [directory2, kind] of [[this.builtin, "bundled"], [this.root, "personal"]]) {
      let files;
      try {
        files = await readdir(directory2, { withFileTypes: true });
      } catch (error) {
        if (error.code === "ENOENT") continue;
        throw error;
      }
      for (const file of files) {
        if (file.name.startsWith(".")) continue;
        const path = file.isDirectory() ? join(directory2, file.name, "theme.json") : file.name.endsWith(".json") ? join(directory2, file.name) : null;
        if (!path) continue;
        const key = `${kind}:${file.name.replace(/\.json$/, "")}`;
        try {
          const value = JSON.parse(await readFile3(path, "utf8"));
          const theme = parseDesign(value);
          entries.push({ key, kind, id: theme.id, name: theme.name, description: theme.description, variants: theme.variantNames, defaultVariant: theme.variant, tokens: theme.tokens, artwork: !!theme.art?.file, draft: !!value.draft, metadata: value.metadata ?? {}, path });
        } catch (error) {
          entries.push({ key, kind, name: file.name, error: error.message, path });
        }
      }
    }
    return entries;
  }
  async entry(key) {
    const entry = (await this.entries()).find((item) => item.key === key);
    if (!entry) throw new Error("The selected theme is no longer in the library.");
    if (entry.error) throw new Error(entry.error);
    return entry;
  }
  async read(key, options) {
    const entry = await this.entry(key);
    const value = JSON.parse(await readFile3(entry.path, "utf8"));
    const resolved = await resolveDesign(value, dirname2(entry.path), options);
    return { entry, value, resolved };
  }
  async list() {
    return (await this.entries()).map(({ path, ...entry }) => entry);
  }
  async save(value, resources = {}, { source, conflict = "copy" } = {}) {
    const parsed = parseDesign(value);
    await mkdir2(this.root, { recursive: true });
    const base = slug(parsed.id);
    const existing = await this.entries();
    const already = existing.find((entry) => entry.kind === "personal" && (source ? entry.metadata?.importSource === source : entry.id === parsed.id));
    if (already && conflict === "keep") return { key: already.key, keptExisting: true };
    const name = existing.some((entry) => entry.key === `personal:${base}`) ? `${base}-${randomUUID2().slice(0, 8)}` : base;
    const temporary = join(this.root, `.${name}-${randomUUID2()}`);
    const destination = join(this.root, name);
    await mkdir2(temporary, { recursive: true });
    try {
      const saved = { ...value, id: name, name: parsed.name, metadata: { ...value.metadata, ...source ? { importSource: source } : {} } };
      const warnings = [];
      for (const [raw, data] of Object.entries(resources)) {
        const name2 = resourceName(raw);
        if (!/\.(png|jpe?g|webp|svg|css|md|json)$/i.test(name2)) throw new Error("Only theme design, image and note resources can be imported.");
        const file = join(temporary, name2);
        if (name2 === "theme.json") continue;
        await mkdir2(dirname2(file), { recursive: true });
        await writeFile2(file, Buffer.from(data, "base64"));
      }
      for (const name2 of assetReferences(saved)) if (!Object.hasOwn(resources, name2)) warnings.push(`Missing local resource: ${name2}`);
      await writeJson(join(temporary, "theme.json"), saved);
      await rename2(temporary, destination);
      return { key: `personal:${name}`, warnings };
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  }
  async copy(key, name, options = {}) {
    const bundle = await this.export(key);
    const { resolved } = await this.read(key, options);
    const value = { ...bundle.theme, name: name ?? `${parseDesign(bundle.theme).name} \xB7 Personal`, draft: true };
    if (resolved.variant !== null) {
      value.defaultVariant = resolved.variant;
      if (options.adjustments) value.variants = { ...value.variants, [resolved.variant]: { ...value.variants[resolved.variant], adjustments: resolved.adjustments } };
    } else if (options.adjustments) value.adjustments = resolved.adjustments;
    return this.save(value, bundle.resources);
  }
  async export(key) {
    const entry = await this.entry(key);
    const theme = JSON.parse(await readFile3(entry.path, "utf8"));
    const resources = {};
    const names = await themeFiles(dirname2(entry.path), theme);
    for (const name of names) resources[name] = (await readFile3(await localResource(dirname2(entry.path), name))).toString("base64");
    return { format: "strata-theme", version: 1, theme, resources };
  }
  async importPath(path, conflict = "keep") {
    const info = await stat(path);
    if (info.isDirectory()) {
      const value2 = JSON.parse(await readFile3(join(path, "theme.json"), "utf8"));
      const resources2 = {};
      for (const name of await themeFiles(path, value2)) resources2[name] = (await readFile3(await localResource(path, name))).toString("base64");
      const cssFile = resources2["theme.css"] ? "theme.css" : value2.cssFile;
      return this.save({ ...value2, ...cssFile ? { cssFile } : {} }, resources2, { source: String(value2.id ?? basename2(path)), conflict });
    }
    const value = JSON.parse(await readFile3(path, "utf8"));
    if (value.format === "strata-theme") return this.save(value.theme, value.resources, { source: value.theme.id, conflict });
    if (basename2(path) === "theme.json") return this.importPath(dirname2(path), conflict);
    const resources = {};
    for (const name of await themeFiles(dirname2(path), value, false)) {
      try {
        resources[name] = (await readFile3(await localResource(dirname2(path), name))).toString("base64");
      } catch {
      }
    }
    return this.save(value, resources, { source: value.id, conflict });
  }
  async legacyCatalog() {
    const directory2 = join(process.env.CODEX_HOME ?? join(homedir(), ".codex"), "skills/customize-codex-theme/assets/presets");
    let folders;
    try {
      folders = await readdir(directory2, { withFileTypes: true });
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
    const found = [];
    for (const folder of folders) if (folder.isDirectory()) {
      const path = join(directory2, folder.name);
      try {
        const theme = parseDesign(JSON.parse(await readFile3(join(path, "theme.json"), "utf8")));
        found.push({ id: theme.id, name: theme.name, path });
      } catch (error) {
        found.push({ id: folder.name, name: folder.name, path, error: error.message });
      }
    }
    return found;
  }
};
async function themeFiles(directory2, value, includeLoose = true) {
  const names = new Set(assetReferences(value));
  for (const design of [value, ...Object.values(value.variants ?? {})]) for (const name of cssAssetReferences(design?.extraCss)) names.add(name);
  if (includeLoose) {
    for (const file of await readdir(directory2, { withFileTypes: true })) if (file.isFile() && /\.(png|jpe?g|webp|svg|css|md)$/i.test(file.name)) names.add(file.name);
  }
  for (const name of [...names]) if (extname2(name).toLowerCase() === ".css") {
    try {
      const css = await readFile3(await localResource(directory2, name), "utf8");
      for (const image of cssAssetReferences(css, name)) names.add(image);
    } catch {
    }
  }
  const usable = [];
  for (const name of names) {
    try {
      await localResource(directory2, name);
      usable.push(name);
    } catch {
    }
  }
  return usable;
}

// apps/runtime/controller.mjs
var brief = (appearance) => appearance ? { id: appearance.id, name: appearance.name, variant: appearance.variant, fingerprint: appearance.fingerprint, adjustments: appearance.adjustments, warnings: appearance.warnings } : null;
var publicObservation = (observation) => {
  if (!observation) return null;
  const { appearance, ...rest } = observation;
  return { ...rest, appearance: brief(appearance) };
};
var Controller = class {
  constructor({ directory: directory2, builtin, libraryRoot, host: host2, adapter, refreshHost }) {
    this.controllerId = randomUUID3();
    this.directory = directory2;
    this.host = host2;
    this.adapter = adapter;
    this.refreshHost = refreshHost;
    this.library = new Library({ root: libraryRoot, builtin });
    this.file = join2(directory2, "state.json");
    this.queue = Promise.resolve();
    this.state = { version: 1, revision: 0, selected: null, committed: null, undo: null, undoAvailable: false, preview: null, autoRestore: true, activeSession: false, hostStarted: host2.started, targets: {}, compatibility: {}, lastError: null };
  }
  async initialize() {
    this.state = { ...this.state, ...await readJson(this.file, {}) };
    if (this.state.preview) {
      this.state.preview.expires = 0;
      this.state.lastError = "The preview owner disconnected. Its retained pre-preview appearance will be restored when the window is reachable.";
    }
    await this.tick();
  }
  persist() {
    return writeJson(this.file, this.state);
  }
  request(input) {
    const operation = this.queue.then(() => this.handle(input));
    this.queue = operation.catch(() => {
    });
    return operation;
  }
  async connectedTargets() {
    if (this.refreshHost) this.host = await this.refreshHost(this.host);
    this.adapter.host = this.host;
    const targets = await this.adapter.targets();
    const restarted = this.state.hostStarted !== this.host.started;
    if (restarted) {
      this.state.preview = null;
      this.state.targets = {};
      this.state.hostStarted = this.host.started;
      this.state.activeSession = this.state.autoRestore && !!this.state.committed;
    }
    return { targets, restarted };
  }
  async observe(target) {
    const retained = this.state.targets[target.id] ??= { lastObserved: null, unknown: false };
    try {
      const observation = await this.adapter.command(target, this.host.id, "status");
      if (!Object.hasOwn(retained, "intended")) retained.intended = observation.appearance ?? null;
      retained.lastObserved = observation;
      retained.unknown = false;
      retained.error = observation.errors?.join("; ") || null;
      return observation;
    } catch (error) {
      retained.unknown = true;
      retained.error = error.message;
      return null;
    }
  }
  async render(target, appearance, preview = false) {
    const retained = this.state.targets[target.id] ??= { intended: null, lastObserved: null, unknown: false };
    retained.intended = appearance;
    retained.unknown = true;
    retained.error = null;
    await this.persist();
    try {
      const observed = await this.adapter.command(target, this.host.id, "render", { theme: appearance, preview });
      retained.lastObserved = observed;
      retained.unknown = false;
      retained.error = observed.errors?.join("; ") || null;
      return observed;
    } catch (error) {
      retained.error = error.message;
      return null;
    }
  }
  async refresh({ reconcile = false } = {}) {
    let found;
    try {
      found = await this.connectedTargets();
    } catch (error) {
      this.connectionError = error.message;
      for (const record of Object.values(this.state.targets)) record.unknown = true;
      return [];
    }
    this.connectionError = null;
    const ids = new Set(found.targets.map((target) => target.id));
    for (const id of Object.keys(this.state.targets)) if (!ids.has(id)) delete this.state.targets[id];
    for (const target of found.targets) {
      const known = !!this.state.targets[target.id];
      const observed = await this.observe(target);
      if (!reconcile || !observed) continue;
      const previewing = this.state.preview?.targetId === target.id;
      if (previewing && (this.state.preview.cancelling || this.state.preview.expires <= Date.now())) continue;
      const desired = previewing ? this.state.preview.appearance : this.state.committed?.appearance ?? null;
      const follow = previewing || this.state.activeSession;
      if (follow && desired && (observed.appearance?.fingerprint !== desired.fingerprint || !observed.intact)) await this.render(target, desired, previewing);
      if (known && !desired && observed.appearance) await this.render(target, null);
    }
    this.rememberCompatibility();
    return found.targets;
  }
  rememberCompatibility() {
    const previous = this.state.compatibility ?? {};
    const version = this.host.version ?? null;
    const changed = !!version && !!previous.codexVersion && version !== previous.codexVersion;
    const reports = Object.values(this.state.targets).map((record) => record.unknown ? null : record.lastObserved?.compatibility);
    const signature = JSON.stringify([version, reports]);
    if (signature !== this.compatibilitySignature) {
      this.state.compatibility = { ...previous, codexVersion: version ?? previous.codexVersion ?? null, previousVersion: changed ? previous.codexVersion : previous.previousVersion ?? null, versionChanged: changed || !!previous.versionChanged, checkedAt: (/* @__PURE__ */ new Date()).toISOString() };
      this.compatibilitySignature = signature;
    }
  }
  compatibilitySnapshot() {
    const records = Object.values(this.state.targets);
    const reports = records.filter((record) => !record.unknown).map((record) => record.lastObserved?.compatibility).filter(Boolean);
    const unique = (values) => [...new Map(values.map((value) => [JSON.stringify(value), value])).values()];
    const issues = unique(reports.flatMap((report) => report.issues ?? []));
    const unavailable = !!this.connectionError || !this.host.endpoint || records.some((record) => record.unknown);
    const verified = !!this.host.version && records.length > 0 && reports.length === records.length;
    return { ...this.state.compatibility, codexVersion: this.host.version ?? null, state: unavailable ? "unavailable" : issues.length ? "needs-attention" : verified ? "compatible" : "unverified", adapterVersion: reports[0]?.adapterVersion ?? null, issues, checks: unique(reports.flatMap((report) => report.checks ?? [])), unverifiedRegions: [...new Set(reports.flatMap((report) => report.unverifiedRegions ?? []))] };
  }
  async tick() {
    return this.request({ action: "maintenance" });
  }
  async snapshot({ includeLibrary = false } = {}) {
    if (!this.connectionError) this.rememberCompatibility();
    const targets = Object.entries(this.state.targets).map(([id, record]) => ({ id, unknown: record.unknown, error: record.error ?? (!record.unknown && Object.hasOwn(record, "intended") && record.intended?.fingerprint !== record.lastObserved?.appearance?.fingerprint ? "The observed appearance does not match the requested result." : null), intended: brief(record.intended), current: record.unknown ? null : publicObservation(record.lastObserved), lastObserved: publicObservation(record.lastObserved) }));
    const errors = [...new Set([this.connectionError, this.state.preview?.cancelling ? "Preview cancellation remains unconfirmed. Restoration will be retried when the window is reachable." : null, ...targets.map((target) => target.error), ...targets.flatMap((target) => target.current?.errors ?? [])].filter(Boolean))];
    const compatibility = this.compatibilitySnapshot();
    const health = this.connectionError || targets.some((target) => target.unknown) ? "Unknown" : errors.length || compatibility.issues.length || targets.some((target) => target.current && !target.current.intact) ? "Degraded" : "Healthy";
    const active = targets.some((target) => target.current?.appearance);
    return { controllerId: this.controllerId, revision: this.state.revision, profileId: this.host.id, compatibility, connection: { state: this.connectionError ? "unavailable" : this.host.endpoint ? "connected" : "setup-required", setupRequired: !this.host.endpoint, message: this.connectionError ?? null }, health, status: health !== "Healthy" ? health : this.state.preview ? "Preview" : active ? "Active" : "Original", selected: this.state.selected, committed: this.state.committed ? { key: this.state.committed.key, ...brief(this.state.committed.appearance) } : null, preview: this.state.preview ? { targetId: this.state.preview.targetId, clientId: this.state.preview.clientId, key: this.state.preview.key, cancelling: !!this.state.preview.cancelling, ...brief(this.state.preview.appearance), expires: this.state.preview.expires } : null, undoAvailable: this.state.undoAvailable, autoRestore: this.state.autoRestore, targets, errors, lastOperationError: this.state.lastError, regions, ...includeLibrary ? { library: await this.library.list() } : {} };
  }
  async handle(input = {}) {
    const { action = "status" } = input;
    this.state.revision++;
    try {
      if (action === "library") return { ...await this.snapshot({ includeLibrary: true }), ...input.desktops ? { desktops: input.desktops } : {} };
      if (action === "details") {
        const { entry, value, resolved } = await this.library.read(input.key ?? this.state.selected?.key, input);
        const { path, ...publicEntry } = entry;
        return { controllerId: this.controllerId, revision: this.state.revision, entry: publicEntry, theme: value, appearance: { ...brief(resolved), tokens: resolved.tokens, materialGrammar: resolved.materialGrammar, composition: resolved.composition, compositionProfile: resolved.compositionProfile, artwork: resolved.art.data, extraCss: resolved.extraCss }, previewKind: "synthetic sample; not a live Codex preview" };
      }
      if (action === "ui-theme") {
        const records = input.targetId ? [this.state.targets[input.targetId]].filter(Boolean) : Object.values(this.state.targets);
        const observed = records.filter((record) => !record.unknown && record.lastObserved?.intact);
        const unanimous = records.length && records.length === observed.length && observed.every((record) => record.lastObserved.appearance?.fingerprint === observed[0].lastObserved.appearance?.fingerprint);
        const active = unanimous ? observed[0].lastObserved.appearance : null;
        return { controllerId: this.controllerId, revision: this.state.revision, appearance: active && !active.adjustments.disabledRegions.includes("strata") ? { tokens: active.tokens, artwork: active.art.data, adjustments: active.adjustments, materialGrammar: active.materialGrammar } : null };
      }
      if (action === "select") {
        const { resolved } = await this.library.read(input.key, input);
        this.state.selected = { key: input.key, variant: resolved.variant, adjustments: resolved.adjustments };
        await this.persist();
        return this.snapshot();
      }
      if (action === "copy") {
        const saved = await this.library.copy(input.key, input.name, { variant: input.variant, adjustments: input.adjustments });
        return { ...await this.snapshot({ includeLibrary: true }), saved };
      }
      if (action === "save") {
        const saved = await this.library.save(input.theme, input.resources ?? {});
        return { ...await this.snapshot({ includeLibrary: true }), saved };
      }
      if (action === "legacy") return { controllerId: this.controllerId, revision: this.state.revision, themes: await this.library.legacyCatalog() };
      if (action === "import") {
        const imported = [];
        if (input.paths) for (const path of input.paths) {
          try {
            imported.push({ source: path, ...await this.library.importPath(path, input.conflict ?? "keep") });
          } catch (error) {
            imported.push({ source: path, error: error.message });
          }
        }
        else if (input.package?.format === "strata-theme") imported.push(await this.library.save(input.package.theme, input.package.resources ?? {}, { source: input.package.theme.id, conflict: input.conflict ?? "keep" }));
        else imported.push(await this.library.save(input.theme, input.resources ?? {}, { source: input.theme?.id, conflict: input.conflict ?? "keep" }));
        return { ...await this.snapshot({ includeLibrary: true }), imported };
      }
      if (action === "export") return { controllerId: this.controllerId, revision: this.state.revision, package: await this.library.export(input.key) };
      if (action === "preferences") {
        if (typeof input.autoRestore !== "boolean") throw new Error("Choose whether to restore committed themes after Codex restarts.");
        this.state.autoRestore = input.autoRestore;
        await this.persist();
        return this.snapshot();
      }
      if (action === "heartbeat") {
        if (this.state.preview && this.state.preview.clientId === input.clientId && !this.state.preview.cancelling && this.state.preview.expires > Date.now()) this.state.preview.expires = Date.now() + 45e3;
        return this.snapshot();
      }
      if (action === "maintenance") {
        const before = this.recoveryState();
        if (this.state.preview && (this.state.preview.cancelling || this.state.preview.expires <= Date.now())) await this.cancelPreview();
        await this.refresh({ reconcile: true });
        if (this.recoveryState() !== before) await this.persist();
        return this.snapshot();
      }
      if (action === "cancel") {
        await this.cancelPreview(input.clientId, input.ownedOnly);
        await this.persist();
        return this.snapshot();
      }
      if (action === "original" || action === "recover") {
        this.state.preview = null;
        this.state.committed = null;
        this.state.undo = null;
        this.state.undoAvailable = false;
        this.state.activeSession = false;
        await this.persist();
      }
      if (action === "repair-compatibility" && this.state.preview && (this.state.preview.cancelling || this.state.preview.expires <= Date.now())) await this.cancelPreview();
      const targets = await this.refresh();
      if (["status", "reconnect"].includes(action)) return this.snapshot({ includeLibrary: action === "reconnect" });
      if (!targets.length) throw new Error(this.connectionError ?? "No ordinary Codex window is available.");
      if (action === "repair-compatibility") {
        if (this.state.preview?.cancelling) throw new Error("Finish restoring the previous preview before repairing adaptation.");
        for (const target of targets) {
          const record = this.state.targets[target.id];
          if (record.unknown) throw new Error("Reconnect the unreachable window before repairing adaptation.");
          const preview = this.state.preview?.targetId === target.id;
          const appearance = preview ? this.state.preview.appearance : this.state.activeSession ? this.state.committed?.appearance ?? null : record.lastObserved?.appearance ?? null;
          await this.render(target, appearance, preview);
        }
        this.rememberCompatibility();
        if (this.compatibilitySnapshot().state === "compatible") this.state.compatibility.versionChanged = false;
        this.state.compatibility.checkedAt = this.state.compatibility.repairedAt = (/* @__PURE__ */ new Date()).toISOString();
      } else if (action === "original" || action === "recover") {
        for (const target of targets) await this.render(target, null);
      } else if (action === "undo") {
        if (!this.state.undoAvailable) throw new Error("There is no recent application to undo.");
        this.state.committed = this.state.undo;
        this.state.undo = null;
        this.state.undoAvailable = false;
        this.state.preview = null;
        this.state.activeSession = !!this.state.committed;
        for (const target of targets) await this.render(target, this.state.committed?.appearance ?? null);
      } else if (["preview", "apply", "adjust"].includes(action)) {
        const selection = input.key ? { key: input.key, variant: input.variant, adjustments: input.adjustments } : this.state.selected;
        if (!selection) throw new Error("Select a theme in the library first.");
        const { resolved } = await this.library.read(selection.key, { variant: input.variant ?? selection.variant, adjustments: { ...selection.adjustments, ...input.adjustments } });
        this.state.selected = { key: selection.key, variant: resolved.variant, adjustments: resolved.adjustments };
        const live = action === "preview" || action === "adjust" && input.preview !== false;
        if (live) {
          const target = input.targetId ? targets.find((target2) => target2.id === input.targetId) : targets.length === 1 ? targets[0] : null;
          if (!target) throw new Error("Choose the Codex window for this temporary preview.");
          if (this.state.preview && this.state.preview.targetId !== target.id) {
            await this.cancelPreview();
            if (this.state.preview) throw new Error("Restore the previous preview window before previewing another window; its recovery state has been retained.");
          }
          if (this.state.targets[target.id]?.unknown) throw new Error("Cannot start a preview until this window\u2019s current appearance can be observed.");
          const before = this.state.preview ? this.state.preview.before : this.state.targets[target.id]?.lastObserved?.appearance ?? null;
          this.state.preview = { targetId: target.id, key: selection.key, appearance: resolved, before, clientId: input.clientId ?? "diagnostic", expires: Date.now() + 45e3 };
          await this.render(target, resolved, true);
        } else {
          if (this.state.committed?.appearance.fingerprint !== resolved.fingerprint) {
            this.state.undo = this.state.committed;
            this.state.undoAvailable = true;
          }
          this.state.committed = { key: selection.key, appearance: resolved };
          this.state.preview = null;
          this.state.activeSession = true;
          for (const target of targets) await this.render(target, resolved);
        }
      } else throw new Error(`Unknown Strata operation: ${action}`);
      const snapshot = await this.snapshot();
      this.state.lastError = snapshot.errors.join("; ") || null;
      await this.persist();
      return this.snapshot();
    } catch (error) {
      this.state.lastError = error.message;
      await this.persist();
      return { ...await this.snapshot(), operationError: error.message };
    }
  }
  recoveryState() {
    return JSON.stringify({ hostStarted: this.state.hostStarted, compatibility: this.state.compatibility, activeSession: this.state.activeSession, preview: this.state.preview ? [this.state.preview.targetId, this.state.preview.appearance.fingerprint, this.state.preview.cancelling] : null, targets: Object.entries(this.state.targets).map(([id, record]) => [id, record.intended?.fingerprint, record.lastObserved?.appearance?.fingerprint, record.unknown, record.error]) });
  }
  async cancelPreview(clientId, ownedOnly = false) {
    const preview = this.state.preview;
    if (!preview || ownedOnly && preview.clientId !== clientId) return;
    preview.cancelling = true;
    preview.expires = 0;
    await this.persist();
    const targets = await this.refresh();
    if (this.state.preview !== preview) return;
    const target = targets.find((target2) => target2.id === preview.targetId);
    if (!target) {
      if (!this.connectionError) this.state.preview = null;
      else this.state.lastError = "Cannot confirm preview cancellation while its desktop window is unreachable.";
      return;
    }
    const restored = (observed2) => observed2?.intact && !observed2.errors?.length && !observed2.preview && observed2.appearance?.fingerprint === preview.before?.fingerprint;
    const retained = this.state.targets[target.id];
    const observed = !retained.unknown && restored(retained.lastObserved) ? retained.lastObserved : await this.render(target, preview.before, false);
    if (restored(observed)) {
      retained.intended = preview.before;
      this.state.preview = null;
      this.state.lastError = null;
    } else this.state.lastError = "Preview cancellation remains unconfirmed. Reconnect or use Original to retry removal.";
  }
};

// apps/cli/cdp.mjs
var CdpSession = class {
  constructor(url, timeout = 5e3) {
    this.socket = new WebSocket(url);
    this.timeout = timeout;
    this.nextId = 0;
    this.pending = /* @__PURE__ */ new Map();
    this.socket.addEventListener("message", ({ data }) => {
      const message = JSON.parse(String(data));
      const entry = this.pending.get(message.id);
      if (!entry) return;
      this.pending.delete(message.id);
      clearTimeout(entry.timer);
      if (message.error) entry.reject(new Error(message.error.message));
      else entry.resolve(message.result);
    });
    const disconnected = () => {
      for (const entry of this.pending.values()) {
        clearTimeout(entry.timer);
        entry.reject(new Error("Codex debugging connection closed"));
      }
      this.pending.clear();
    };
    this.socket.addEventListener("close", disconnected);
    this.socket.addEventListener("error", disconnected);
  }
  async open() {
    await new Promise((resolve4, reject) => {
      const timer2 = setTimeout(() => {
        this.socket.close();
        reject(new Error("Timed out connecting to Codex"));
      }, this.timeout);
      this.socket.addEventListener("open", () => {
        clearTimeout(timer2);
        resolve4();
      }, { once: true });
      this.socket.addEventListener("error", () => {
        clearTimeout(timer2);
        reject(new Error("Could not connect to Codex debugging socket"));
      }, { once: true });
    });
    return this;
  }
  send(method, params = {}) {
    if (this.socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("Codex debugging connection is not open"));
    }
    return new Promise((resolve4, reject) => {
      const id = ++this.nextId;
      const timer2 = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timed out during ${method}; the host outcome may be unknown`));
      }, this.timeout);
      this.pending.set(id, { resolve: resolve4, reject, timer: timer2 });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    }
    return result.result?.value;
  }
  close() {
    this.socket.close();
  }
};
async function listTargets(endpoint, timeout = 5e3) {
  const response = await fetch(new URL("/json/list", endpoint), { signal: AbortSignal.timeout(timeout) });
  if (!response.ok) throw new Error(`Codex target discovery returned HTTP ${response.status}`);
  return (await response.json()).filter((target) => target.type === "page" && target.webSocketDebuggerUrl);
}

// apps/runtime/presentation.mjs
function entryPresentationCommand(owner, origin, focused, leaseMs = 15e3) {
  const key = "__strata_entry_" + owner + "_" + origin;
  const previous = globalThis[key];
  const unsupported = (reason) => ({ available: false, focused: false, reason });
  if (!/^[a-f0-9]+$/.test(owner) || !/^codex-sandbox:\/\/mcp-app-[a-f0-9]+\.web-sandbox\.oaiusercontent\.com$/.test(origin)) return unsupported("This view is not a local Codex MCP App.");
  if (location.pathname !== "/index.html" || !document.querySelector("[data-app-navigation-rail], aside.app-shell-left-panel")) return unsupported("This is not an ordinary Codex window.");
  if (!focused) {
    const available = previous?.origin === origin;
    if (available) previous.dispose();
    return { available, focused: false };
  }
  let state = globalThis[key];
  const visible = (node) => !!node?.isConnected && node.checkVisibility() && node.getBoundingClientRect().width > 0;
  const sameBox = (a, b) => ["x", "y", "width", "height"].every((part) => Math.abs(a[part] - b[part]) < 2);
  const owns = (node) => node?.getAttribute("src")?.split("?")[0]?.replace(/\/$/, "") === origin;
  if (!state) {
    const attributes = /* @__PURE__ */ new Map();
    const style = document.createElement("style");
    style.id = "strata-entry-" + owner;
    state = { origin, binding: null, timer: null, style, available: false };
    const mark = (node, value) => {
      if (!node) return;
      if (!attributes.has(node)) attributes.set(node, node.getAttribute("data-strata-entry"));
      if (node.getAttribute("data-strata-entry") !== value) node.setAttribute("data-strata-entry", value);
    };
    const unmark = () => {
      for (const [node, before] of attributes) {
        if (!node.getAttribute("data-strata-entry")?.startsWith(owner + ":")) continue;
        if (before === null) node.removeAttribute("data-strata-entry");
        else node.setAttribute("data-strata-entry", before);
      }
      attributes.clear();
      if (style.textContent) style.textContent = "";
      state.binding = null;
      state.available = false;
    };
    const frameFor = () => {
      const frames = [...document.querySelectorAll("[data-mcp-app-frame]")].filter(visible);
      if (frames.length !== 1) return null;
      const webview = frames[0].querySelector("webview");
      return owns(webview) ? { frame: frames[0], webview } : null;
    };
    const bind = (pair) => {
      const anchors = [...document.querySelectorAll('[data-mcp-app-inline-surface="standalone"]')].filter((node) => visible(node) && sameBox(node.getBoundingClientRect(), pair.frame.getBoundingClientRect()));
      if (anchors.length !== 1) return null;
      const anchor = anchors[0], surface = anchor.closest("[data-mcp-extension-surface]"), main = anchor.closest("[data-app-shell-main-surface]");
      const page = main?.closest("[data-app-shell-active-page]");
      const title = surface?.querySelector("[data-mcp-extension-header]");
      const toolbar = page?.querySelector("[data-app-shell-titlebar]");
      if (!surface || !visible(main) || !title || !toolbar || main.querySelector("[data-app-shell-workspace-layout]")?.getAttribute("data-app-shell-workspace-layout") !== "full") return null;
      const overlays = /* @__PURE__ */ new Set();
      for (const chat of document.querySelectorAll('[class~="group/quick-chat-frame"]')) {
        if (!visible(chat)) continue;
        let node = chat.parentElement;
        while (node && node !== document.body && getComputedStyle(node).position !== "fixed") node = node.parentElement;
        if (node && node !== document.body && sameBox(node.getBoundingClientRect(), main.getBoundingClientRect())) overlays.add(node);
      }
      if (overlays.size !== 1) return null;
      return { ...pair, anchor, surface, main, title, toolbar, overlay: [...overlays][0] };
    };
    const update = () => {
      const pair = frameFor();
      let binding = state.binding;
      if (!pair || !binding || pair.frame !== binding.frame || pair.webview !== binding.webview || !visible(binding.anchor) || !visible(binding.main) || !binding.surface.contains(binding.anchor) || !binding.main.contains(binding.surface) || !binding.surface.contains(binding.title) || !binding.toolbar.isConnected || !binding.overlay.isConnected || binding.main.querySelector("[data-app-shell-workspace-layout]")?.getAttribute("data-app-shell-workspace-layout") !== "full") {
        unmark();
        binding = pair ? bind(pair) : null;
      }
      if (!binding) return;
      state.binding = binding;
      mark(binding.frame, owner + ":frame");
      for (const node of [binding.title, binding.toolbar, binding.overlay]) mark(node, owner + ":hidden");
      const box = binding.main.getBoundingClientRect();
      const css = '[data-strata-entry="' + owner + ':hidden"]{display:none!important}[data-strata-entry="' + owner + ':frame"]{position:fixed!important;left:' + box.x + "px!important;top:" + box.y + "px!important;width:" + box.width + "px!important;height:" + box.height + "px!important;z-index:42!important}";
      if (style.textContent !== css) style.textContent = css;
      state.available = sameBox(binding.frame.getBoundingClientRect(), box) && [binding.title, binding.toolbar, binding.overlay].every((node) => getComputedStyle(node).display === "none");
      if (!state.available) unmark();
    };
    let pending = false;
    const schedule = () => {
      if (pending) return;
      pending = true;
      queueMicrotask(() => {
        pending = false;
        if (globalThis[key] === state) update();
      });
    };
    const observer = new MutationObserver(schedule);
    state.dispose = () => {
      clearTimeout(state.timer);
      observer.disconnect();
      removeEventListener("resize", schedule);
      unmark();
      style.remove();
      if (globalThis[key] === state) delete globalThis[key];
    };
    state.update = update;
    globalThis[key] = state;
    document.head.append(style);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "style", "hidden", "src", "data-app-shell-workspace-layout"] });
    addEventListener("resize", schedule);
  }
  clearTimeout(state.timer);
  state.timer = setTimeout(state.dispose, leaseMs);
  state.update();
  return state.available ? { available: true, focused: true } : unsupported("The standalone Strata page layout could not be matched.");
}
function entryPresentationScript(owner, origin, focused) {
  return "(" + entryPresentationCommand.toString() + ")(" + [owner, origin, focused].map((value) => JSON.stringify(value)).join(",") + ")";
}

// apps/runtime/artwork.mjs
function createArtworkCompositor(onReady = () => {
}) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  let source, image, loaded = false, failed = false, sampleKey, bounds;
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const mix = (front, back, opacity) => front.map((value, i) => value * opacity + back[i] * (1 - opacity));
  const luminance = (rgb) => rgb.map((value) => {
    value /= 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
  function color(value) {
    canvas.width = canvas.height = 1;
    context.fillStyle = "#000";
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
  }
  function sample(width, height, x, y, base) {
    const key = [width, height, x, y, ...base].join(",");
    if (sampleKey === key) return bounds;
    canvas.width = 128;
    canvas.height = Math.max(16, Math.min(128, Math.round(128 * height / width)));
    context.fillStyle = `rgb(${base.join(" ")})`;
    context.fillRect(0, 0, canvas.width, canvas.height);
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const cropWidth = width / scale, cropHeight = height / scale;
    const cropX = (image.naturalWidth - cropWidth) * x / 100, cropY = (image.naturalHeight - cropHeight) * y / 100;
    context.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const low = [255, 255, 255], high = [0, 0, 0];
    for (let i = 0; i < pixels.length; i += 4) for (let channel = 0; channel < 3; channel++) {
      low[channel] = Math.min(low[channel], pixels[i + channel]);
      high[channel] = Math.max(high[channel], pixels[i + channel]);
    }
    bounds = [low.map((v) => clamp(v - 12, 0, 255)), high.map((v) => clamp(v + 12, 0, 255))];
    sampleKey = key;
    return bounds;
  }
  return {
    compose(theme, width, height) {
      const a = theme.adjustments, t = theme.tokens;
      const data = theme.art?.data ?? theme.artwork;
      const enabled = a.adaptiveArtwork !== false && !!data && theme.composition?.mode !== "none";
      if (source !== data) {
        source = data;
        image = null;
        loaded = failed = false;
        sampleKey = null;
        if (data && enabled) {
          const pending = image = new Image();
          pending.onload = () => {
            if (image !== pending) return;
            loaded = true;
            sampleKey = null;
            onReady();
          };
          pending.onerror = () => {
            if (image !== pending) return;
            failed = true;
            onReady();
          };
          pending.src = data;
        }
      } else if (enabled && !image) {
        source = void 0;
        return this.compose(theme, width, height);
      }
      const legacyTint = (name) => clamp(((theme.composition?.[name + "Tint"] ?? a.materialOpacity * 100) + (theme.composition?.mainTint == null ? 0 : a.materialOpacity * 100 - theme.composition.mainTint)) / 100);
      const fallback = { adaptive: false, artOpacity: a.artOpacity, materialOpacity: data ? a.materialOpacity : 1, sidebarOpacity: data ? legacyTint("sidebar") : 1, panelOpacity: data ? legacyTint("rightPanel") : 1, status: "manual" };
      if (!enabled) return fallback;
      const base = color(t.canvas), surface = color(t.surface), ink = color(t.text);
      let range = [[0, 0, 0], [255, 255, 255]];
      if (loaded && !failed) {
        try {
          range = sample(Math.max(1, width), Math.max(1, height), a.focusX, a.focusY, base);
        } catch {
          failed = true;
        }
      }
      const backdrops = range.map((rgb) => mix(rgb, base, a.artOpacity));
      function readable(opacity, foreground = ink) {
        const levels = backdrops.map((rgb) => luminance(mix(surface, rgb, opacity)));
        const low2 = Math.min(...levels), high2 = Math.max(...levels);
        const level = luminance(foreground);
        return level > high2 ? (level + 0.05) / (high2 + 0.05) >= 4.7 : level < low2 && (low2 + 0.05) / (level + 0.05) >= 4.7;
      }
      const paletteReadable = readable(1);
      let low = 0, high = 1;
      if (paletteReadable) for (let i = 0; i < 14; i++) {
        const mid = (low + high) / 2;
        if (readable(mid)) high = mid;
        else low = mid;
      }
      const protect = (requested) => paletteReadable ? Math.max(requested ** 2, high) : 1;
      const materialOpacity = protect(a.materialOpacity), sidebarOpacity = protect(legacyTint("sidebar")), panelOpacity = protect(legacyTint("rightPanel"));
      const leastProtected = Math.min(materialOpacity, sidebarOpacity, panelOpacity);
      function balanceInk(value) {
        const original = color(value);
        if (!paletteReadable || readable(leastProtected, original)) return value;
        let low2 = 0, high2 = 1;
        for (let i = 0; i < 14; i++) {
          const mid = (low2 + high2) / 2;
          if (readable(leastProtected, mix(ink, original, mid))) high2 = mid;
          else low2 = mid;
        }
        return `rgb(${mix(ink, original, high2).map((v) => v.toFixed(3)).join(" ")})`;
      }
      return { adaptive: true, artOpacity: a.artOpacity, materialOpacity, sidebarOpacity, panelOpacity, secondaryText: balanceInk(t.muted), linkText: balanceInk(t.accent), contrastLimited: high > a.materialOpacity ** 2 + 0.01, status: !paletteReadable ? "palette-limited" : failed ? "unavailable" : loaded ? "ready" : "loading", cropX: loaded && image.naturalWidth / image.naturalHeight > width / height + 5e-3, cropY: loaded && image.naturalWidth / image.naturalHeight < width / height - 5e-3 };
    },
    dispose() {
      if (image) image.onload = image.onerror = null;
      image = null;
      source = void 0;
    }
  };
}

// apps/runtime/adapter.mjs
function desktopThemeCommand(owner, operation, payload = {}, createCompositor) {
  const adapterVersion = 7;
  const key = `__strata_profile_${owner}`;
  let state = globalThis[key];
  const errors = [];
  const root2 = document.documentElement;
  const groups = {
    shell: "[data-app-shell-titlebar], body > #root > main > header",
    rail: "[data-app-navigation-rail]",
    navigation: "aside.app-shell-left-panel nav:not([data-app-navigation-rail]), aside.app-shell-left-panel [role=navigation]",
    main: "main[class*=MainContentSurface], main.main-surface, [data-app-shell-main-surface]",
    conversation: "[data-app-action-timeline-scroll], [data-thread-scroll-container], [data-message-id], [data-testid=conversation]",
    composer: ".composer-surface-chrome, [data-composer-surface], [data-composer-surface-variant]",
    panels: "[data-workspace-panel], [data-app-shell-work-panel], [data-panel-slot], [role=complementary], .xterm, [data-app-shell-tabs]",
    settings: "main:has([data-settings-panel-slug]), [data-settings-content], [data-settings-root]",
    overlays: "[role=menu], [role=listbox], [role=dialog], [role=tooltip], [role=presentation][class~=bg-surface-elevated-secondary], [data-radix-popper-content-wrapper] > *, .codex-toast-area > *"
  };
  const ordinary = !!document.querySelector("aside.app-shell-left-panel, [data-app-navigation-rail]") && location.pathname === "/index.html";
  if (!ordinary) return { ordinary: false, documentId: null, regions: [], errors: ["This renderer is an independent guest or auxiliary window."] };
  function attribute(element, name, value) {
    if (!state.attributes.has(element)) state.attributes.set(element, /* @__PURE__ */ new Map());
    const record = state.attributes.get(element);
    if (!record.has(name)) record.set(name, { before: element.getAttribute(name), owned: value });
    else record.get(name).owned = value;
    if (element.getAttribute(name) !== value) element.setAttribute(name, value);
  }
  function restoreAttributes(element, attributes) {
    for (const [name, record] of attributes) {
      if (element.getAttribute(name) !== record.owned) continue;
      if (record.before === null) element.removeAttribute(name);
      else element.setAttribute(name, record.before);
    }
  }
  function nativePaint() {
    const computed = getComputedStyle(root2);
    state.native = Object.fromEntries([...computed].filter((name) => name.startsWith("--color-")).map((name) => [name, computed.getPropertyValue(name)]));
    state.nativeScheme = computed.colorScheme;
    state.nativeCaret = computed.caretColor;
  }
  function label() {
    const parts = /* @__PURE__ */ new Map();
    const add = (element, part) => {
      if (!element) return;
      if (!parts.has(element)) parts.set(element, /* @__PURE__ */ new Set());
      parts.get(element).add(part);
    };
    for (const [part, selector] of Object.entries(groups)) {
      try {
        for (const element of document.querySelectorAll(selector)) add(element, part);
      } catch (error) {
        errors.push(`${part}: ${error.message}`);
      }
    }
    for (const editor of document.querySelectorAll("[data-codex-composer]")) add(editor.closest(".composer-surface-chrome, [data-composer-surface], [data-composer-surface-variant], form") ?? editor.parentElement?.parentElement, "composer");
    for (const content of document.querySelectorAll('[class~="group/settings"]')) add(content.closest('[class~="electron:bg-surface"]') ?? content, "settings");
    const outer = document.querySelector("aside.app-shell-left-panel")?.closest("[data-app-shell-frame], main");
    if (outer) attribute(outer, "data-strata-canvas", owner);
    attribute(document.body, "data-strata-canvas", owner);
    for (const [element, names] of parts) {
      const enabled = [...names].filter((name) => !state.theme.adjustments.disabledRegions.includes(name));
      attribute(element, "data-strata-part", enabled.join(" "));
      attribute(element, "data-strata-disabled", enabled.length ? "" : [...names].join(" "));
      const legacy = new Set(enabled);
      if (enabled.includes("rail") || enabled.includes("navigation")) legacy.add("sidebar");
      if (enabled.includes("panels")) legacy.add("right-panel");
      if (element.matches(".xterm")) legacy.add("terminal");
      attribute(element, "data-strata-legacy-part", [...legacy].join(" "));
    }
    const backdrops = /* @__PURE__ */ new Map();
    for (const element of document.querySelectorAll('[data-app-shell-tabs] > [class~="bg-[var(--app-shell-panel-background,var(--color-surface))]"], [data-app-shell-pane-frame], [data-new-tab-scroll-root]')) {
      const region = element.closest("[data-app-shell-tabs], [data-app-shell-focus-area=right-panel]") ? "panels" : "main";
      const value = state.theme.adjustments.disabledRegions.includes(region) ? "" : region;
      backdrops.set(element, region);
      attribute(element, "data-strata-backdrop", value);
    }
    for (const [element, attributes] of state.attributes) {
      if (!element.isConnected) {
        restoreAttributes(element, attributes);
        state.attributes.delete(element);
      } else if (attributes.has("data-strata-part") && !parts.has(element)) {
        attribute(element, "data-strata-part", "");
        attribute(element, "data-strata-disabled", "");
        attribute(element, "data-strata-legacy-part", "");
      }
      if (element.isConnected && attributes.has("data-strata-backdrop") && !backdrops.has(element)) attribute(element, "data-strata-backdrop", "");
    }
    state.parts = parts;
    state.backdrops = backdrops;
  }
  const colorContext = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  function rgba(color) {
    colorContext.clearRect(0, 0, 1, 1);
    colorContext.fillStyle = "#000";
    colorContext.fillStyle = color;
    colorContext.fillRect(0, 0, 1, 1);
    return [...colorContext.getImageData(0, 0, 1, 1).data];
  }
  function luminance(color) {
    const rgb = rgba(color).slice(0, 3).map((value) => {
      value /= 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  }
  function contrast(a, b) {
    const x = luminance(a), y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  function readableText(background, ...choices) {
    return choices.find((color) => contrast(color, background) >= 4.5) ?? (contrast("#fff", background) > contrast("#111", background) ? "#fff" : "#111");
  }
  function interactionPalette() {
    const t = state.theme.tokens;
    let selection = `color-mix(in srgb, ${t.accent} 25%, ${t.surface})`;
    if (contrast(t.text, selection) < 4.5) selection = contrast(t.text, "#fff") > contrast(t.text, "#111") ? "#fff" : "#111";
    return { selection, scheme: luminance(t.surface) < 0.179 ? "dark" : "light", link: readableText(t.surface, t.accent, t.focus, t.text) };
  }
  function hostValue(name) {
    const t = state.paintTokens ?? state.theme.tokens;
    const role = name.replace(/^--color-/, "");
    if (/^(?:codex-terminal-ansi-|media-|artifact-)/.test(role)) return null;
    const special = {
      "background-text-selection": state.palette.selection,
      "codex-editor-cursor": t.text,
      "codex-description": t.muted,
      "codex-application-menu": t.surfaceRaised,
      "codex-application-menu-selection": `color-mix(in srgb, ${t.accent} 18%, ${t.surfaceRaised})`,
      "codex-terminal-selection": `color-mix(in srgb, ${t.terminalText} 22%, ${t.terminalSurface})`,
      "codex-terminal-selection-inactive": `color-mix(in srgb, ${t.terminalText} 14%, ${t.terminalSurface})`,
      "codex-radio-inactive": t.border,
      "codex-drop-overlay": t.surfaceRaised,
      "codex-drop-prompt": t.surfaceRaised
    };
    if (Object.hasOwn(special, role)) return special[role];
    if (/terminal.*background/.test(name)) return t.terminalSurface;
    if (/terminal.*foreground/.test(name)) return t.terminalText;
    if (/syntax/.test(name)) {
      if (/comment/.test(name)) return t.muted;
      if (/string|insert/.test(name)) return t.success;
      if (/error|delete/.test(name)) return t.danger;
      if (/keyword|function|type|constant|number/.test(name)) return t.accent;
      return t.text;
    }
    if (/diff.*(add|insert)/.test(name)) return /text/.test(name) ? t.success : t.diffAddSurface;
    if (/diff.*(remove|delete)/.test(name)) return /text/.test(name) ? t.danger : t.diffRemoveSurface;
    if (/diff.*(surface|bg)/.test(name)) return t.codeSurface;
    if (/approval/.test(name) && /background|surface/.test(name)) return t.approvalSurface;
    const semantic = /(?:^|-)(?:danger|error)(?:-|$)/.test(role) ? "danger" : /(?:^|-)success(?:-|$)/.test(role) ? "success" : /(?:^|-)(?:caution|warning)(?:-|$)/.test(role) ? "warning" : /(?:^|-)info(?:-|$)/.test(role) ? "info" : null;
    if (/^(?:text|foreground|token-text)(?:-|$)/.test(role)) {
      if (semantic && /-solid(?:-|$)/.test(role)) return readableText(t[semantic], t.accentText, t.text);
      if (/danger|error/.test(name)) return t.danger;
      if (/success/.test(name)) return t.success;
      if (/caution|warning/.test(name)) return t.warning;
      if (/(?:^|-)on-|inverse|primary-solid/.test(role)) return readableText(t.accent, t.accentText, t.text);
      if (/info/.test(name)) return t.info;
      if (/link|accent/.test(name)) return state.palette.link;
      return /secondary|tertiary|placeholder|disabled|execution-output-label/.test(name) ? t.muted : t.text;
    }
    if (/border|separator|ring/.test(name)) return /focus|ring/.test(name) ? t.focus : t.border;
    if (/^(?:background|surface|token-(?:bg|main-surface|input-bg|interactive-bg))(?:-|$)/.test(role)) {
      if (semantic) return /-solid(?:-|$)/.test(role) ? t[semantic] : `color-mix(in srgb, ${t[semantic]} 14%, ${t.surface})`;
      if (/primary-solid|button-primary|accent/.test(name)) return t.accent;
      if (/active|selected/.test(name)) return `color-mix(in srgb, ${t.accent} 18%, ${t.surface})`;
      if (/hover|focus/.test(name)) return `color-mix(in srgb, ${t.accent} 10%, ${t.surface})`;
      if (/ghost|outline/.test(name)) return "transparent";
      if (/code|execution|file-canvas/.test(name)) return t.codeSurface;
      if (/elevated|raised|composer|input/.test(name)) return t.surfaceRaised;
      if (/secondary|tertiary|under/.test(name)) return t.canvas;
      return t.surface;
    }
    return null;
  }
  function paint() {
    const theme = state.theme, a = theme.adjustments;
    const paintErrors = /* @__PURE__ */ Object.create(null);
    if (Object.keys(groups).every((name) => a.disabledRegions.includes(name))) {
      state.css = "";
      state.style.textContent = "";
      state.rules = [];
      state.paintErrors = paintErrors;
      return;
    }
    const regional = theme.art.data && theme.composition.mode === "regional";
    const artBox = regional ? document.querySelector(groups.main)?.getBoundingClientRect() : null;
    const treatment = state.artwork.compose(theme, artBox?.width || innerWidth, artBox?.height || innerHeight);
    state.artworkTreatment = treatment;
    state.palette = interactionPalette();
    if (treatment.linkText) state.palette.link = treatment.linkText;
    const t = state.paintTokens = { ...theme.tokens, muted: treatment.secondaryText ?? theme.tokens.muted };
    const scope = `html[data-strata-profile="${owner}"]`;
    const part = `${scope} :where([data-strata-part]:not([data-strata-part=""]))`;
    const accessiblePart = `${scope}[data-strata-theme][data-strata-composition] [data-strata-part]:not([data-strata-part=""])`;
    const scopedPart = `:scope :where([data-strata-part]:not([data-strata-part=""]))`;
    const variables = Object.entries(t).map(([name, value]) => `--strata-${name.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}:${value};--ct-${name.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}:${value};`).join("");
    const tokens = Object.keys(state.native).map((name) => {
      const value = hostValue(name);
      return value === null ? "" : `${name}:${value}!important;`;
    }).join("");
    const resets = Object.entries(state.native).map(([name, value]) => `${name}:${value}!important;`).join("");
    const q = (value) => JSON.stringify(value);
    const continuous = theme.art.data && theme.composition.mode === "continuous";
    const art = theme.art.data ? `url(${q(theme.art.data)})` : "none";
    const artLayers = `linear-gradient(color-mix(in srgb, ${t.canvas} ${(1 - treatment.artOpacity) * 100}%,transparent),color-mix(in srgb, ${t.canvas} ${(1 - treatment.artOpacity) * 100}%,transparent)),${art}`;
    const canvasArt = continuous ? artLayers : "none";
    const material = `color-mix(in srgb, ${t.surface} ${continuous || regional ? treatment.materialOpacity * 100 : 100}%, transparent)`;
    const important = treatment.adaptive ? "!important" : "";
    const css = [
      `${scope}{${variables}--ct-sidebar-tint:${treatment.sidebarOpacity * 100}%${important};--ct-main-tint:${treatment.materialOpacity * 100}%${important};--ct-right-panel-tint:${treatment.panelOpacity * 100}%${important};}`,
      `${scope} body[data-strata-canvas]{${tokens}color:${t.text}!important;color-scheme:${state.palette.scheme};caret-color:${t.text};background-color:${t.canvas}!important;background-image:${canvasArt}!important;background-size:cover!important;background-position:${a.focusX}% ${a.focusY}%!important;background-attachment:fixed!important;}`,
      `${scope} [data-strata-canvas]:not(body){background:transparent!important;}`,
      `${part}{${tokens}color:${t.text}!important;color-scheme:${state.palette.scheme};caret-color:${t.text};border-color:${t.border}!important;accent-color:${t.accent};}`,
      `${scope} :where([data-strata-part~=main],[data-strata-part~=navigation],[data-strata-part~=panels],[data-strata-part~=settings]){background-color:${material}!important;}`,
      treatment.adaptive && continuous ? `${scope} [data-strata-part~=navigation]{background-color:color-mix(in srgb,${t.surface} ${treatment.sidebarOpacity * 100}%,transparent)!important;}${scope} [data-strata-part~=panels]{background-color:color-mix(in srgb,${t.surface} ${treatment.panelOpacity * 100}%,transparent)!important;}` : "",
      `${scope} [data-strata-part~=rail]{background-color:color-mix(in srgb,${t.accent} 9%,${t.canvas})!important;border-color:${t.border}!important;}`,
      `${scope} :where([data-strata-part~=shell],[data-strata-part~=composer],[data-strata-part~=overlays]){background-color:${t.surfaceRaised}!important;}`,
      `${scope} [data-strata-part~=composer]{box-shadow:${t.shadowLow}!important;border-color:${t.border}!important;}`,
      `${scope} [data-strata-part~=overlays]{box-shadow:${t.shadowHigh}!important;}`,
      `@scope (${scope}) to ([data-strata-disabled]:not([data-strata-disabled=""])){`,
      `${scopedPart} :where(button,[role=button],input,select,textarea){color:inherit;}`,
      `${scopedPart} :where(button,[role=button],input,select,textarea):focus-visible{outline:2px solid ${t.focus}!important;outline-offset:2px;}`,
      `${scopedPart} :where(button,[role=button])[aria-pressed=true],${scopedPart} [data-selected=true]{background-color:color-mix(in srgb,${t.accent} 18%,${t.surface})!important;}`,
      `${scopedPart} :where(a){color:${state.palette.link};}`,
      `${scopedPart} :where([text-link-href],[rich-link-display-text][rich-link-href])::selection{color:${t.text};}`,
      `${scopedPart} :where(pre){background-color:${t.codeSurface}!important;}`,
      `${scopedPart} :where(.xterm){background-color:${t.terminalSurface}!important;color:${t.terminalText}!important;}`,
      `}`,
      `${scope} :where([data-strata-disabled]:not([data-strata-disabled=""])){${resets}color:var(--color-text-primary)!important;color-scheme:${state.nativeScheme};caret-color:${state.nativeCaret};}`,
      continuous ? `@scope (${scope}) to ([data-strata-disabled]:not([data-strata-disabled=""])){:scope [data-strata-part~=main] :where([class~=bg-token-main-surface-primary],[class~="electron:bg-surface"],.scrollbar-stable,[data-app-action-timeline-scroll]){background-color:transparent!important;}}` : "",
      continuous ? `@scope (${scope}) to ([data-strata-disabled]:not([data-strata-disabled=""])){:scope [data-strata-backdrop]:not([data-strata-backdrop=""]){background-color:transparent!important;}}` : "",
      theme.materialGrammar?.canvas?.includes("paper") || theme.materialGrammar?.canvas?.includes("parchment") ? `${scope} [data-strata-part~=navigation]{background-image:repeating-linear-gradient(0deg,transparent,transparent 3px,color-mix(in srgb,${t.text} 3%,transparent) 4px)!important;}` : "",
      regional ? `${scope} [data-strata-part~=main]{${treatment.adaptive ? `background-color:${t.canvas}!important;` : ""}background-image:linear-gradient(${material},${material}),${treatment.adaptive ? artLayers : art}!important;background-size:cover!important;background-position:${a.focusX}% ${a.focusY}%!important;}` : "",
      theme.extraCss ? `@scope (${scope}) to ([data-strata-disabled]:not([data-strata-disabled=""])){${theme.extraCss.replace(/html(?=\[data-strata-theme\])/g, ":scope")}}` : "",
      !treatment.adaptive ? `@media(max-width:900px){${scope} body[data-strata-canvas]{background-position:${a.focusX}% ${a.focusY}%!important;} ${scope} :where([data-strata-part~=main],[data-strata-part~=settings]){background-color:color-mix(in srgb,${t.surface} ${Math.max(a.materialOpacity, 0.9) * 100}%,transparent)!important;}}` : "",
      !treatment.adaptive ? `@media(max-width:620px){${scope} :where([data-strata-part~=main],[data-strata-part~=settings],[data-strata-part~=navigation]){background-color:color-mix(in srgb,${t.surface} 96%,transparent)!important;}}` : "",
      `@media(prefers-reduced-transparency:reduce),(prefers-contrast:more){${scope}{--ct-sidebar-tint:100%!important;--ct-main-tint:100%!important;--ct-right-panel-tint:100%!important;}${accessiblePart}{background-color:${t.surface}!important;background-image:none!important;box-shadow:none!important;}}`,
      `@media(forced-colors:active){${scope} body[data-strata-canvas],${accessiblePart}{color:CanvasText!important;background:Canvas!important;border-color:CanvasText!important;box-shadow:none!important;}}`
    ];
    for (const [name, surface] of Object.entries(theme.surfaces ?? {})) {
      if (a.disabledRegions.includes(name === "sidebar" ? "navigation" : name)) continue;
      try {
        const declaration = document.createElement("span").style;
        for (const [property, value] of Object.entries(surface.styles)) {
          declaration.setProperty(property, String(value), "important");
          if (!declaration.getPropertyValue(property)) throw new Error(`Unusable CSS property: ${property}`);
        }
        css.push(`${scope} :is(${surface.selector}){${declaration.cssText}}`);
      } catch (error) {
        paintErrors[name] = `${name}: ${error.message}`;
      }
    }
    state.css = css.join("\n");
    state.style.textContent = state.css;
    if (state.style.sheet) state.rules = [...state.style.sheet.cssRules].map((rule) => rule.cssText);
    state.paintErrors = paintErrors;
  }
  function remove() {
    if (!state) return;
    state.observer?.disconnect();
    clearTimeout(state.timer);
    state.artwork?.dispose();
    removeEventListener("resize", state.resize);
    try {
      state.style?.remove();
      for (const [element, attributes] of state.attributes) restoreAttributes(element, attributes);
      if (state.style?.isConnected) throw new Error("The owned style remains attached.");
      delete globalThis[key];
      state = null;
    } catch (error) {
      errors.push(`Removal: ${error.message}`);
    }
  }
  if (operation === "original") remove();
  if (operation === "render") {
    if (!payload.theme) remove();
    else {
      remove();
      if (!errors.length) {
        state = globalThis[key] = { adapterVersion, documentId: crypto.randomUUID(), theme: payload.theme, preview: !!payload.preview, attributes: /* @__PURE__ */ new Map(), style: document.createElement("style"), parts: /* @__PURE__ */ new Map() };
        state.artwork = createCompositor(() => {
          if (globalThis[key] === state) paint();
        });
        state.resize = () => {
          clearTimeout(state.timer);
          state.timer = setTimeout(() => {
            if (globalThis[key] === state) paint();
          }, 80);
        };
        addEventListener("resize", state.resize);
        state.style.dataset.strataOwner = owner;
        attribute(root2, "data-strata-profile", owner);
        attribute(root2, "data-strata-theme", payload.theme.id);
        attribute(root2, "data-strata-composition", payload.theme.composition.mode);
        nativePaint();
        label();
        paint();
        document.head.append(state.style);
        state.rules = [...state.style.sheet.cssRules].map((rule) => rule.cssText);
        state.observer = new MutationObserver((records) => {
          if (records.every((record) => record.target === state?.style || record.type === "attributes" && record.attributeName.startsWith("data-strata"))) return;
          clearTimeout(state.timer);
          state.timer = setTimeout(() => {
            if (!state) return;
            nativePaint();
            label();
            paint();
          }, 50);
        });
        state.observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "role", "data-selected", "data-settings-panel-slug", "data-app-shell-tabs"] });
      }
    }
  }
  if (state) label();
  errors.push(...Object.values(state?.paintErrors ?? {}));
  const styleIntact = state?.adapterVersion === adapterVersion && !!state?.style.isConnected && state.style.textContent === state.css && !!state.style.sheet && !state.style.sheet.disabled && state.style.sheet.cssRules.length === state.rules?.length && [...state.style.sheet.cssRules].every((rule, index) => rule.cssText === state.rules[index]);
  const result = Object.keys(groups).map((name) => {
    const elements = state ? [...state.parts].filter(([, parts]) => parts.has(name)).map(([element]) => element) : [...document.querySelectorAll(groups[name])];
    const enabled = state && !state.theme.adjustments.disabledRegions.includes(name);
    const paintError = state?.paintErrors?.[name] ?? (["rail", "navigation"].includes(name) ? state?.paintErrors?.sidebar : null);
    return { name, treatment: !elements.length ? "not-mounted" : !enabled ? "native" : styleIntact && !paintError ? "customized" : "unknown", matched: elements.length, computed: elements.slice(0, 3).map((element) => ({ background: getComputedStyle(element).backgroundColor, color: getComputedStyle(element).color, visible: element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0 })) };
  });
  const checks = [], issues = [];
  const check = (id, region, passed, ratio) => {
    const entry = { id, region, passed, ...ratio == null ? {} : { ratio: Math.round(ratio * 100) / 100 } };
    checks.push(entry);
    if (!passed) issues.push(entry);
  };
  check("main-surface", "main", result.some((region) => region.name === "main" && region.matched > 0));
  if (state) {
    check("owned-style", "shell", styleIntact && errors.length === 0);
    const enabled = (region) => !state.theme.adjustments.disabledRegions.includes(region);
    if (state.theme.art.data && state.theme.composition.mode === "continuous") {
      for (const [element, region] of state.backdrops ?? []) {
        if (!enabled(region) || element.closest('[data-strata-disabled]:not([data-strata-disabled=""])') || !element.getBoundingClientRect().width) continue;
        check("artwork-backdrop", region, rgba(getComputedStyle(element).backgroundColor)[3] === 0);
      }
    }
    const editors = [...document.querySelectorAll("[data-codex-composer]")].slice(0, 3);
    if (enabled("composer")) for (const editor of editors) check("composer-surface", "composer", !!editor.closest("[data-strata-part~=composer]"));
    const samples = [...new Set([...state.parts.keys()].filter((e) => e.getAttribute("data-strata-part") && e.getBoundingClientRect().width > 0))].slice(0, 24);
    for (const element of samples) {
      const region = element.getAttribute("data-strata-part").split(" ")[0];
      const selection = getComputedStyle(element, "::selection");
      if (rgba(selection.backgroundColor)[3] === 255) {
        const ratio = contrast(selection.color, selection.backgroundColor);
        check("selection-contrast", region, rgba(selection.color)[3] > 0 && ratio >= 4.5, ratio);
      } else check("selection-pair", region, false);
      if (region === "overlays") {
        const css = getComputedStyle(element);
        if (rgba(css.backgroundColor)[3] === 255) {
          const ratio = contrast(css.color, css.backgroundColor);
          check("overlay-contrast", region, ratio >= 4.5, ratio);
        }
      }
    }
    if (enabled("composer")) for (const editor of editors) {
      if (editor.classList.contains("ProseMirror-hideselection")) continue;
      const surface = editor.closest("[data-strata-part~=composer]");
      if (!surface) continue;
      const ratio = contrast(getComputedStyle(editor).caretColor, getComputedStyle(surface).backgroundColor);
      check("caret-contrast", "composer", ratio >= 3, ratio);
    }
  }
  const compatibility = { adapterVersion, checks, issues, unverifiedRegions: result.filter((region) => !region.matched).map((region) => region.name) };
  return { ordinary: true, visibility: document.visibilityState, documentId: state?.documentId ?? null, appearance: state?.theme ?? null, preview: !!state?.preview, intact: state ? styleIntact : true, artworkTreatment: state?.artworkTreatment, regions: result, compatibility, boundaries: { embeddedContent: document.querySelectorAll("iframe,webview").length ? "independent/unverified" : "not-mounted", osDialogs: "unsupported", strata: "coordinated-by-app" }, errors };
}
function desktopThemeScript(owner, operation, payload = {}) {
  return `(${desktopThemeCommand.toString()})(${JSON.stringify(owner)},${JSON.stringify(operation)},${JSON.stringify(payload)},(${createArtworkCompositor.toString()}))`;
}
var DesktopAdapter = class {
  constructor(host2) {
    this.host = host2;
  }
  async targets() {
    if (!this.host.endpoint) throw new Error("Desktop connection is not enabled for this Codex launch. Use Enable connection in Strata, or exit normally and open Codex + Strata.");
    const targets = await listTargets(this.host.endpoint);
    const ordinary = [];
    for (const target of targets.filter((target2) => target2.url.startsWith("app://") && new URL(target2.url).pathname === "/index.html")) {
      let session;
      try {
        session = await new CdpSession(target.webSocketDebuggerUrl).open();
        const observation = await session.evaluate(`({ordinary:!!document.querySelector("aside.app-shell-left-panel, [data-app-navigation-rail]"),visible:document.visibilityState==="visible"})`);
        if (observation.ordinary) ordinary.push({ id: target.id, visible: observation.visible, socket: target.webSocketDebuggerUrl });
        else if (!new URL(target.url).searchParams.has("initialRoute")) ordinary.push({ id: target.id, socket: target.webSocketDebuggerUrl });
      } catch {
        ordinary.push({ id: target.id, socket: target.webSocketDebuggerUrl });
      } finally {
        session?.close();
      }
    }
    if (!ordinary.length) throw new Error("No ordinary Codex window is ready in the chosen profile. Reconnect after the main window opens.");
    return ordinary;
  }
  async command(target, owner, operation, payload = {}) {
    const session = await new CdpSession(target.socket).open();
    try {
      return await session.evaluate(desktopThemeScript(owner, operation, payload));
    } finally {
      session.close();
    }
  }
  async presentEntry(origin, focused) {
    const sessions = [];
    try {
      for (const target of await this.targets()) {
        const session = await new CdpSession(target.socket).open();
        sessions.push(session);
      }
      if (!focused) {
        const results = await Promise.all(sessions.map((session) => session.evaluate(entryPresentationScript(this.host.id, origin, false))));
        return { available: results.some((result) => result.available), focused: false };
      }
      const matches = [];
      for (const session of sessions) if (await session.evaluate(
        "([...document.querySelectorAll('[data-mcp-app-frame] webview')].some(node => node.checkVisibility() && node.getBoundingClientRect().width > 0 && node.getAttribute('src')?.split('?')[0]?.replace(/\\/$/, '') === " + JSON.stringify(origin) + "))"
      )) matches.push(session);
      if (matches.length !== 1) return { available: false, focused: false };
      return await matches[0].evaluate(entryPresentationScript(this.host.id, origin, true));
    } finally {
      for (const session of sessions) session.close();
    }
  }
};

// apps/runtime/desktop.mjs
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash as createHash2 } from "node:crypto";
import { resolve as resolve2, join as join3 } from "node:path";
var run = promisify(execFile);
var profileId = (profile) => createHash2("sha256").update(resolve2(profile).toLowerCase()).digest("hex").slice(0, 20);
var dataRoot = () => {
  if (!process.env.LOCALAPPDATA) throw new Error("Strata requires a local Windows desktop connection. Remote localhost is not the desktop.");
  return join3(process.env.LOCALAPPDATA, "Strata");
};
async function discoverDesktop(pluginRoot2, caller = process.pid) {
  if (process.platform !== "win32" || process.env.SSH_CONNECTION || process.env.SSH_TTY) {
    throw new Error("No verified Windows desktop connection in this coding context. Open Strata on the desktop to perform this operation.");
  }
  const { stdout } = await run("powershell.exe", ["-NoProfile", "-NonInteractive", "-File", join3(pluginRoot2, "scripts/discover-desktop.ps1"), "-CallerProcessId", String(caller)], { windowsHide: true, timeout: 1e4, maxBuffer: 1024 * 1024 });
  return JSON.parse(stdout.replace(/^\uFEFF/, ""));
}
function chooseDesktop(hosts, { profile, endpoint } = {}) {
  let candidates = hosts;
  if (profile) candidates = candidates.filter((host3) => profileId(host3.profile) === profileId(profile));
  else if (endpoint) {
    const url = new URL(endpoint);
    if (url.protocol !== "http:" || url.hostname !== "127.0.0.1" || !url.port || url.username || url.password) throw new Error("Only a verified local desktop endpoint is supported.");
    candidates = candidates.filter((host3) => host3.port === Number(url.port));
  } else {
    const ancestor = hosts.filter((host3) => host3.ancestor);
    if (ancestor.length) candidates = ancestor;
  }
  if (candidates.length !== 1) throw new Error(candidates.length ? "Several Codex profiles are running. Choose a desktop profile in Strata or use --profile for diagnostics." : "The chosen Codex desktop profile is not running. Start Codex and reconnect.");
  const host2 = candidates[0];
  return { ...host2, id: profileId(host2.profile), endpoint: host2.port ? `http://127.0.0.1:${host2.port}` : null };
}

// apps/runtime/client.mjs
var runtimeVersion = "0.3.1";
var pipeName = (id) => ["", "", ".", "pipe", "strata-" + id].join(String.fromCharCode(92));

// apps/runtime/companion.mjs
var pluginRoot = resolve3(process.cwd());
var root = dataRoot();
var host = chooseDesktop(await discoverDesktop(pluginRoot), { profile: process.env.STRATA_PROFILE });
if (host.id !== process.argv[2]) throw new Error("The desktop profile identity changed before controller startup.");
var directory = join4(root, "profiles", host.id);
var token = await readFile4(join4(directory, "ipc-key"), "utf8");
var retiring = false;
var timer;
var retiredMessage = "Codex restarted. This Strata controller is closing; reconnect to start the installed runtime.";
var controller = new Controller({ directory, libraryRoot: join4(root, "library"), builtin: join4(pluginRoot, "themes/builtin"), host, adapter: new DesktopAdapter(host), refreshHost: async (current) => {
  if (retiring) throw new Error(retiredMessage);
  const next = chooseDesktop(await discoverDesktop(pluginRoot), { profile: current.profile });
  if (next.pid !== host.pid || next.started !== host.started) {
    retire();
    throw new Error(retiredMessage);
  }
  return next;
} });
function retire() {
  if (retiring) return;
  retiring = true;
  clearInterval(timer);
  controller.queue.then(() => server.close());
}
var server = createServer((socket) => {
  let buffer = "";
  socket.setEncoding("utf8");
  socket.setTimeout(35e3, () => socket.destroy());
  socket.on("error", () => {
  });
  socket.on("data", async (data) => {
    buffer += data;
    if (buffer.length > 150 * 1024 * 1024) {
      socket.destroy();
      return;
    }
    const end = buffer.indexOf("\n");
    if (end < 0) return;
    socket.pause();
    try {
      const message = JSON.parse(buffer.slice(0, end));
      const supplied = Buffer.from(String(message.token ?? ""));
      const expected = Buffer.from(token);
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new Error("Local controller authentication failed.");
      if (message.version !== runtimeVersion) throw new Error("Strata was updated while its controller was running. Close Codex and reopen it to finish the local runtime update; your library is preserved.");
      await ready;
      if (retiring) throw new Error(retiredMessage);
      const result = await controller.request(message.request);
      socket.end(JSON.stringify({ result }) + "\n");
    } catch (error) {
      socket.end(JSON.stringify({ error: error.message }) + "\n");
    }
  });
});
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") process.exit(0);
  else process.exit(1);
});
await new Promise((resolve4) => server.listen(pipeName(host.id), resolve4));
var ready = controller.initialize();
await ready;
var ticking = false;
var lastConnected = Date.now();
timer = setInterval(async () => {
  if (ticking || retiring) return;
  ticking = true;
  try {
    try {
      await access(join4(pluginRoot, "dist/companion.mjs"));
    } catch (error) {
      if (error.code === "ENOENT") {
        retire();
        return;
      }
    }
    const status = await controller.tick();
    if (status.connection.state === "connected") lastConnected = Date.now();
    if (Date.now() - lastConnected > 5 * 60 * 1e3) retire();
  } catch {
  } finally {
    ticking = false;
  }
}, 3e3);
if (retiring) clearInterval(timer);
