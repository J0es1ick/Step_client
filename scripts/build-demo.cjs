const { spawnSync } = require("node:child_process");
const base = process.env.DEMO_BASE_PATH || "/";
if (!/^\/(?:[\w.-]+\/)*$/.test(base))
  throw new Error("DEMO_BASE_PATH must be / or /repository/");
const result = spawnSync(
  process.execPath,
  [
    require.resolve("webpack-cli/bin/cli.js"),
    "--mode",
    "production",
    "--env",
    "demo",
    "--env",
    `base=${base}`,
  ],
  { stdio: "inherit" },
);
if (result.status !== 0) process.exit(result.status || 1);
require("./copy-public.cjs");
require("node:fs").writeFileSync("dist/.nojekyll", "");
