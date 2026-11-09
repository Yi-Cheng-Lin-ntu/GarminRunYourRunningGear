// Optional local-only static server for reproducible Pages-prefix browser tests.
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
async function startStaticServer(base) {
  const root = path.resolve(__dirname, "../..");
  const url = new URL(base);
  const mime = { ".js": "text/javascript", ".css": "text/css", ".csv": "text/csv", ".svg": "image/svg+xml", ".png": "image/png", ".html": "text/html" };
  const server = http.createServer(async (request, response) => {
    try {
      let pathname = decodeURIComponent(new URL(request.url, base).pathname);
      pathname = pathname.replace(/^\/GarminRunYourRunningGear(?=\/|$)/, "");
      let file = path.resolve(root, "." + (pathname || "/"));
      if (!file.startsWith(root + path.sep) && file !== root || pathname.includes("/.")) throw new Error("Not found");
      if ((await fs.stat(file)).isDirectory()) file = path.join(file, "index.html");
      response.setHeader("Content-Type", mime[path.extname(file)] || "application/octet-stream");
      response.end(await fs.readFile(file));
    } catch { response.statusCode = 404; response.end("Not found"); }
  });
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(Number(url.port), "127.0.0.1", resolve); });
  return server;
}
module.exports = { startStaticServer };
