import { ConsoleLogWriter } from "drizzle-orm"
import { HomescreenItem } from "./homescreenHandler"

type GridPoint = { x: number, y: number }
type GridPlacementList = (GridPoint & { item: HomescreenItem })[]

export class PlacementGrid {
    private _grid: GridPlacementList = []
    private _NUM_COLUMNS: number
    private _NUM_ROWS: number

    constructor(numColumns: number, numRows: number, grid?: GridPlacementList) {
        this._grid = grid ? grid : []
        this._NUM_COLUMNS = numColumns
        this._NUM_ROWS = numRows
    }

    static isSamePoint(a: GridPoint, b: GridPoint): boolean {
        return a.x === b.x && a.y === b.y
    }

    getItemAtPosition(point: GridPoint): (HomescreenItem | undefined) {
        const item = this._grid.find(p => PlacementGrid.isSamePoint(point, p))?.item
        return item;
    }

    addItem(item: HomescreenItem): void {
        for (let i = item.x; i < item.x + item.width; i++) {
            for (let j = item.y; j < item.y + item.height; j++) {
                this.addPoint({ x: i, y: j }, item)
            }
        }
    }

    private addPoint(point: GridPoint, item: HomescreenItem): void {
        const entryFromPlacementGrid = this._grid.find(p => PlacementGrid.isSamePoint(point, p))
        if (!entryFromPlacementGrid) {
            this._grid.push({ x: point.x, y: point.y, item: item })
            return
        }

        if (entryFromPlacementGrid.item.id != item.id) {
            entryFromPlacementGrid.item = item
        }
    }

    getCopyWithItemReplaced(item: HomescreenItem): PlacementGrid {
        const gridWithoutItem = this._grid.filter(point => point.item.id !== item.id).map(point => ({ ...point }))

        const newGrid = new PlacementGrid(this._NUM_COLUMNS, this._NUM_ROWS, [])
        gridWithoutItem.forEach(point => newGrid.addPoint(point, point.item))
        newGrid.addItem(item) // the new item was getting overridden 💀💀💀

        return newGrid
    }

    checkIfSpaceIsFree(point: GridPoint, itemToExclude?: number): boolean {
        if (point.x < 0 || point.y < 0 || point.x >= this._NUM_COLUMNS || point.y >= this._NUM_ROWS) return false
        const valueAtPoint = this.getItemAtPosition(point)

        return !valueAtPoint || (itemToExclude && valueAtPoint.id === itemToExclude)
    }

    checkLeftBorder(variableCoordinate: number, fixedCoordinate: number, size: number, crossSize: number, itemId: number,
        vIsX: boolean,
        offset: number,) {
        const startMain = variableCoordinate - (size - 1)
        const startCross = Math.max(fixedCoordinate + (crossSize - 1), fixedCoordinate - (crossSize - 1))

        let isFree = false
        for (let i = 1; i <= offset; i++) {
            for (let crossCoordinate = startCross; crossCoordinate <= fixedCoordinate; crossCoordinate++) {
                for (let mainCoordinate = startMain - i; mainCoordinate < variableCoordinate; mainCoordinate++) {
                    isFree = (vIsX)
                        ? this.checkIfSpaceIsFree({ x: mainCoordinate, y: crossCoordinate }, itemId)
                        : this.checkIfSpaceIsFree({ x: crossCoordinate, y: mainCoordinate }, itemId)
                    if (!isFree) return false
                }
            }
        }
        return isFree
    }


    checkRightBorder(variableCoordinate: number, fixedCoordinate: number, size: number, crossSize: number, itemId: number,
        vIsX: boolean,
        offset: number,
    ) {
        const startX = (vIsX) ? variableCoordinate + offset : fixedCoordinate
        const startY = (vIsX) ? fixedCoordinate : variableCoordinate + offset
        const width = (vIsX) ? size : crossSize
        const height = (vIsX) ? crossSize : size

        for (let x = startX; x < startX + width; x++) {
            for (let y = startY; y < startY + height; y++) {
                if (!this.checkIfSpaceIsFree({ x, y }, itemId)) {
                    return false
                }
            }
        }
        return true
    }

    checkWithOffset(item: { x: number, y: number, width: number, height: number, id: number }, offset: { x?: number, y?: number }) {
        const itemX = item.x + (offset.x || 0)
        const itemY = item.y + (offset.y || 0)

        for (let x = itemX; x < itemX + item.width; x++) {
            for (let y = itemY; y < itemY + item.height; y++) {
                if (!this.checkIfSpaceIsFree({ x, y }, item.id)) {
                    return false
                }
            }
        }
        return true
    }

    // checkRightBorder(variableCoordinate: number, fixedCoordinate: number, size: number, crossSize: number, itemId: number,
    //     vIsX: boolean,
    //     offset: number,
    // ) {
    //     let isFree = false

    //     for (let i = 1; i <= offset; i++) {
    //         for (let crossCoordinate = fixedCoordinate; crossCoordinate < fixedCoordinate + crossSize; crossCoordinate++) {
    //             for (let mainCoordinate = variableCoordinate + i + (size - 1); mainCoordinate > variableCoordinate; mainCoordinate--) {
    //                 isFree = (vIsX)
    //                     ? this.checkIfSpaceIsFree({ x: mainCoordinate, y: crossCoordinate }, itemId)
    //                     : this.checkIfSpaceIsFree({ x: crossCoordinate, y: mainCoordinate }, itemId)
    //                 if (!isFree) return false
    //             }
    //         }
    //     }
    //     return isFree
    // }
}   