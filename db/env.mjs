// Reads .env.local (then .env) into process.env. Values already set in the terminal win.
import fs from "node:fs";
import path from "node:path";

export function loadEnv(root = process.cwd()) {
  for (const name of [".env.local", ".env"]) {
    const file = path.join(root, name);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      let value = match[2];
      if (/^(".*"|'.*')$/.test(value)) value = value.slice(1, -1);
      if (process.env[match[1]] === undefined && value !== "") process.env[match[1]] = value;
    }
  }
}
