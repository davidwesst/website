import { spawn, execFile } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";
import { readDeployment } from "../lib/deployment-identity.js";
import { createRequest, HostingFailure } from "../lib/hosting-request.js";
import { checkIdentity } from "../lib/hosting-checks.js";

const expected = await readDeployment(); // Reject mismatched downloaded artifacts before deployment.
const reservation = createServer();
await new Promise((resolve, reject) => { reservation.once("error", reject); reservation.listen(0, "127.0.0.1", resolve); });
const { port } = reservation.address();
await new Promise((resolve) => reservation.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const wrangler = spawn(process.execPath, ["node_modules/wrangler/bin/wrangler.js", "dev", "--local", "--env", "", "--ip", "127.0.0.1", "--port", String(port), "--inspector-port", "0"], {
  stdio: ["ignore", "pipe", "pipe"], windowsHide: true, detached: process.platform !== "win32",
  env: { ...process.env, WRANGLER_SEND_METRICS: "false", CI: "true" },
});
let output = "";
for (const stream of [wrangler.stdout, wrangler.stderr]) stream.on("data", (chunk) => { output = (output + chunk).slice(-16000); });
let stopped;
const exited = new Promise((resolve) => {
  wrangler.once("error", (error) => { stopped = error; resolve(); });
  wrangler.once("exit", (code, signal) => { stopped = new Error(`Wrangler exited (${code ?? signal})`); resolve(); });
});
const cancellation = new AbortController();
const cancel = () => cancellation.abort();
process.once("SIGINT", cancel);
process.once("SIGTERM", cancel);
try {
  const deadline = performance.now() + 60000;
  const request = createRequest(origin, { deadline, requestTimeoutMs: 1000 });
  while (true) {
    cancellation.signal.throwIfAborted();
    if (stopped) throw stopped;
    try { await checkIdentity(request, expected); break; } catch (error) {
      if (!(error instanceof HostingFailure) || performance.now() >= deadline) throw error;
      await delay(Math.min(250, deadline - performance.now()), undefined, { signal: cancellation.signal });
    }
  }
  const check = spawn(process.execPath, ["tools/check-hosting.mjs", origin, "--all-redirects"], {
    stdio: "inherit", windowsHide: true, signal: cancellation.signal,
  });
  await new Promise((resolve, reject) => {
    check.once("error", reject);
    check.once("exit", (code, signal) => code === 0 ? resolve() : reject(new Error(`Local hosting checks failed (${code ?? signal})`)));
  });
} catch (error) {
  console.error(output);
  console.error(error);
  process.exitCode = 1;
} finally {
  // Wrangler owns workerd descendants; terminate the whole process tree on either OS.
  if (wrangler.pid) {
    if (process.platform === "win32") {
      if (!stopped) await promisify(execFile)("taskkill", ["/pid", String(wrangler.pid), "/T", "/F"], { windowsHide: true });
    } else {
      try { process.kill(-wrangler.pid, "SIGTERM"); } catch (error) { if (error.code !== "ESRCH") throw error; }
      await Promise.race([exited, delay(2000)]);
      try { process.kill(-wrangler.pid, "SIGKILL"); } catch (error) { if (error.code !== "ESRCH") throw error; }
    }
    await exited;
  }
  process.removeListener("SIGINT", cancel);
  process.removeListener("SIGTERM", cancel);
}
