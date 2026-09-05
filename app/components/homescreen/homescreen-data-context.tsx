import React, {createContext, useContext} from "react";
import {SharedValue} from "react-native-reanimated";
import {HS3Folder, Routine, Tile} from "@components/homescreen/types";

/**
 * The central, relatively-stable data both the navigator and every homescreen level
 * need: the whole folder tree, and the tile library. Deliberately doesn't carry
 * tileEvents — those change on every tap and shouldn't force this (widely consumed)
 * context to re-render; components that need events pull them separately.
 */
export type HomescreenDataValue = {
    folders: SharedValue<HS3Folder[]>,
    tiles: SharedValue<Tile[]>,
    routines: SharedValue<Routine[]>,
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
