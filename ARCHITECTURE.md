# Architecture note

## Product slice

Ajaia Docs is a small collaborative workspace optimized for a reviewer walkthrough: switch seeded identity → create or open a document → format content → autosave → import a draft → export Markdown → share → verify owned vs shared access as another user.

## Technical shape

```text
Browser (vanilla JS + contenteditable)
        │ JSON API + x-user-id header
        ▼
Node.js HTTP server (server.js)
        │
        ▼
JSON persistence (DATA_FILE / data/store.json)
```

The server owns access checks and mutations. The client only renders documents the current identity can access. Sharing rules are enforced at the API boundary so they remain testable without depending on UI hiding.

## Priorities (and why)

1. **End-to-end reliability under a timebox** — zero build step, no paid dependencies, one process serves UI + API.
2. **Reviewer clarity** — seeded identities, owned/shared sidebar sections, explicit import types, and a welcome document that explains the loop.
3. **Usable editing without framework tax** — browser `contenteditable` + `document.execCommand` for bold/italic/underline/headings/lists/quotes; formatting stored as HTML.
4. **Safe-enough boundaries** — owner-only share management, access checks on read/write/export, request size caps, escaped imports.
5. **One stretch feature** — Markdown export (`GET /api/documents/:id/export/markdown`) reuses the same ACL as viewing and keeps the import/export story coherent.

## Intentional deprioritization

- Real authentication / sessions
- Concurrent realtime collaboration
- Comments, suggestions, version history
- DOCX import / PDF export (Markdown export is the chosen stretch)
- Role-based permissions beyond “has access”

## Next 2–4 hours

Replace simulated identity with passwordless auth, move persistence to SQLite/Postgres with migrations, sanitize HTML with a allowlist, and add optimistic concurrency (updatedAt / version) for overlapping edits.
