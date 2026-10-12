const fs = require("node:fs");
const path = require("node:path");
const base = process.env.DEMO_BASE_PATH || "/";
const html = fs.readFileSync("dist/index.html", "utf8");
const values = (attribute) =>
  [
    ...html.matchAll(
      new RegExp(`\\b${attribute}=(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "g"),
    ),
  ].map((match) => match[1] || match[2] || match[3]);
const scripts = values("src").filter((value) => value.endsWith(".js"));
if (!scripts.length || !values("href").includes(`${base}favicon.svg`))
  throw new Error("Missing entrypoint or incorrect favicon base");
for (const url of scripts) {
  if (!url.startsWith(base + "assets/"))
    throw new Error("Bundle must live under the Pages base path");
  const bundle = fs.readFileSync(
    path.join("dist", url.slice(base.length)),
    "utf8",
  );
  if (bundle.includes("/api/store"))
    throw new Error("Live HTTP adapter leaked into the demo bundle");
}
for (const file of [
  "step-graffiti.png",
  "step-your-move.png",
  "step-floating.png",
  "step-orbit-collection.png",
])
  if (!fs.existsSync("dist/media/" + file)) throw new Error("Missing " + file);
console.log("Standalone demo assets and base path verified.");
