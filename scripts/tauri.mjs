import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../node_modules/@tauri-apps/cli/tauri.js", import.meta.url));
const env = { ...process.env };
if (env.CI === "1") env.CI = "true";
const result = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], { env, stdio: "inherit" });
process.exit(result.status ?? 1);
