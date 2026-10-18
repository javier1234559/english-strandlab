# Roadmap — Product Plan (chốt hướng)

Tab **Roadmap** cạnh **Cycle** trong Meomotech English Lab.  
Frontend-only · JSON local · localStorage progress · copy prompt ↔ ChatGPT.

## 1. UI (theo mock bạn gửi)

### Tab shell
- Thêm tab `Roadmap` cạnh `Cycle` (thứ tự gợi ý: `Cycle · Roadmap · Reader · Vocab · Speak · Quiz`).
- Style Airbnb giống các tab khác (card, pill, coral accent) — không neo-brutalist.

### Màn 1 — Path (list uốn lượn)
Một cột dọc, node **zigzag** (trái/phải xen kẽ), giống path Duolingo:

```
        (✓)  Title checkpoint
    (✓)      Title…
        (★)  Title  ← current + progress ring
    ──────── A2 ────────     ← đường ranh giới level
        (○)  Title…
```

Mỗi node:
- **Circle**: completed = check xanh; current = star + ring tiến độ bước; locked/available = circle xám/đậm.
- **Title** bên cạnh (lệch trái/phải theo zigzag).
- Subtitle nhỏ optional: topic · CEFR (vd `Food · A1`).
- Line nối nhẹ giữa các node (CSS border/SVG đơn giản).

Ranh giới level: banner/divider `A1` → hết A1 → line `A2` → … → `B1` → `B2`.

Click node (available/current/completed) → Màn 2 Detail. Locked: chưa mở (hoặc mở free-choice nếu sau này muốn — MVP: mở tuần tự hoặc mở tất cả A1, chốt khi code).

### Màn 2 — Lesson detail (stub theo ROADMAP.md)
Tạm đủ dùng, refine sau:

1. Header: back ← path · title story · topic · level · characters  
2. Vocab list (target ~56 từ / story — đủ 1 chương ngắn)  
3. **Copy story prompt** (có cast + scene + vocab + CEFR)  
4. Textarea: paste / ghi summary (retell)  
5. **Copy correction prompt** (kèm summary)  
6. Textarea: save corrected version  
7. Steps checklist (local): vocab → story → retell → correct → saved · (quiz/speak = later)  
8. Nút đánh dấu hoàn thành checkpoint  

Quiz local + speak: **phase 2** (detail stub không block).

## 2. Data (chốt schema đơn giản)

Bỏ bắt buộc `topics/*.json` lúc đầu. **Checkpoint là source of truth cho học.**

```
data/roadmap/
├── PLAN.md                 ← file này
├── README.md               ← overview + thống kê CEFR + topic dự đoán
├── cast.json               ← protagonist + recurring NPCs (phim dài tập)
├── path.json               ← ordered list checkpoint ids (hoặc embed trong levels)
├── a1/
│   ├── README.md
│   └── checkpoints/
│       ├── a1-food-01.json
│       └── …
├── a2/ … b2/               ← cùng pattern, làm dần
```

### `cast.json`
```json
{
  "protagonist": { "id": "minh", "name": "Minh", "note": "Learner avatar / POV" },
  "cast": [
    { "id": "mai", "name": "Mai", "role": "cafe owner", "trait": "warm" },
    { "id": "lan", "name": "Lan", "role": "best friend", "trait": "funny" }
  ]
}
```

### Checkpoint file
```json
{
  "id": "a1-food-01",
  "level": "a1",
  "topic": "food-drink",
  "title": "Breakfast at Mai's cafe",
  "scene": "Minh orders breakfast and talks with Mai",
  "order": 1,
  "characters": ["minh", "mai"],
  "vocab": ["breakfast", "cafe", "coffee", "bread", "buy", "delicious", "friend", "morning", "sit", "happy", "please", "thank", "cup", "wait", "nice"],
  "storyPromptNotes": "Short A1 story; natural use of vocab; same cast names."
}
```

### `path.json` (index để render path nhanh)
```json
{
  "levels": [
    {
      "id": "a1",
      "label": "A1",
      "checkpoints": ["a1-people-01", "a1-food-01", "..."]
    },
    { "id": "a2", "label": "A2", "checkpoints": [] }
  ]
}
```

Curriculum: **58 stories** · ~**56 từ/story** · A1 16 · A2 15 · B1 14 · B2 13 (pack theo size, gộp topic nhỏ).

## 3. Progress (localStorage)

Key gợi ý: `mel.roadmap.v1`

```json
{
  "currentId": "a1-food-01",
  "lessons": {
    "a1-food-01": {
      "status": "current",
      "steps": { "vocab": true, "story": true, "retell": false, "correct": false, "saved": false },
      "summary": "",
      "corrected": "",
      "ring": 0.4
    }
  }
}
```

Ring trên path = % steps xong. Export/import JSON = phase 2.

## 4. Code architecture (bám app hiện tại)

| File | Việc |
|------|------|
| `index.html` | Tab + `#panel-roadmap` (path view + detail view swap) |
| `js/roadmap.js` | Load JSON, render path zigzag, detail, prompts, localStorage |
| `data/roadmap/**` | cast + path + checkpoints |

Pattern giống Cycle: `fetch` JSON · `VQRoadmap.activate()` khi đổi tab.

## 5. Phased delivery

### Phase 0 — Chốt nội dung mỏng (trước UI đầy)
1. Khôi phục `data/roadmap/README.md`  
2. `cast.json` (bạn đặt tên hoặc dùng Minh + 6 NPC mẫu)  
3. `path.json` + **~8–12 checkpoint A1 mẫu** (đủ thấy path uốn + divider giả tới A2)  
4. Không cần full 200 story ngay  

### Phase 1 — MVP UI (làm tiếp sau khi confirm plan)
1. Tab Roadmap  
2. Path zigzag + title + level dividers  
3. Detail stub (vocab + 2 copy prompts + 2 textareas + steps + complete)  
4. localStorage progress + ring  

### Phase 2 — Refine sau (bạn sẽ sửa kỹ)
- Full ~58 A1 rồi A2–B2  
- Quiz local, speak optional  
- Export/import  
- Polish animation path / lock rules  

## 6. Quyết định mặc định (để khỏi treo)

| Vấn đề | Default plan |
|--------|----------------|
| Lock tuần tự? | MVP: A1 mở hết; A2+ hiện divider + node disabled đến khi có data |
| Protagonist | `Javi` + Anna, Easter, John, Nathan, Sean |
| First ship content | 1 story A1 demo + dividers A2–B2 (coming soon) |
| Detail fidelity | Stub đủ workflow copy-prompt; quiz sau |

## 7. Out of scope MVP

- Backend / auth / ChatGPT API  
- Generate 200 story text sẵn trong app (chỉ prompt)  
- Neo-brutalist riêng cho Roadmap  
