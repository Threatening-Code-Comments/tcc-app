import React, {createContext, MutableRefObject, useContext} from "react";
import {SharedValue} from "react-native-reanimated";
import {HS3Folder, Routine, Tile} from "@components/homescreen/types";

/**
 * The central, relatively-stable data both the navigator and every homescreen level
 * need: the whole folder tree, and the tile library. Deliberately doesn't carry
 * tileEvents — those change on every tap and shouldn't force this (widely consumed)
 * context to re-render; components that need events pull them separately.
 */
//an in-flight App-Drawer-tile-onto-homescreen drag: which tile, and where the finger
//currently is (window-absolute coordinates — the root Homescreen converts them into its
//own local coordinates via homescreenAreaBounds below, and runs its normal drag with them).
export type DragPreview = {
    tile: Tile,
    x: number,
    y: number,
}

//hands an App Drawer drop to the root Homescreen, which owns the drag it resolves into.
//`cancelled` = dropped on the cancel bar / off the homescreen. Returns whether the tile
//actually got placed.
export type AppDrawerDropHandler = (cancelled: boolean) => boolean

export type HomescreenDataValue = {
    folders: SharedValue<HS3Folder[]>,
    tiles: SharedValue<Tile[]>,
    routines: SharedValue<Routine[]>,
    //the App-Drawer-drag-onto-homescreen bridge: AppDrawer and the Homescreen area are
    //siblings (not parent/child), so this is how a drag started in one reaches the other.
    dragPreview: SharedValue<DragPreview | undefined>,
    //window-absolute bounds of the view that hosts both the homescreen and the App Drawer
    //— the shared coordinate origin a cross-drag's absolute drop point gets converted
    //against (homescreen item positions are already relative to this same origin).
    homescreenAreaBounds: SharedValue<{ x: number, y: number, width: number, height: number } | undefined>,
    //registered by the root Homescreen, called by the App Drawer when its drag ends
    appDrawerDrop: MutableRefObject<AppDrawerDropHandler | undefined>,
}

const HomescreenDataContext = createContext<HomescreenDataValue | undefined>(undefined)

export const HomescreenDataProvider = HomescreenDataContext.Provider

export function useHomescreenData(): HomescreenDataValue {
    const ctx = useContext(HomescreenDataContext)
    if (!ctx) throw new Error("useHomescreenData must be used within a HomescreenDataProvider")
    return ctx
}

export function getTileById(tiles: Tile[], tileId: number): Tile | undefined {
    return tiles.find(t => t.id === tileId)
}
