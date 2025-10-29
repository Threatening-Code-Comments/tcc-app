import { getAllJSDocTagsOfKind } from "typescript";
import { PlacementGrid } from "./placementGrid";

export type PixelValue = number;
export type GridValue = number

export type GridPoint = {
    x: number
    y: number
};

export type GridTile = GridPoint & {
    width: number
    height: number
}

export type PixelPoint = {
    x: number
    y: number
}

export type PixelTile = PixelPoint & {
    width: number
    height: number
}

export type GridPlacementList = PlacementGrid //(GridPoint & { item: HomescreenItem })[]

export type HomescreenItem = GridTile & {
    id: number
}
export type PixelItem = PixelTile & {
    id: number
}