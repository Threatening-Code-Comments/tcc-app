# Homescreen Roadmap

Living doc for what's planned next — product direction + rough sequencing, not a spec.
See `BEHAVIOR.md` for intended UX behavior. Update this as direction changes; don't let
it go stale.

## Near-term sequence

1. ✅ **Tile vs. homescreen-item data model split.** Done — `HS3Item` now just holds
   `tileId` + placement (layout/parentId), the real `Tile`/`TileEvent` types from
   `@app/constants/DbTypes` are reused as-is (not a new parallel type), `rootRoutineId`
   keeps its exact field name but is repurposed as "App Drawer folder" (currently `0` =
   uncategorized everywhere, since App Drawer browsing doesn't exist yet — that's step 2).
   New `homescreen-data-context.tsx` carries `{folders, tiles}` centrally; `tileEvents`
   deliberately excluded from it (changes per-tap, shouldn't force re-renders). Still mock
   data (`db-mock.ts`) — no real DB wired up yet, that's step 5.
2. **App Drawer rebuild**, against the new split model, still mock data. Currently a stub
   (`AppDrawer.tsx`) — wrong type (`HomescreenItem`, the legacy grid-algorithm type, not
   `HS3Item`), no styling, no drag, hardcoded item list. Search + flat list, no nested
   folders in the drawer itself (the homescreen already has folders for spatial
   organization — a second hierarchy in the drawer would be redundant).
3. **Drag from App Drawer onto Homescreen** — places a new item referencing an existing
   tile.
4. **Creation flow decision** (see below) — implement once 1–3 exist to build on.
5. **Real persistence + `.db` import**, only now. Wiring the exported prod DB
   (`local-data/`, gitignored) becomes a mechanical "swap the data source" step once the
   model/UX is proven, instead of a decision that constrains UX work while it's still in
   flux — matches `BEHAVIOR.md`'s own stated intent (UX/structure before real data).

## Creation flow — decided direction

Not either/or, two entry points for two different needs:

- **"+" on Homescreen stays the default way to make a brand new tile** (today's
  drag-out-a-rectangle flow, extended to also register the tile in the library — every
  tile has to exist there). This is the low-friction path for "I'm here, I need something
  new" — the common case.
- **"+" should also offer "place an existing tile"** (search the library, then position
  it like today's create-layout-overlay) — needed for the "same tile in multiple folders"
  case (BEHAVIOR.md's caffeinated-drinks-in-3-folders example), which creating-new can't
  express at all.
- App Drawer itself doesn't need its own creation UI for v1 — drag-out is enough; a
  second creation entry point there would just be a duplicate of Homescreen's "+".

## Outlook (further out, not sequenced yet)

- Item slots: more categories, basic evaluations/stats beyond raw totals.
- Tile info popup: configure item slots from here; a graph of events over time; a
  button/rule for when the on-tile counter resets (prod app currently only shows total
  count — total vs. "last 7 days" are genuinely different priorities depending on the
  tile).
- (more to come — add here as it surfaces, don't lose it in chat history)
