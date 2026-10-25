import fs from "node:fs";
import http from "node:http";

function loadLocalEnv(path = ".env") {
  if (!fs.existsSync(path)) return;
  const lines = fs.readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadLocalEnv();
const { createHandler } = await import("./src/app.js");
const handler = createHandler();
const port = Number.parseInt(process.env.PORT || "3000", 10);

const server = http.createServer((req, res) => handler(req, res));
server.listen(port, "0.0.0.0", () => {
  console.log(`Mercy API écoute sur http://localhost:${port}/api`);
});
