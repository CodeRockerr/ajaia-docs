# AI workflow note

## Tools used

- **Cursor** (Composer agent) for scaffolding, iterative implementation, UI polish, and documentation drafts
- Node’s built-in test runner and local browser checks for verification

## Where AI materially sped up work

- First-pass HTTP API and persistence helpers
- TipTap alternatives evaluation → decided against a heavy editor dependency for this timebox
- Responsive layout and share-modal structure
- Focused automated tests around persistence, sharing boundaries, and import validation
- Drafts of README / architecture / submission packaging

## What AI-generated output I changed or rejected

- Rejected adding TipTap/Lexical, OAuth, and a hosted database for the core slice — too much setup friction for reviewers relative to the product story
- Reworked the default “purple SaaS” visual direction into a quieter workspace look with clearer owned/shared hierarchy
- Tightened generated API behavior: owner-only sharing, unsupported file types (`415`), access checks on read/write, content size limits, and escaped text/Markdown imports
- Fixed share-modal logic so `sharedWith` is treated as user IDs (not objects)

## How I verified correctness, UX, and reliability

1. `npm test` — persistence, sharing ACL, and import validation
2. Manual browser pass as Ada → edit → refresh → confirm persistence
3. Share with Grace → switch identity → confirm owned vs shared sections
4. Switch to Linus → confirm denied access on unshared docs
5. Import `.md` and reject `.pdf` / unsupported types via UI + API
6. Post-deploy smoke check of the live URL with the same seeded users

AI accelerated scaffolding; product judgment (scope cuts, access model, reviewer walkthrough) stayed human-owned.
