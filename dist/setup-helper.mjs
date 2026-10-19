// apps/runtime/setup-helper.mjs
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

// apps/runtime/storage.mjs
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
async function readJson(file2, fallback) {
  try {
    return JSON.parse(await readFile(file2, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw new Error(`Cannot read saved Strata data (${error.code ?? error.name}). The file has been preserved.`);
  }
}
async function writeJson(file2, value) {
  await mkdir(dirname(file2), { recursive: true });
  const temporary = `${file2}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(value, null, 2) + "\n", { mode: 384 });
  await rename(temporary, file2);
}

// apps/runtime/setup.mjs
import { createServer } from "node:net";
import { mkdir as mkdir2, stat } from "node:fs/promises";
import { join, dirname as dirname2, resolve } from "node:path";
import { randomUUID as randomUUID2, createHash } from "node:crypto";
var sleep = (ms) => new Promise((resolve2) => setTimeout(resolve2, ms));
async function withSetupLock(file2, action) {
  await mkdir2(dirname2(file2), { recursive: true });
  const identity = createHash("sha256").update(resolve(file2).toLowerCase()).digest("hex").slice(0, 24);
  const pipe = ["", "", ".", "pipe", "strata-setup-" + identity].join(String.fromCharCode(92));
  for (let attempt = 0; attempt < 100; attempt++) {
    const lock = createServer((socket) => socket.destroy());
    try {
      await new Promise((resolve2, reject) => {
        lock.once("error", reject);
        lock.listen(pipe, resolve2);
      });
    } catch (error) {
      if (error.code !== "EADDRINUSE") throw error;
      await sleep(50);
      continue;
    }
    try {
      return await action();
    } finally {
      await new Promise((resolve2) => lock.close(resolve2));
    }
  }
  throw new Error("\u53E6\u4E00\u4E2A\u684C\u9762\u8FDE\u63A5\u8BF7\u6C42\u6B63\u5728\u5904\u7406\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002");
}

// apps/runtime/setup-helper.mjs
var [file, planId] = process.argv.slice(2);
var script = fileURLToPath(new URL("../scripts/setup-desktop.ps1", import.meta.url));
try {
  const claimed = await withSetupLock(file, async () => {
    const plan = await readJson(file, null);
    if (!plan || plan.planId !== planId || plan.phase !== "starting" || Date.now() > plan.requestedAt + 15e3 || plan.helperPid) return false;
    await writeJson(file, { ...plan, helperPid: process.pid, updatedAt: Date.now() });
    return true;
  });
  if (!claimed) process.exit(1);
  const outcome = await new Promise((resolve2) => {
    const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-File", script, "-PlanPath", file, "-PlanId", planId], { windowsHide: true, stdio: "ignore" });
    child.once("error", (error) => resolve2(`\u65E0\u6CD5\u542F\u52A8 PowerShell \u8FDE\u63A5\u52A9\u624B\uFF08${error.code ?? "unknown"}\uFF09\u3002`));
    child.once("exit", (code) => resolve2(`PowerShell \u8FDE\u63A5\u52A9\u624B\u63D0\u524D\u9000\u51FA\uFF08\u9000\u51FA\u7801 ${code}\uFF09\uFF0C\u672A\u5B8C\u6210\u91CD\u8FDE\u3002`));
  });
  await withSetupLock(file, async () => {
    const current = await readJson(file, null);
    if (current?.planId === planId && !["relaunched", "failed", "close-timeout"].includes(current.phase)) await writeJson(file, { ...current, phase: "failed", error: outcome, updatedAt: Date.now() });
  });
} catch {
  process.exitCode = 1;
}
