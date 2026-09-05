import React, {createContext, useContext} from "react";
import {SharedValue} from "react-native-reanimated";
import {HS3Folder, Routine, Tile} from "@components/homescreen/types";

/**
 * The central, relatively-stable data both the navigator and every homescreen level
 * need: the whole folder tree, and the tile library. Deliberately doesn't carry
 * tileEvents — those change on every tap and shouldn't force this (widely consumed)
 * context to re-render; components that need events pull them separately.
 */
//an in-flight App-Drawer-tile-onto-homescreen drag: which tile, and where the finger
//currently is (window-absolute coordinates — converted into homescreen-local grid
//coordinates only at drop time, using homescreenAreaBounds below).
export type DragPreview = {
    tile: Tile,
    x: number,
    y: number,
}

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
