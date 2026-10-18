# Roadmap data

Curriculum + cast for the **Roadmap** tab. See [`PLAN.md`](PLAN.md).

| File | Role |
|------|------|
| `cast.json` | Javi + Anna, Easter, John, Nathan, Sean |
| `path.json` | Ordered checkpoints per CEFR level |
| `{a1,a2,b1,b2}/checkpoints/*.json` | Story lessons |
| `curriculum-stats.json` | Generated coverage stats |
| `_scripts/generate-roadmap-curriculum.py` | Regenerator from Oxford PDF extract |

## Coverage (Oxford 3000 by CEFR)

Each checkpoint is **one longer story** (~56 target words, ~280–600 word chapter by level) — not a tiny word list.

| Level | Words | Stories (~56 words each) |
|-------|------:|-------------------------:|
| A1 | 902 | 16 |
| A2 | 871 | 15 |
| B1 | 810 | 14 |
| B2 | 728 | 13 |
| **Total** | **3311** | **58** |

Words are packed across topics (tiny topic buckets merge into the next pack). Primary topic labels the scene; leftovers never become 1–5-word stories.

Meanings in bulk stories are placeholders (`Oxford 3000 · LEVEL · word`) for Quiz uniqueness — refine later if you want real glosses.

Regenerate:

```bash
# needs /tmp/oxford3000-cefr.txt from PDF extract
python3 _scripts/generate-roadmap-curriculum.py
```
