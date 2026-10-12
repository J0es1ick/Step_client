// Plain static hosting intentionally has no SPA fallback: demo routes use hashes.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve("dist");
const base = process.env.DEMO_BASE_PATH || "/";
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};
http
  .createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
    } catch {
      res.writeHead(400).end();
      return;
    }
    if (!pathname.startsWith(base)) {
      res.writeHead(404).end();
      return;
    }
    const file = path.resolve(
      root,
      pathname.slice(base.length) || "index.html",
    );
    if (
      !file.startsWith(root + path.sep) ||
      !fs.existsSync(file) ||
      !fs.statSync(file).isFile()
    ) {
      res.writeHead(404).end();
      return;
    }
    res.setHeader(
      "Content-Type",
      types[path.extname(file)] || "application/octet-stream",
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    fs.createReadStream(file).pipe(res);
  })
  .listen(Number(process.env.PREVIEW_PORT || 5181), "127.0.0.1", () =>
    console.log(
      `Preview: http://127.0.0.1:${process.env.PREVIEW_PORT || 5181}${base}`,
    ),
  );
