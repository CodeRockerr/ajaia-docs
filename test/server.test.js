import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createServer } from "../server.js";

const dataFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ajaia-test-")), "store.json");
process.env.DATA_FILE = dataFile;
const server = createServer();
let baseUrl;
test.before(async () => await new Promise((resolve) => server.listen(0, () => { baseUrl = `http://localhost:${server.address().port}`; resolve(); })));
test.after(() => server.close());
const request = (pathName, options = {}) => fetch(`${baseUrl}${pathName}`, { ...options, headers: { "content-type": "application/json", ...(options.headers || {}) } });

test("documents persist edits and return them to the owner", async () => {
  const create = await request("/api/documents", { method: "POST", headers: { "x-user-id": "ada" }, body: JSON.stringify({ title: "Roadmap", content: "<h1>Q1</h1>" }) });
  assert.equal(create.status, 201);
  const document = await create.json();
  const update = await request(`/api/documents/${document.id}`, { method: "PUT", headers: { "x-user-id": "ada" }, body: JSON.stringify({ title: "Roadmap v2", content: "<p>Updated</p>" }) });
  assert.equal((await update.json()).title, "Roadmap v2");
  const list = await request("/api/documents", { headers: { "x-user-id": "ada" } });
  assert.ok((await list.json()).some((item) => item.title === "Roadmap v2"));
});

test("sharing grants access to the recipient but not to a third party", async () => {
  const create = await request("/api/documents", { method: "POST", headers: { "x-user-id": "ada" }, body: JSON.stringify({ title: "Private notes", content: "<p>Secret</p>" }) });
  const document = await create.json();
  const share = await request(`/api/documents/${document.id}/share`, { method: "POST", headers: { "x-user-id": "ada" }, body: JSON.stringify({ userId: "grace" }) });
  assert.equal(share.status, 200);
  const shared = await request(`/api/documents/${document.id}`, { headers: { "x-user-id": "grace" } });
  assert.equal(shared.status, 200);
  const denied = await request(`/api/documents/${document.id}`, { headers: { "x-user-id": "linus" } });
  assert.equal(denied.status, 403);
});

test("import only accepts supported text formats", async () => {
  const imported = await request("/api/import", { method: "POST", headers: { "x-user-id": "ada" }, body: JSON.stringify({ filename: "notes.md", content: "# Notes\n\n- One" }) });
  const document = await imported.json();
  assert.equal(imported.status, 201);
  assert.match(document.content, /<h1>Notes<\/h1>/);
  const rejected = await request("/api/import", { method: "POST", body: JSON.stringify({ filename: "notes.pdf", content: "x" }) });
  assert.equal(rejected.status, 415);
});
