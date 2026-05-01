import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "_site");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function loadRedirects() {
  const redirectsPath = join(root, "_redirects");

  if (!existsSync(redirectsPath)) {
    return new Map();
  }

  return new Map(
    readFileSync(redirectsPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [from, to, status = "301"] = line.split(/\s+/);
        return [from, { to, status: Number(status) }];
      }),
  );
}

const redirects = loadRedirects();

function resolvePath(urlPath) {
  const safePath = normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  let filePath = join(root, safePath);

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  }

  if (!existsSync(filePath) && !extname(filePath)) {
    const htmlPath = `${filePath}.html`;
    const indexPath = join(filePath, "index.html");

    if (existsSync(htmlPath)) {
      filePath = htmlPath;
    } else if (existsSync(indexPath)) {
      filePath = indexPath;
    }
  }

  return filePath;
}

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url, "http://127.0.0.1");

  if (redirects.has(requestUrl.pathname)) {
    const redirect = redirects.get(requestUrl.pathname);
    response.writeHead(redirect.status, { Location: redirect.to });
    response.end();
    return;
  }

  const filePath = resolvePath(requestUrl.pathname);

  if (!existsSync(filePath)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const extension = extname(filePath);
  const contentType = contentTypes[extension] || "application/octet-stream";

  response.writeHead(200, { "Content-Type": contentType });
  createReadStream(filePath).pipe(response);
});

server.listen(4173, "127.0.0.1");
