# A1 — tổ chức từ vựng & data

Level đầu tiên của Roadmap. **~902 entry** từ *The Oxford 3000 by CEFR level*.

Folder này sẽ chứa toàn bộ data A1 dùng cho checkpoint (story/lesson). Hiện chỉ mô tả convention — chưa có file vocab.

## Mục tiêu data trong `a1/`

Khi đủ dữ liệu, folder nên chứa:

```
a1/
├── README.md                 ← file này
├── words.json                ← (sau) toàn bộ lemma A1 đã normalize từ PDF
├── topics/
│   ├── food-drink.json       ← list từ + meta topic
│   ├── people-family.json
│   └── …
└── checkpoints/
    ├── a1-food-drink-01.json ← 1 story/node trên roadmap
    └── …
```

Có thể gộp `topics/` + `checkpoints/` thành 1 file `curriculum.json` nếu muốn đơn giản hơn — miễn là UI đọc được.

## `words.json` (dự kiến)

Mỗi item tối thiểu:

```json
{
  "lemma": "apple",
  "pos": ["n"],
  "cefr": "a1",
  "topics": ["food-drink"],
  "raw": "apple n."
}
```

Optional sau: meaning, example, collocations (không bắt buộc MVP).

## `topics/*.json` (dự kiến)

```json
{
  "id": "food-drink",
  "level": "a1",
  "name": "Food & drink",
  "description": "Meals, ingredients, ordering, likes/dislikes.",
  "words": ["apple", "bread", "breakfast", "buy", "coffee"]
}
```

Topic A1 nên ưu tiên (xem thêm root README):

- `people-family`
- `home-daily`
- `food-drink`
- `body-health`
- `clothes-shopping`
- `time-calendar`
- `school-study`
- `travel-places`
- `transport`
- `hobbies-free-time`
- `feelings-opinions`
- `social-phrases`

## `checkpoints/*.json` (dự kiến)

Mỗi file = **1 node** trên roadmap (theo `docs/idea/ROADMAP.md`):

```json
{
  "id": "a1-food-drink-01",
  "level": "a1",
  "topic": "food-drink",
  "title": "Breakfast at the cafe",
  "order": 1,
  "vocab": ["breakfast", "cafe", "coffee", "bread", "buy", "delicious"],
  "storyPromptNotes": "Short A1 story; use target words naturally."
}
```

Rule nhỏ:

- ~56 từ / checkpoint (1 chương ngắn thú vị; pack gộp topic nhỏ).
- Topic lớn → nhiều checkpoint (`01`, `02`, …) theo size pack.
- `order` tăng dần trong cùng level (để vẽ path).

## Cách thêm data (thủ công hoặc script)

1. Lấy entry `cefr === "a1"` từ bản convert PDF (khi có).
2. Gán `topics[]` (1 từ có thể nhiều topic).
3. Cắt subset vào checkpoint; viết title story ngắn.
4. Chưa cần quiz/meaning ngay — MVP chỉ cần vocab list + copy-ready story prompt.

## Status hiện tại

- [x] Folder `a1/` + convention README  
- [ ] `words.json` từ PDF  
- [ ] Topic files  
- [ ] Checkpoint files  
- [ ] Tab Roadmap đọc data này  
