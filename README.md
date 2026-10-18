# English StrandLab

Four-strands English learning **organizer** (roadmap + lesson workspace).  
ChatGPT is the tutor; this app stores progress in Google Sheets via Apps Script.

## Run

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

## Google Sheet (new)

Old vocab-quiz Sheet/token is retired. Use a **new** spreadsheet:

1. Create a blank Google Sheet  
2. Extensions → Apps Script → paste `google-apps-script/Code.gs`  
3. Project Settings → Script properties → `SYNC_TOKEN` = a long random secret  
4. Deploy → Web app → Execute as me → Who has access: **Anyone**  
5. Copy URL into `.env.local`:

```bash
cp .env.example .env.local
# fill NEXT_PUBLIC_SHEETS_WEB_APP_URL / SYNC_TOKEN / GOOGLE_SHEET_URL
```

6. Restart `pnpm dev`  
7. In the app: **Setup Sheet tabs** → **Sync Sheet**

Tabs created: `Input` · `Vocabulary` · `Output` · `Fluency`

## App UX

- **Roadmap** — list lessons (status, review due)  
- **Lesson** — four strands: Input → Language → Output → Fluency (+ timers)  
- Local cache: `localStorage` key `english-strandlab-v1`

## Docs

- Product brief: `docs/IDEAS.md`  
- MCP demo (not wired): `_parked/mcp-demo/`

## Legacy

`vocab-quiz/` remains as reference only. Cycle curriculum under `public/data/cycle` was removed.
