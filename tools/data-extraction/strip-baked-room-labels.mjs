#!/usr/bin/env node
/**
 * Remove the room numbers baked into the LC3 floor-plan artwork where the app now draws
 * its own marker label for the same room.
 *
 * The artwork is a Figma export: every label is outlined text, i.e. one `fill="black"`
 * <path> holding a glyph per subpath. There is no text to read, so a label is matched to
 * a room geometrically — its bounding box against the room's seed point, which is exactly
 * where the marker pin is planted. A label with no pin near it is left alone: the drawing
 * still carries wing headings, seat numbers, and numbers such as 218 that the seed does
 * not model at all.
 *
 * Usage:
 *   node tools/data-extraction/strip-baked-room-labels.mjs                 # report only
 *   node tools/data-extraction/strip-baked-room-labels.mjs --qa out.html   # + QA sheet
 *   node tools/data-extraction/strip-baked-room-labels.mjs --write         # edit the SVGs
 *
 * After --write, copy the printed sha256/bytes into
 * tools/data-extraction/lc3/source/source-manifest.json.
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SEED = join(repoRoot, 'tools/data-extraction/lc3/lc3-locations.seed.json')
const svgPath = (floor) => join(repoRoot, `frontend/public/maps/lc3/floor-${floor}.svg`)

/** Shorter than this is furniture or seat numbering, never a room number. */
const MIN_LABEL_HEIGHT = 5
/**
 * Fallback for rooms with no extracted area (corridor POIs, and the couple of rooms whose
 * seed point falls outside their rect): a number printed by its own door.
 */
const MAX_PIN_DISTANCE = 25

const AREAS = join(repoRoot, 'frontend/src/components/map/roomAreaGeometry.ts')

/**
 * How many closed contours each character of a room number draws, in the artwork font.
 * Counting them turns the outlined text back into something checkable: a labels glyph
 * count must equal what the matched rooms number would draw, or the label is some other
 * text and is left alone. This is what keeps 135/1 on a map whose pin says 135, keeps the
 * 218/* family, and keeps the numbers of rooms the seed models as named POIs.
 */
const CONTOURS = { 0: 2, 1: 1, 2: 1, 3: 1, 4: 2, 5: 1, 6: 2, 7: 1, 8: 3, 9: 2, "/": 1 }

/** Exceptions to the contour gate, should the artwork ever need one. */
const KEEP = []

const expectedContours = (code) =>
  [...code.replace(/^LC3-/, "")].reduce((n, c) => n + (CONTOURS[c] ?? Number.NaN), 0)

const glyphContours = (d) => (d.match(/M/g) ?? []).length

const args = process.argv.slice(2)
const write = args.includes('--write')
const qaIndex = args.indexOf('--qa')
const qaPath = qaIndex === -1 ? null : args[qaIndex + 1]
const floorArg = args.indexOf('--floor')
const floors = floorArg === -1 ? [1, 2] : [Number(args[floorArg + 1])]

const seed = JSON.parse(readFileSync(SEED, 'utf8')).records

/** Bounding box of a path, which the Figma export writes with absolute commands only. */
function pathBox(d) {
  if (/[mlhvcsqtaz]/.test(d)) throw new Error('relative path command: bbox maths assumes absolute')
  const xs = []
  const ys = []
  let cx = 0
  let cy = 0
  for (const [, cmd, rest] of d.matchAll(/([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/g)) {
    const n = (rest.match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? []).map(Number)
    if (cmd === 'H') n.forEach((v) => (xs.push((cx = v)), ys.push(cy)))
    else if (cmd === 'V') n.forEach((v) => (ys.push((cy = v)), xs.push(cx)))
    else if (cmd !== 'Z') for (let i = 0; i + 1 < n.length; i += 2) xs.push((cx = n[i])), ys.push((cy = n[i + 1]))
  }
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
}

const rounded = (box) => [box.x, box.y, box.w, box.h].map(Math.round)
const isKept = (floor, box) =>
  KEEP.some((k) => k.floor === floor && k.bbox.every((v, i) => v === rounded(box)[i]))

/** Room rectangles from the generated area geometry, keyed by location id. */
function roomAreas() {
  const src = readFileSync(AREAS, 'utf8')
  const areas = new Map()
  for (const [, id, floor, x, y, w, h] of src.matchAll(
    /'([^']+)': \{ floor: (\d+), x: ([\d.-]+), y: ([\d.-]+), width: ([\d.-]+), height: ([\d.-]+) \}/g
  )) {
    areas.set(id, { floor: Number(floor), x: Number(x), y: Number(y), w: Number(w), h: Number(h) })
  }
  return areas
}

/** Every baked label of the floor, paired with the room it belongs to. */
function collect(floor, areas) {
  const svg = readFileSync(svgPath(floor), 'utf8')
  const rooms = seed
    .filter((r) => r.floor === floor)
    .map((r) => ({ id: r.location_id, label: r.room_code || r.name_th, x: r.x, y: r.y, area: areas.get(r.location_id) }))

  const labels = []
  for (const match of svg.matchAll(/<path\b[^>]*>/g)) {
    const raw = match[0]
    if (!/fill="black"/.test(raw)) continue
    const d = raw.match(/ d="([^"]*)"/)?.[1] ?? ''
    const box = pathBox(d)
    const mx = box.x + box.w / 2
    const my = box.y + box.h / 2
    const withDist = rooms
      .map((r) => ({ ...r, dist: Math.hypot(r.x - mx, r.y - my) }))
      .sort((a, b) => a.dist - b.dist)
    // A number is printed inside its own room, so containment beats proximity: on floor 2
    // the numbers sit mid-room while the pin sits on the door, tens of units away.
    const inside = withDist.find(
      (r) => r.area && mx >= r.area.x && mx <= r.area.x + r.area.w && my >= r.area.y && my <= r.area.y + r.area.h
    )
    labels.push({ raw, d, box, near: inside ?? withDist[0], matchedBy: inside ? 'area' : 'distance' })
  }

  // Every label in the room that draws the room number goes: the artwork repeats it, for
  // instance room 241 has one by the door and one in the middle of the hall. A label whose
  // glyphs do not match is a subdivision or some other text, so it stays.
  const remove = []
  const mismatched = []
  const perRoom = new Map()
  for (const label of labels) {
    if (label.box.h < MIN_LABEL_HEIGHT) continue
    if (label.matchedBy === 'distance' && label.near.dist > MAX_PIN_DISTANCE) continue
    if (isKept(floor, label.box)) continue
    if (glyphContours(label.d) !== expectedContours(label.near.label)) {
      mismatched.push(label)
      continue
    }
    remove.push(label)
    perRoom.set(label.near.label, (perRoom.get(label.near.label) ?? 0) + 1)
  }

  for (const [room, count] of perRoom) {
    if (count > 1) console.log(`  note: ${room} has ${count} copies of its number in the artwork`)
  }

  return { svg, labels, mismatched, remove }
}

const areas = roomAreas()
const sheets = []
for (const floor of floors) {
  const { svg, labels, mismatched, remove } = collect(floor, areas)
  console.log(`\n== floor ${floor}: ${labels.length} baked labels, removing ${remove.length}`)
  for (const label of remove.sort((a, b) => a.near.label.localeCompare(b.near.label))) {
    const [x, y, w, h] = rounded(label.box)
    console.log(`  ${label.near.label.padEnd(24)} bbox ${x},${y} ${w}x${h}  dist ${label.near.dist.toFixed(1)}`)
  }

  for (const label of mismatched) {
    const [x, y, w, h] = rounded(label.box)
    console.log(
      Number.isNaN(expectedContours(label.near.label))
        ? `  kept: bbox ${x},${y} ${w}x${h} — sits in ${label.near.label}, a POI whose pin shows a name, not this number`
        : `  kept (text is not ${label.near.label}): bbox ${x},${y} ${w}x${h} — ${glyphContours(label.d)} contours, that number draws ${expectedContours(label.near.label)}`
    )
  }

  const kept = labels.filter((l) => !remove.includes(l))
  console.log(`  keeping ${kept.length} (headings, seat numbers, labels with no pin)`)

  if (qaPath) sheets.push({ floor, remove, kept })

  if (write) {
    let next = svg
    for (const label of remove) {
      if (!next.includes(label.raw)) throw new Error(`path no longer unique on floor ${floor}`)
      next = next.replace(label.raw, '')
    }
    writeFileSync(svgPath(floor), next)
    const bytes = Buffer.byteLength(next)
    console.log(`  written: bytes ${bytes} sha256 ${createHash('sha256').update(next).digest('hex')}`)
  }
}

if (qaPath) {
  const crop = (label, fill) => {
    const { x, y, w, h } = label.box
    const pad = 2
    return `<figure><svg viewBox="${x - pad} ${y - pad} ${w + pad * 2} ${h + pad * 2}" height="28"><path d="${label.d}" fill="${fill}"/></svg><figcaption>${label.near.label} · ${label.near.dist.toFixed(0)}</figcaption></figure>`
  }
  const body = sheets
    .map(
      ({ floor, remove, kept }) => `<h2>floor ${floor} — removing ${remove.length}</h2><div class="grid">${remove
        .map((l) => crop(l, '#b91c1c'))
        .join('')}</div><h2>floor ${floor} — keeping ${kept.length}</h2><div class="grid">${kept
        .map((l) => crop(l, '#334155'))
        .join('')}</div>`
    )
    .join('')
  writeFileSync(
    qaPath,
    `<meta charset="utf-8"><title>baked label QA</title><style>body{font:13px system-ui;padding:16px}.grid{display:flex;flex-wrap:wrap;gap:10px}figure{margin:0;border:1px solid #cbd5e1;border-radius:6px;padding:4px 6px;text-align:center}figcaption{font-size:11px;color:#64748b}</style>${body}`
  )
  console.log(`\nQA sheet: ${qaPath}`)
}
