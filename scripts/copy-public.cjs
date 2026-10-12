const fs = require("node:fs");
const path = require("node:path");
for (const entry of fs.readdirSync("public")) {
  if (entry !== "index.html")
    fs.cpSync(path.join("public", entry), path.join("dist", entry), {
      recursive: true,
    });
}
