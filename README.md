# Ajaia Docs

A lightweight collaborative document workspace for the Ajaia Full Stack Product Engineer exercise. The goal is a coherent, testable product slice — not a Google Docs clone.

## Run locally

Requires **Node.js 20+**. No other dependencies.

```bash
npm start
# open http://localhost:3000
```

Dev auto-reload:

```bash
npm run dev
```

Tests:

```bash
npm test
```

Persistence uses `data/store.json` (created on first run). Override with `DATA_FILE=/path/to/store.json` when deploying with a volume.

## Reviewer walkthrough

The app starts as **Ada Lovelace**. Use **Viewing as** to switch seeded accounts (no passwords).

| User | Email | Purpose |
| --- | --- | --- |
| Ada Lovelace | ada@ajaia.local | Owner of the welcome document |
| Grace Hopper | grace@ajaia.local | Already has access to the welcome document |
| Linus Torvalds | linus@ajaia.local | Unshared account for access-boundary checks |

Suggested path:

1. As Ada, edit the welcome doc (bold / heading / list) and confirm **Saved**
2. Refresh — content and title persist
3. **Share** with Linus (or confirm Grace already has access)
4. Switch to Grace / Linus — note **Owned by you** vs **Shared with you**
5. Import a `.txt` or `.md` file via the sidebar ↑ control
6. Click **Export .md** to download the current document as Markdown

**Supported uploads:** `.txt` and `.md` only (stated in the UI). Other types return `415`.
**Export:** any document you can open can be downloaded as `.md` (headings, lists, bold/italic).

## Live demo

**https://ajaia-docs-ashah.fly.dev/**

Deployed on Fly.io with a persistent volume for `DATA_FILE`.

## Scope and tradeoffs

- Auth is a seeded user switcher so sharing is reviewable without an IdP
- Persistence is a JSON file for portability; production would use Postgres/SQLite + real auth
- Editor uses `contenteditable` for a compact rich-text loop (bold, italic, underline, headings, lists, quotes)
- Realtime collab, comments, version history, DOCX/PDF, and RBAC roles are intentionally out of scope

See [ARCHITECTURE.md](./ARCHITECTURE.md), [AI_WORKFLOW.md](./AI_WORKFLOW.md), and [SUBMISSION.md](./SUBMISSION.md).
