import {HS3Element} from "@components/homescreen/3-homescreen/3_homescreenHandler";

type GridPoint = { x: number, y: number }
type GridPlacementList3 = (GridPoint &
    { element: HS3Element }
    )[]

export class PlacementGrid3 {
    private _grid: GridPlacementList3 = []
    private _NUM_COLUMNS: number
    private _NUM_ROWS: number

    constructor(numColumns: number, numRows: number, grid?: GridPlacementList3) {
        this._grid = grid ? grid : []
        this._NUM_COLUMNS = numColumns
        this._NUM_ROWS = numRows
    }

    static isSamePoint(a: GridPoint, b: GridPoint): boolean {
        return a.x === b.x && a.y === b.y
    }

    getElementAtPosition(point: GridPoint): (HS3Element | undefined) {
        const item = this._grid.find(p => PlacementGrid3.isSamePoint(point, p))?.element
        return item;
    }

    addElement(e: HS3Element): void {
        const {layout: {x, y, width, height}} = e

        for (let i = x; i < x + width; i++) {
            for (let j = y; j < y + height; j++) {
                this.addPoint3({x: x, y: j}, e)
            }
        }
    }

    private addPoint3(point: GridPoint, e: HS3Element): void {
        const entryFromGrid =
            this._grid.find(p => PlacementGrid3.isSamePoint(point, p))
        if (!entryFromGrid) {
            this._grid.push({x: point.x, y: point.y, element: e})
            return
        }

        if (entryFromGrid.element != e) {
            entryFromGrid.element = e
        }
    }

    checkIfSpaceIsFree(point: GridPoint, elementToExclude?: HS3Element): boolean {
        if (point.x < 0 || point.y < 0 || point.x >= this._NUM_COLUMNS || point.y >= this._NUM_ROWS) return false
        const valueAtPoint = this.getElementAtPosition(point)

        return !valueAtPoint || (elementToExclude && valueAtPoint === elementToExclude)
    }

    checkIfSpaceIsFreeWorklet(point: GridPoint, elementToExclude?: HS3Element): boolean {
        "worklet"
        if (point.x < 0 || point.y < 0 || point.x >= this._NUM_COLUMNS || point.y >= this._NUM_ROWS) return false
        const valueAtPoint = this.getElementAtPosition(point)

        return !valueAtPoint || (elementToExclude && valueAtPoint === elementToExclude)
    }


    getCopyWithItemReplaced(item: HS3Element): PlacementGrid3 {
        const gridWithoutItem = this._grid.filter(point => point.element !== item).map(point => ({...point}))

        const newGrid = new PlacementGrid3(this._NUM_COLUMNS, this._NUM_ROWS, [])
        gridWithoutItem.forEach(point => newGrid.addPoint3(point, point.element))
        newGrid.addElement(item) // the new item was getting overridden 💀💀💀

        return newGrid
    }

    checkWithOffsetWorklet(element: HS3Element, offset: {
        x?: number,
        y?: number
    }) {
        "worklet"
        const {x, y, width, height} = element.layout
        const itemX = x + (offset.x || 0)
        const itemY = y + (offset.y || 0)

        for (let x = itemX; x < itemX + width; x++) {
            for (let y = itemY; y < itemY + height; y++) {
                if (!this.checkIfSpaceIsFreeWorklet({x, y}, element)) {
                    return false
                }
            }
        }
        return true
    }

    checkWithOffset(element: HS3Element, offset: {
        x?: number,
        y?: number
    }) {
        const {x, y, width, height} = element.layout
        const itemX = x + (offset.x || 0)
        const itemY = y + (offset.y || 0)

        for (let x = itemX; x < itemX + width; x++) {
            for (let y = itemY; y < itemY + height; y++) {
                if (!this.checkIfSpaceIsFree({x, y}, element)) {
                    return false
                }
            }
        }
        return true
    }
}