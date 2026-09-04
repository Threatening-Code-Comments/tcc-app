# Homescreen — Intended Behavior

Conceptual spec: what the homescreen should do, from a user's/product perspective —
not how the current code does it. This is meant to stay readable and largely stable
across refactors, so it deliberately avoids referencing files, functions, or variable
names; implementation-level notes belong in conversation history, not here.

## Context

This version of the Homescreen, with primitive items and no persistence, is intended as a way to finish
the UX and animations before actually re-adding the complexity of the actual tiles etc back.

Previously, there used to be a flat 'Page->Routine->Tile' layout, with tiles being the data bearing
elements, which can be tapped to cause an event with a timestamp.
In the future, pages/routines aren't supposed to directly transfer, the way it worked was as a
very static way to organize tiles.
This will be replaced by an app library for that purpose, and the homescreen is basically what
used to be the dashboard; a user editable view for quick access.
A tile from the app library should be able to be placed on multiple places on the homescreen,
most of the time for having different instances in folders. The 'central' / 'global'
tile does house the color, name, data etc, and the homescreen-items containing that tile can be
placed and sized independently.

An example would be having caffeinated drinks in the folders [food, well-being, treats]
(very rough example).

Back to the current iteration of the homescreen.

## Data model

Two related but distinct concepts, kept separate on purpose even though today one of them
is basically a stand-in for the other:

- A **homescreen-item** is the placeable unit on the homescreen grid: it has a
  position/size within its folder, and (for now) also a name and color. It's the thing you
  drag, resize, and tap.
- A **tile** is the data-bearing content from the app library (name, color, its own data,
  the action a tap performs) — not built yet. Once it exists, a homescreen-item becomes
  effectively invisible: just a position/size + a reference to a tile, and the same tile can
  be referenced by multiple items in different folders (e.g. the same "coffee" tile placed
  once in [food], once in [well-being]). Name/color will then live on the tile, not the item.
- A **folder** groups homescreen-items (and other folders) together, has its own name and
  color, and itself occupies a position/size on its parent's grid — so folders nest.
- The homescreen's root is just "no folder selected" — there is no separate concept for it.
- Every homescreen-item/folder gets its color assigned once when it's created, and that
  color sticks with it — it never changes on its own. (Once tiles exist, this becomes the
  tile's color instead.)

## Navigation

- You're always "inside" some folder, or at the root if you haven't entered one.
- Tapping a folder takes you inside it, showing its contents.
- A breadcrumb trail (Home / … / current folder) is shown whenever you're not at the root,
  and lets you jump directly back to any ancestor folder.
- A back button (and the device's hardware back button) takes you up exactly one level.

## Drag & drop

- Homescreen-items and folders can be picked up and dragged around freely within their
  current level.
- While dragging, the dragged element previews at its snapped target position on the grid.
- If dragging one item/folder onto another makes them overlap, the thing underneath should
  get out of the way rather than just being covered — the drag makes room instead of
  silently colliding.
- If you drag something roughly *on top of* another item (rather than just nudging past it),
  that's a request to combine them:
  - dragging one item onto another item always creates a new folder containing both;
  - dragging something onto an existing folder is ambiguous — it could mean "move this into
    the folder" or "make a new folder combining this with the target folder". A small
    popover near the target always shows both options with one of them highlighted as
    currently selected (there's always exactly one active choice, never neither); which one
    is highlighted depends on which side of the target you're currently hovering over, and
    whichever is highlighted when you let go is what happens.
- Whether a drop is currently possible should be visible *while dragging*, before you let
  go (e.g. the target/preview signals it won't work). Letting go on an impossible spot
  (off-grid, or no room to make space) simply rejects the drop — nothing changes. There's no
  guarantee the system will always find a way to make something fit; a crowded layout can
  legitimately refuse a drop.

## Resize

- In edit mode, every homescreen-item/folder can be resized from any of its four edges.
- Resizing follows the same accept/reject rules as dragging: a resize that would end up
  somewhere invalid is rejected the same way an invalid drop is, not treated differently.

## Creating items & folders

- A "+" action reveals the option to create either a new homescreen-item or a new folder.
- Creating an item: name it, then place it on the grid. (Once the app library exists, this
  becomes "pick a tile from the library, then place it".)
- Creating a folder should work the same way (name it, place it) — independent of the
  drag-two-things-together shortcut described above, which is a secondary/faster way to
  create a folder, not the only way.

## Interacting with an item/folder

- Tapping a folder navigates into it.
- Tapping an item does something with its own content/action (not homescreen-level — this
  is where the tile's behavior would live once tiles exist).
- A longer press on an item brings up quick info/actions for it, without navigating away
  from the homescreen.

## Edit mode

- The homescreen has two modes: a "browsing" mode (tap things, view things) and an "edit"
  mode (drag things around, resize them).
- A long press on empty space toggles between the two, with a visual indication (e.g. a
  tinted background) of which mode you're in.
- What's available in each mode should be mutually exclusive enough that you don't
  accidentally start rearranging your homescreen while just trying to use it, and vice versa.
