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
2. ✅ **App Drawer rebuild.** Real tiles from the library, grouped by routine (one level —
   "flat" meant no *nested* sub-folders, not zero grouping; with hundreds of tiles a
   grouping level is needed, per the prod-app Pages→Routines→Tiles screenshots). Routines
   show as a flat grid of tappable "folders" at the top level; tapping one navigates into
   it to show just that routine's tiles (a small back row to return), rather than every
   routine's tiles expanded inline at once. Typing a search query ignores this navigation
   and flattens across every routine, standing in for the Pages-level "quick access" the
   prod app has — still an open question whether that's enough or Pages need their own
   equivalent later. Mock data now includes a small `routinesFromDb` (Konsum, Diabetes,
   Haushalt) with tiles spread across them plus a couple left uncategorized, to actually
   exercise the grouping instead of everything sitting in one bucket.
   `HomescreenDataProvider` moved up into `homescreenTempWrapper.tsx` (new
   `useHomescreenLibraryData` hook, now also loading `routines`) so App Drawer and the
   navigator can both reach it as peers — it used to live inside `navigator.tsx`, which
   left App Drawer with no way to reach `tiles` at all.
   Re: the "drawer only shows the search bar, nothing renders" report — found and fixed.
   Three real, separate issues, in the order they were found: (1) `.claude/worktrees/*` are
   full repo checkouts with no `metro.config.js` excluding them, and one worktree happened
   to have a file at the exact same relative path as `AppDrawer.tsx` — a project-wide risk,
   fixed once via `metro.config.js`/`.watchmanconfig`, unrelated to this bug specifically.
   (2) The `ScrollView` around the tile grid had no `style` at all — fixed with
   `flex: 1`, though this alone didn't fully explain it either. (3) The actual root cause,
   found via loud debug borders on every layout layer: `react-native-paper`'s `Card` wasn't
   passing usable flex height to its children at all (a `flex: 1` child inside it rendered
   at ~0px regardless of what it contained) — swapped `Card` for a plain `View` (background
   + `elevation` for the same look) and the whole thing rendered correctly immediately.
   Worth remembering for any future bottom-sheet-style UI in this app: don't nest flex
   layouts inside Paper's `Card`.
   Still no drag-out — that's step 3.
3. ✅ **Drag from App Drawer onto Homescreen.** Places a new 1x1 item referencing the
   dragged tile. AppDrawer and the homescreen area are siblings, not parent/child, so this
   needed its own small bridge in `homescreen-data-context.tsx` (`dragPreview` — which
   tile + current finger position; `homescreenAreaBounds` — the shared coordinate origin,
   measured once via `measureInWindow`) rather than reusing Homescreen's existing per-level
   `useHomescreenDragAndDrop`, which is tightly coupled to one Homescreen instance's own
   collision/folder-hover preview system. A new `DragPreviewOverlay` shows the floating
   tile following the finger.
   v1 scope: only drops onto the **root level** — a folder open in the popup isn't a drop
   target yet (would need that popup's own `currentLevel` threaded into the same bridge).
   Also no collision-preview/folder-hover feedback during the drag itself like the native
   in-homescreen drag has — it just finds a free cell (or the nearest one via
   `calculateNextPositionInFolder`) on drop. Both worth revisiting if this becomes a
   heavily-used path rather than an occasional one.
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
