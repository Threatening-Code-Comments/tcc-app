import { Dimensions } from "react-native";
import { PixelTile, PixelPoint, GridPoint, GridTile, HomescreenItem } from "./homescreenHandler"
import { PlacementGrid } from "./placementGrid"

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions?.get('window') ?? { width: 1080, height: 2400 };
export const GRID_COLUMNS = 4;
export const GRID_ROWS = 5;
export const GRID_UNIT = Math.min((SCREEN_WIDTH * 0.9) / GRID_COLUMNS, SCREEN_HEIGHT / GRID_ROWS);

export const snapPxToGridAsPx = (value: number) => {
    "worklet"
    return Math.round(value / GRID_UNIT) * GRID_UNIT;
}
export const pxToGrid = (value: number) => {
    return Math.round(value / GRID_UNIT);
}
export const gridToPx = (value: number) => {
    return value * GRID_UNIT;
}

export const pixelToGrid = (pixel: PixelPoint) => ({ x: pxToGrid(pixel.x), y: pxToGrid(pixel.y) })

const getPointsOfTile = (tile: PixelTile | GridTile, isPixelTile: boolean) => {
    const movedItemToCoordinate = isPixelTile ? pixelToGrid(tile) : tile
    const width = isPixelTile ? pxToGrid(tile.width) : tile.width
    const height = isPixelTile ? pxToGrid(tile.height) : tile.height

    const movedItemPoints: GridPoint[] = []
    for (let i = movedItemToCoordinate.x; i < movedItemToCoordinate.x + Math.max(1, width); i++) {
        for (let j = movedItemToCoordinate.y; j < movedItemToCoordinate.y + Math.max(1, height); j++) {
            movedItemPoints.push({ x: i, y: j })
        }
    }
    return movedItemPoints
}

export const makeSpaceForItem = (movedItem: PixelTile & { id: number }, contactPoint: PixelPoint, placementGrid: PlacementGrid) => {
    console.log("input: ", { movedItem, contactPoint, placementGrid })

    let tempTempItems = []
    const movedItemPoints = getPointsOfTile(movedItem, true)

    const blockingItemsTemp = movedItemPoints
        .map((point) => placementGrid.getItemAtPosition(point))
        .filter((entry) => entry && entry.id !== movedItem.id)

    //if no items are blocking:
    if (blockingItemsTemp.length === 0) {
        // setTempItems([])
        return []
    }

    const movedItemToCoordinate = pixelToGrid(movedItem)
    const movedPlacementGrid = placementGrid.getCopyWithItemReplaced({
        id: movedItem.id,
        ...movedItemToCoordinate,
        width: pxToGrid(movedItem.width),
        height: pxToGrid(movedItem.height)
    })

    for (let item of blockingItemsTemp) {
        const itemPoints = getPointsOfTile(item, false)
        const itemX = gridToPx(item.x)
        const itemY = gridToPx(item.y)
        const itemWidth = gridToPx(item.width)
        const itemHeight = gridToPx(item.height)

        const xDiff = ((contactPoint.x < itemX) ? 1 : -1) * Math.abs(contactPoint.x - itemX);
        const yDiff = ((contactPoint.y < itemY) ? -1 : 1) * Math.abs(contactPoint.y - itemY);

        const intersectingPoints = itemPoints.filter(p => movedItemPoints.some(p2 => PlacementGrid.isSamePoint(p, p2)))
        const intersectionSizeX = new Set(intersectingPoints.map(p => p.x)).size
        const intersectionSizeY = new Set(intersectingPoints.map(p => p.y)).size

        const intersectionMinX = itemPoints.reduce((prev, cur) => Math.min(prev, cur.x), Number.MAX_VALUE)
        const intersectionMinY = itemPoints.reduce((prev, cur) => Math.min(prev, cur.y), Number.MAX_VALUE)

        const checkLeft = () => movedPlacementGrid.checkLeftBorder(intersectionMinX, item.y, item.width, item.height, item.id, true, intersectionSizeX);
        const checkUp = () => movedPlacementGrid.checkLeftBorder(intersectionMinY, item.x, item.height, item.width, item.id, false, intersectionSizeY);
        const checkRight = () => movedPlacementGrid.checkRightBorder(intersectionMinX, item.y, item.width, item.height, item.id, true, intersectionSizeX);
        const checkDown = () => movedPlacementGrid.checkRightBorder(intersectionMinY, item.x, item.height, item.width, item.id, false, intersectionSizeY);

        const checkAll = () => {
            const left = checkLeft()
            const right = checkRight()
            const up = checkUp()
            const down = checkDown()

            return {
                left: left, up: up,
                right: right, down: down
            }
        }

        const getPreferredDirection = () => {
            const checks = checkAll()

            const checkHorizontal = (tryPrimary: boolean) => {
                const primary = xDiff > 0 ? checks.right : checks.left
                const secondary = xDiff > 0 ? checks.left : checks.right

                if (tryPrimary && primary) {
                    const sign = xDiff > 0 ? 1 : -1

                    return { x: sign * intersectionSizeX, y: 0 }
                } else if (secondary) {
                    const sign = xDiff > 0 ? -1 : 1

                    return { x: sign * intersectionSizeX, y: 0 }
                }
            }

            const checkVertical = (tryPrimary: boolean) => {
                const primary = yDiff > 0 ? checks.up : checks.down
                const secondary = yDiff > 0 ? checks.down : checks.up

                if (tryPrimary && primary) {
                    const sign = yDiff > 0 ? -1 : 1
                    console.log({ sign, intersectionSizeY })

                    return { x: 0, y: sign * intersectionSizeY }
                } else if (secondary) {
                    const sign = yDiff > 0 ? 1 : -1

                    return { x: 0, y: sign * intersectionSizeY }
                }
            }

            if (Math.abs(xDiff) > Math.abs(yDiff)) {
                const horizontal = checkHorizontal(true)
                if (horizontal) return horizontal
            } else {
                const vertical = checkVertical(true)
                if (vertical) return vertical
            }

            const horizontal = checkHorizontal(false)
            if (horizontal) return horizontal

            const vertical = checkVertical(false)
            if (vertical) return vertical

            console.error("No direction found (getPreferredDirection)")
            return { x: 0, y: 0 }
        }

        // tempTempItems = tempTempItems.map(tempItem => {

        const dir = getPreferredDirection()
        const newItem = {
            ...item,
            x: item.x + dir.x,
            y: item.y + dir.y
        }

        tempTempItems = [
            ...tempTempItems.filter(i => i.id !== item.id && blockingItemsTemp.some(b => b.id === i.id)),
            newItem
        ]
    }

    // console.log("output: ", tempTempItems)
    return tempTempItems
}