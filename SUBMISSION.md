# Ajaia Docs — Submission

**Candidate:** Adit Jigneshbhai Shah  
**Email:** ashah45@ncsu.edu  
**Role:** Full Stack Product Engineer (AI-Native)

---

## Live product

**https://ajaia-docs-ashah.fly.dev/**

No signup. Use the **Viewing as** switcher:

| Identity | Email | Notes |
| --- | --- | --- |
| Ada Lovelace | ada@ajaia.local | Default owner; owns welcome doc |
| Grace Hopper | grace@ajaia.local | Already shared on welcome doc |
| Linus Torvalds | linus@ajaia.local | Use for share / deny checks |

---

## Exactly what is included in this Google Drive folder

| Item | File / location |
| --- | --- |
| Source code | Full project (also https://github.com/CodeRockerr/ajaia-docs) |
| Local setup instructions | `README.md` |
| Architecture / prioritization note | `ARCHITECTURE.md` |
| AI workflow note | `AI_WORKFLOW.md` |
| This submission index | `SUBMISSION.md` |
| Live product URL | Above + repeated in `README.md` |
| Walkthrough video URL | `VIDEO_URL.txt` |
| Walkthrough speaking script (helper) | `WALKTHROUGH_SCRIPT.md` |
| Sample import file | `samples/standup-notes.md` |
| Screenshots | `screenshots/` |
| Automated tests | `test/server.test.js` (`npm test`) |
| Deploy configs | `Dockerfile`, `fly.toml`, `Procfile`, `render.yaml`, `railway.toml` |

---

## What works end to end

1. **Document creation & editing** — create, rename, rich-text (bold / italic / underline / headings / lists / quotes), autosave, reopen after refresh  
2. **File upload** — import `.txt` or `.md` into a new editable document (other types rejected with `415`; stated in UI + README)  
3. **Sharing** — owner grants access to seeded users; sidebar separates **Owned by you** vs **Shared with you**; API enforces access  
4. **Persistence** — JSON store locally; Fly.io volume in production  
5. **Stretch: Markdown export** — **Export .md** downloads the current document (headings, lists, bold/italic); same access rules as viewing  
6. **Engineering quality** — `npm start` / `npm test`, validation/errors, architecture + AI notes, deployed build

---

## Intentionally deprioritized

- Real authentication / sessions (seeded switcher instead)  
- Realtime multiplayer editing  
- Comments / suggestion mode  
- Full document version history  
- DOCX / PDF import or PDF export  
- Role-based permissions beyond basic access  
- TipTap/Lexical / hosted DB (kept zero paid deps for reviewers)

### What I would build next (2–4 hours)

Passwordless auth, Postgres/SQLite + migrations, HTML sanitizer allowlist, light version history / optimistic concurrency.

---

## Key implementation decisions

- **Vanilla Node HTTP + static UI** — one process, no build step, fast to review  
- **`contenteditable` + HTML persistence** — usable rich text without editor-framework overhead  
- **JSON file + `DATA_FILE`** — portable locally; volume-backed on Fly  
- **`x-user-id` simulated identity** — sharing demos without OAuth friction  
- **Access checks on the server** — share/export/read/write cannot be bypassed by UI alone  

---

## How to run locally

Requires Node.js 20+.

```bash
npm start
# open http://localhost:3000
npm test
```

Details: `README.md`.

---

## Walkthrough video

Paste the unlisted Loom / YouTube link into `VIDEO_URL.txt` before final Drive upload.  
Speaking outline: `WALKTHROUGH_SCRIPT.md` (covers main flow, what works, deprioritization, decisions, AI usage).

---

## Screenshots

See `screenshots/` for editor, sharing, and workspace overview captures (no special setup beyond opening the live URL).
