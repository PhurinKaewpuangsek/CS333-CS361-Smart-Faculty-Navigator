# 📸 LC3 Survey Photos

Drop all on-site schedule photos taken from room doors in this folder.

## Naming Convention

Use this pattern so it's clear which room and floor each photo belongs to:

```
lc3-f<floor>-<room_code>-<sequence>.jpg
```

Examples:
```
lc3-f1-103-01.jpg          ← Floor 1, Room 103, first photo
lc3-f1-101_1-01.jpg        ← Floor 1, Room 101/1 (use underscore for the slash)
lc3-f2-230-01.jpg          ← Floor 2, Room 230
lc3-f2-230-02.jpg          ← Second angle of the same board
```

## Rules

- **Any image format is fine:** `.jpg`, `.jpeg`, `.png`, `.heic`
- **Include multiple angles** if a schedule board is large or partially obscured.
- **Do NOT edit or crop** the photos — keep originals as evidence.
- These files will be referenced in the Pull Request for Issue #47 as field evidence.

## After Dropping Photos

Tell the teammate doing data entry which rooms each photo covers so they can key
the data into `../lc3-schedules.seed.csv`.

Then validate:
```bash
node --test tools/data-extraction/validate-lc3-seed.mjs
```

