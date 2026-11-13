import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { URL } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(ROOT, "public");
const PORT = Number(process.env.PORT || 3000);
const defaultDataFile = path.join(ROOT, "data", "store.json");

const SEED_USERS = [
  { id: "ada", name: "Ada Lovelace", email: "ada@ajaia.local", initials: "AL", color: "#1f7a6b" },
  { id: "grace", name: "Grace Hopper", email: "grace@ajaia.local", initials: "GH", color: "#2f6fed" },
  { id: "linus", name: "Linus Torvalds", email: "linus@ajaia.local", initials: "LT", color: "#c45c26" }
];

const seedDocument = {
  id: "welcome",
  title: "Welcome to Ajaia",
  content: "<h1>A calmer way to work together</h1><p>This is your shared workspace. Create a document, format your thinking, and invite a teammate when it is ready.</p><h2>Try it out</h2><ul><li>Use the toolbar to add emphasis and structure.</li><li>Import a plain text or Markdown file.</li><li>Share this document with Grace to see the shared workspace.</li></ul>",
  ownerId: "ada",
  sharedWith: ["grace"],
  createdAt: "2026-01-15T10:00:00.000Z",
  updatedAt: "2026-01-15T10:00:00.000Z"
};

function initialStore() {
  const now = new Date().toISOString();
  return { users: SEED_USERS, documents: [{ ...seedDocument, createdAt: now, updatedAt: now }] };
}

function readStore() {
  const dataFile = process.env.DATA_FILE || defaultDataFile;
  try {
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const store = initialStore();
    writeStore(store);
    return store;
  }
}

function writeStore(store) {
  const dataFile = process.env.DATA_FILE || defaultDataFile;
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
}

function currentUser(request, store) {
  const requested = request.headers["x-user-id"] || new URL(request.url, "http://localhost").searchParams.get("user");
  return store.users.find((user) => user.id === requested) || store.users[0];
}

function canAccess(document, userId) {
  return document.ownerId === userId || document.sharedWith.includes(userId);
}

function publicDocument(document, store) {
  const owner = store.users.find((user) => user.id === document.ownerId);
  return {
    ...document,
    owner: { id: owner.id, name: owner.name, initials: owner.initials, color: owner.color },
    sharedUsers: document.sharedWith.map((id) => store.users.find((user) => user.id === id)).filter(Boolean)
  };
}

function send(response, status, body, headers = {}) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", ...headers });
  response.end(JSON.stringify(body));
}

function sendError(response, status, message) {
  send(response, status, { error: message });
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) request.destroy(new Error("Request too large"));
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Request body must be valid JSON"));
      }
    });
    request.on("error", reject);
  });
}

function markdownToHtml(text) {
  const escaped = text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const blocks = [];
  let listType = null;
  let listItems = [];

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push(`<${listType}>${listItems.join("")}</${listType}>`);
    listType = null;
    listItems = [];
  };

  for (const line of escaped.split(/\r?\n/)) {
    if (line.startsWith("### ")) {
      flushList();
      blocks.push(`<h3>${line.slice(4)}</h3>`);
    } else if (line.startsWith("## ")) {
      flushList();
      blocks.push(`<h2>${line.slice(3)}</h2>`);
    } else if (line.startsWith("# ")) {
      flushList();
      blocks.push(`<h1>${line.slice(2)}</h1>`);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listItems.push(`<li>${line.slice(2)}</li>`);
    } else if (/^\d+\.\s/.test(line)) {
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      listItems.push(`<li>${line.replace(/^\d+\.\s/, "")}</li>`);
    } else if (!line) {
      flushList();
    } else {
      flushList();
      blocks.push(`<p>${line}</p>`);
    }
  }

  flushList();
  return blocks.join("");
}

export async function handleApi(request, response) {
  const store = readStore();
  const url = new URL(request.url, "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);
  const user = currentUser(request, store);

  if (request.method === "GET" && url.pathname === "/api/me") return send(response, 200, user);
  if (request.method === "GET" && url.pathname === "/api/users") return send(response, 200, store.users);

  if (request.method === "GET" && url.pathname === "/api/documents") {
    const documents = store.documents.filter((document) => canAccess(document, user.id));
    return send(response, 200, documents.map((document) => publicDocument(document, store)));
  }

  if (parts[0] === "api" && parts[1] === "documents" && parts[2]) {
    const document = store.documents.find((item) => item.id === parts[2]);
    if (!document) return sendError(response, 404, "Document not found");
    if (!canAccess(document, user.id)) return sendError(response, 403, "You do not have access to this document");

    if (request.method === "GET") return send(response, 200, publicDocument(document, store));
    if (request.method === "PUT") {
      const body = await readJson(request);
      if (typeof body.title !== "string" || !body.title.trim()) return sendError(response, 400, "A document title is required");
      if (typeof body.content !== "string") return sendError(response, 400, "Document content must be text");
      document.title = body.title.trim().slice(0, 120);
      document.content = body.content.slice(0, 500_000);
      document.updatedAt = new Date().toISOString();
      writeStore(store);
      return send(response, 200, publicDocument(document, store));
    }
    if (request.method === "POST" && parts[3] === "share") {
      if (document.ownerId !== user.id) return sendError(response, 403, "Only the owner can manage sharing");
      const body = await readJson(request);
      const recipient = store.users.find((candidate) => candidate.id === body.userId);
      if (!recipient) return sendError(response, 400, "Choose a valid teammate");
      if (recipient.id === document.ownerId) return sendError(response, 400, "The owner already has access");
      if (!document.sharedWith.includes(recipient.id)) document.sharedWith.push(recipient.id);
      document.updatedAt = new Date().toISOString();
      writeStore(store);
      return send(response, 200, publicDocument(document, store));
    }
  }

  if (request.method === "POST" && url.pathname === "/api/documents") {
    const body = await readJson(request);
    const title = typeof body.title === "string" && body.title.trim() ? body.title.trim().slice(0, 120) : "Untitled document";
    const document = { id: randomUUID(), title, content: typeof body.content === "string" ? body.content : "<p>Start writing...</p>", ownerId: user.id, sharedWith: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    store.documents.unshift(document);
    writeStore(store);
    return send(response, 201, publicDocument(document, store));
  }

  if (request.method === "POST" && url.pathname === "/api/import") {
    const body = await readJson(request);
    if (typeof body.filename !== "string" || typeof body.content !== "string") return sendError(response, 400, "A filename and file content are required");
    const extension = path.extname(body.filename).toLowerCase();
    if (![".txt", ".md"].includes(extension)) return sendError(response, 415, "Only .txt and .md files are supported");
    const document = { id: randomUUID(), title: path.basename(body.filename, extension).slice(0, 120) || "Imported document", content: extension === ".md" ? markdownToHtml(body.content) : body.content.split(/\r?\n/).map((line) => line ? `<p>${line.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</p>` : "").join(""), ownerId: user.id, sharedWith: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    store.documents.unshift(document);
    writeStore(store);
    return send(response, 201, publicDocument(document, store));
  }

  return sendError(response, 404, "Not found");
}

function serveStatic(request, response) {
  const requested = new URL(request.url, "http://localhost").pathname;
  const file = requested === "/" ? "index.html" : requested.slice(1);
  const absolute = path.resolve(PUBLIC_DIR, file);
  if (!absolute.startsWith(path.resolve(PUBLIC_DIR))) return sendError(response, 403, "Forbidden");
  fs.readFile(absolute, (error, content) => {
    if (error) return fs.readFile(path.join(PUBLIC_DIR, "index.html"), (fallbackError, fallback) => {
      if (fallbackError) return sendError(response, 500, "Frontend is unavailable");
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(fallback);
    });
    const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml" };
    response.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
    response.end(content);
  });
}

export function createServer() {
  return http.createServer((request, response) => {
    if (request.url.startsWith("/api/")) {
      handleApi(request, response).catch((error) => sendError(response, error.message.includes("JSON") ? 400 : 500, error.message));
    } else if (request.method === "GET") {
      serveStatic(request, response);
    } else {
      sendError(response, 405, "Method not allowed");
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createServer().listen(PORT, () => console.log(`Ajaia Docs listening on http://localhost:${PORT}`));
}
