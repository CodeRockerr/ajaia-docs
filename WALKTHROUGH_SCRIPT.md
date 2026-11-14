# Walkthrough video script (3–5 min)

Record on the live app: https://ajaia-docs-ashah.fly.dev/  
(or local `http://localhost:3456` if you prefer a clean desktop)

Hard refresh once before recording so the latest UI loads.

---

## Timeline

| Time | Show on screen | Say |
| --- | --- | --- |
| **0:00–0:25** | Full app, brand + “Your desk” panel visible | “Hi, I’m Adit. This is Ajaia Docs — a lightweight collaborative document workspace for the take-home. I scoped it to one strong loop: create, edit, import, share, persist, and export — not a Google Docs clone.” |
| **0:25–0:55** | Open welcome doc · click Bold / Heading / List · wait for **Saved** | “Editing uses a coherent rich-text toolbar — bold, italic, underline, headings, lists. Changes autosave. After refresh, formatting is preserved as HTML.” |
| **0:55–1:25** | Rename title · refresh page · reopen same doc | “Persistence is a JSON store on the server, with a Fly volume in production so data survives restarts. Refresh — content and title are still here.” |
| **1:25–1:55** | Click **Export .md** · briefly show downloaded file in Finder / editor | “Stretch feature: Markdown export. It converts the stored HTML — headings, emphasis, lists — into a downloadable `.md` file, and access checks still apply.” |
| **1:55–2:25** | Import `samples/standup-notes.md` via dropzone or ↑ | “File upload is product-relevant import. Only `.txt` and `.md` are supported — called out in the UI. Markdown headings and lists become editable rich text.” |
| **2:25–3:10** | As Ada, **Share** with Linus · switch **Viewing as** → Linus · show Shared section · switch to Grace | “Sharing is intentionally simple: seeded users, owner grants access. Owned vs shared are separated in the sidebar. Grace already had the welcome doc; Linus only sees what I share. Unshared docs return 403 at the API.” |
| **3:10–3:40** | Click **Focus** · type briefly · exit Focus · glance at sparkline / ring | “I invested in UX polish under the timebox — focus mode, workspace stats, writing-energy sparkline — because reviewers feel the product, not just the API.” |
| **3:40–4:20** | Stay on app; optional quick cut to repo / `ARCHITECTURE.md` | “Stack is vanilla Node + JSON persistence — zero paid deps, easy to run. I deprioritized realtime collab, comments, DOCX/PDF, and real auth. With 2–4 more hours I’d add passwordless auth, Postgres, and HTML sanitization.” |
| **4:20–4:45** | Back to live URL in browser | “AI: I used Cursor heavily for scaffolding and UI iteration, then verified with `npm test`, manual share flows, and a production deploy on Fly. I rejected heavier editor frameworks to keep reviewer setup friction low.” |
| **4:45–5:00** | End on brand / editor | “That’s the slice — focused, shippable, and intentional about tradeoffs. Thanks for watching.” |

**Target length:** ~4:00–4:45. Stop before 5:00.

---

## Prep checklist (2 minutes before record)

1. Hard refresh live site
2. Viewing as **Ada Lovelace**
3. Have `samples/standup-notes.md` ready to import
4. Clear Downloads folder a bit so the `.md` export is obvious
5. Close unrelated desktop notifications
6. Loom: 1080p, mic check, show browser only (or browser + brief face cam intro)

---

## What *not* to dwell on

- Don’t apologize for missing Google Docs features
- Don’t narrate every CSS animation
- Don’t open DevTools unless asked
- Don’t demo failing PDF import for more than 2 seconds (optional: “unsupported types get 415”)

---

## One-line backup if you run long

If you’re already at 4:00 after sharing: skip Focus/UI polish, go straight to “tradeoffs + AI + thanks.”
