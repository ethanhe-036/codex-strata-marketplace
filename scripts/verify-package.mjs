import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { resolve, join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(process.argv[2] ?? '.');
// This is the public payload contract, including the only redistributable artwork.
const allowed = new Set([
  '.codex-plugin/plugin.json', '.agents/plugins/marketplace.json', '.mcp.json',
  'README.md', 'LICENSE', 'package.json', 'SHA256SUMS.json', 'docs/RUNNING.md',
  'dist/server.mjs', 'dist/companion.mjs', 'dist/setup-helper.mjs', 'dist/cli.mjs',
  'dist/index.html', 'dist/THIRD_PARTY_NOTICES.md',
  'scripts/run-plugin.cmd', 'scripts/discover-desktop.ps1', 'scripts/setup-desktop.ps1',
  'scripts/launch-setup.ps1', 'scripts/start-connected.ps1', 'scripts/verify-package.mjs',
  'skills/strata-theme/SKILL.md', 'assets/strata-icon.svg', 'assets/strata-logo.svg',
  'themes/builtin/blue-hour.json', 'themes/builtin/sand.json',
  'themes/builtin/paper-atlas/theme.json', 'themes/builtin/paper-atlas/landscape.png',
  'themes/builtin/paper-atlas/ARTWORK.md',
]);
const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (directory === root && entry.name === '.git') continue;
    const file = join(directory, entry.name);
    assert.ok(!entry.isSymbolicLink(), 'Package must not contain symlinks: ' + entry.name);
    if (entry.isDirectory()) await walk(file);
    else {
      assert.ok(entry.isFile(), 'Unexpected package entry: ' + entry.name);
      files.push(relative(root, file).split(sep).join('/'));
    }
  }
}
await walk(root);
assert.deepEqual(files.sort(), [...allowed].sort(), 'Missing or unapproved public files');
const json = async file => JSON.parse(await readFile(join(root, file), 'utf8'));
const hashes = await json('SHA256SUMS.json');
assert.deepEqual(Object.keys(hashes).sort(), files.filter(file => file !== 'SHA256SUMS.json'));
for (const [file, hash] of Object.entries(hashes)) {
  assert.equal(createHash('sha256').update(await readFile(join(root, file))).digest('hex'), hash, 'Checksum mismatch: ' + file);
}
const manifest = await json('.codex-plugin/plugin.json');
assert.equal(manifest.name, 'strata');
assert.equal((await json('package.json')).version, manifest.version);
assert.ok(manifest.interface.shortDescription.length <= 30, 'Subtitle exceeds 30 characters');
for (const field of ['composerIcon', 'logo']) {
  const file = manifest.interface[field];
  assert.ok(file.startsWith('./') && allowed.has(file.slice(2)), 'Missing contained icon: ' + field);
  const svg = await readFile(join(root, file), 'utf8');
  const width = Number(svg.match(/\bwidth="([0-9.]+)"/)?.[1]);
  const height = Number(svg.match(/\bheight="([0-9.]+)"/)?.[1]);
  const box = svg.match(/viewBox="([0-9. ]+)"/)?.[1].split(' ').map(Number);
  assert.ok((width >= 48 && width === height) || (box?.[2] >= 48 && box[2] === box[3]), 'Icon must be square and at least 48 by 48: ' + file);
  assert.ok(Buffer.byteLength(svg) <= 5 * 1024 * 1024);
}
assert.equal(manifest.skills, './skills');
assert.equal(manifest.mcpServers, './.mcp.json');
const marketplace = await json('.agents/plugins/marketplace.json');
assert.equal(marketplace.plugins.length, 1);
const entry = marketplace.plugins[0];
assert.equal(entry.name, manifest.name);
assert.equal(entry.source.source, 'local');
assert.equal(entry.source.path, './');
assert.equal(entry.category, 'Productivity');
assert.equal(entry.policy.installation, 'AVAILABLE');
assert.equal(entry.policy.authentication, 'ON_INSTALL');
assert.ok(marketplace.interface.displayName);
const mcp = (await json('.mcp.json')).mcpServers.strata;
assert.equal(mcp.command, 'cmd.exe');
assert.ok(mcp.args.includes('./scripts/run-plugin.cmd'));
assert.equal(mcp.cwd, '.');
console.log(JSON.stringify({ version: manifest.version, marketplace: marketplace.name, files: files.length, checksums: Object.keys(hashes).length, status: 'passed' }));
