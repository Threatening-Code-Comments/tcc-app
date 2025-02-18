import { HomescreenItem } from "@app/components/homescreen/homescreenHandler";
import { GRID_COLUMNS, GRID_ROWS, makeSpaceForItem } from "@app/components/homescreen/move_algo";
import { PlacementGrid } from "@app/components/homescreen/placementGrid";


const item1 = { id: 1, x: 2, y: 1, width: 1, height: 1 } // static object
const item3 = { id: 3, x: 3, y: 1, width: 1, height: 1 } // object that collides

const getPlacementGridWithItems = (items: HomescreenItem[]): PlacementGrid => {
    const placementGrid = new PlacementGrid(GRID_COLUMNS, GRID_ROWS)
    for (const item of items)
        placementGrid.addItem(item)

    return placementGrid
}

const getItem = ({ x, y, id = 1, w = 1, toPixel: toPixel = false }: { x: number, y: number, id?: number, w?: number, toPixel?: boolean }) =>
    toPixel
        ? ({ height: 92.57142857142858, id: id, width: 93.57142857142858 * w, x: 93.57142857142858 * x, y: 93.57142857142858 * y })
        : ({ height: 1, id: id, width: w, x: x, y: y })

const movedItem = getItem({ ...item1, id: 3, toPixel: true })

describe('Move-Algo directions', () => {
    it('moves left correctly', () => {
        const placementGrid = getPlacementGridWithItems([item1, item3])

        const res = makeSpaceForItem(movedItem, { x: 231, y: 80 }, placementGrid)
        expect(res).toEqual([{ ...item1, x: item1.x - 1 }])
    })
    it('moves right correctly', () => {
        const placementGrid = getPlacementGridWithItems([item1, { ...item3, x: 1, y: 1 }])

        const res = makeSpaceForItem(movedItem, { x: 139, y: 94 }, placementGrid)
        expect(res).toEqual([{ ...item1, x: item1.x + 1 }])
    })
    it('moves up correctly', () => {
        const placementGrid = getPlacementGridWithItems([item1, { ...item3, x: 2, y: 2 }])

        const res = makeSpaceForItem(movedItem, { x: 191, y: 134 }, placementGrid)
        expect(res).toEqual([{ ...item1, y: item1.y - 1 }])
    })
    it('moves down correctly', () => {
        const placementGrid = getPlacementGridWithItems([item1, { ...item3, x: 2, y: 0 }])

        const res = makeSpaceForItem(movedItem, { x: 193, y: 48 }, placementGrid)
        expect(res).toEqual([{ ...item1, y: item1.y + 1 }])
    })
})