# English StrandLab

Footnote is a small English-learning journal. ChatGPT is the tutor; this app
stores entries and review data in Google Sheets through the Footnote MCP tools.

## Run

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

## Google Sheet (Footnote)

Use a **new** spreadsheet for the Footnote schema:

1. Create a blank Google Sheet  
2. Extensions → Apps Script → paste `google-apps-script/Code.gs`  
3. Project Settings → Script properties → `SYNC_TOKEN` = a long random secret  
4. Deploy → Web app → Execute as me → Who has access: **Anyone**  
5. Copy URL into `.env.local`:

```bash
cp .env.example .env.local
# fill SHEETS_WEB_APP_URL / SYNC_TOKEN in the server environment
```

6. Restart `pnpm dev`
7. Run the Apps Script menu **StrandLab Footnote → Reset Footnote tables** once

Tabs created: `Input` · `Vocabulary` · `Output` · `Fluency` · `ReviewLog`

## App UX

- **Home** — timeline of learning entries
- **Detail** — Simple Note or Structured Learning document
- The browser UI reads Footnote data from the configured Google Sheets adapter.

## MCP

The Streamable HTTP MCP endpoint is `/api/mcp`. It exposes:

- `list_entries`, `get_entry_detail`, `create_entry`, `update_entry`
- `upsert_vocabulary`, `save_output`, `save_fluency`, `log_review`
- `update_vocabulary_review_state`, `get_review_queue`

Configure `SHEETS_WEB_APP_URL` and `SYNC_TOKEN` server-side. Do not expose the
MCP token in browser/client variables.

## Docs

- Product brief: `docs/NEW_IDEAS.md`
- MCP specification: `docs/NEW_IDEAS_mcp.md`

## Legacy

Footnote is the only active product surface. The former lesson workspace and
its REST routes have been removed from the application runtime.
