import { spawn } from "node:child_process";
import { createInterface, emitKeypressEvents } from "node:readline";
import { stdin, stdout } from "node:process";

function promptVisible(label, defaultValue = "") {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  const readline = createInterface({ input: stdin, output: stdout });
  return new Promise((resolve) => {
    readline.question(`${label}${suffix}: `, (answer) => {
      readline.close();
      resolve(answer.trim() || defaultValue);
    });
  });
}

function promptHidden(label) {
  if (!stdin.isTTY) return promptVisible(label);

  stdout.write(`${label}: `);
  stdin.resume();
  stdin.setRawMode(true);
  emitKeypressEvents(stdin);

  return new Promise((resolve, reject) => {
    let value = "";

    function cleanup() {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("keypress", onKeypress);
    }

    function onKeypress(character, key) {
      if (key?.name === "return" || key?.name === "enter") {
        cleanup();
        stdout.write("\n");
        resolve(value.trim());
        return;
      }

      if (key?.name === "backspace") {
        value = value.slice(0, -1);
        return;
      }

      if (key?.ctrl && key?.name === "c") {
        cleanup();
        reject(new Error("Interrupted"));
        return;
      }

      if (character && !key?.ctrl && !key?.meta) value += character;
    }

    stdin.on("keypress", onKeypress);
  });
}

function runPrepareIgdb(env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["tools/prepare-igdb.mjs", "--force", "--require-refresh"], {
      env: { ...process.env, ...env },
      shell: false,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`prepare:igdb exited with signal ${signal}`));
        return;
      }

      if (code !== 0) {
        reject(new Error(`prepare:igdb exited with code ${code}`));
        return;
      }

      resolve();
    });
  });
}

const clientId = await promptVisible("IGDB_CLIENT_ID", process.env.IGDB_CLIENT_ID);
const clientSecret = await promptHidden("IGDB_CLIENT_SECRET");

if (!clientId) throw new Error("IGDB_CLIENT_ID is required.");
if (!clientSecret) throw new Error("IGDB_CLIENT_SECRET is required.");

await runPrepareIgdb({
  IGDB_CLIENT_ID: clientId,
  IGDB_CLIENT_SECRET: clientSecret,
});
