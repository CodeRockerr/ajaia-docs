# Ajaia Docs submission

**Candidate:** Adit Jigneshbhai Shah (`ashah45@ncsu.edu`)

## Included in this folder

| File | Purpose |
| --- | --- |
| `README.md` | Local setup, seeded users, scope |
| `ARCHITECTURE.md` | Prioritization and system shape |
| `AI_WORKFLOW.md` | How Cursor was used / verified |
| `server.js` | API, access rules, import, persistence, static hosting |
| `public/` | Document workspace UI |
| `test/server.test.js` | Persistence, sharing, import tests |
| `VIDEO_URL.txt` | Walkthrough video link |
| `Procfile` / `railway.toml` | Deployment hints |

## Links

- **Live product:** _(add Railway URL after deploy)_
- **Walkthrough video:** see `VIDEO_URL.txt`
- **Source:** this folder

## Reviewer credentials

No passwords. Use the **Viewing as** switcher:

- `ada@ajaia.local` — owner
- `grace@ajaia.local` — already shared on welcome doc
- `linus@ajaia.local` — for deny / new-share checks

## What works

- Create, rename, rich-text edit, autosave, reopen after refresh
- Import `.txt` / `.md` into a new editable document
- Owner-managed sharing; owned vs shared sidebar sections
- Persistence via JSON store (`DATA_FILE` for durable deploys)
- Automated tests: `npm test`

## Intentionally incomplete

- Real authentication / sessions
- Concurrent realtime editing
- Comments, suggestions, version history
- DOCX/PDF import or export
- Role-based permissions beyond basic access

## Next 2–4 hours

Passwordless auth, Postgres/SQLite + migrations, HTML sanitizer allowlist, optimistic concurrency / light version history.
