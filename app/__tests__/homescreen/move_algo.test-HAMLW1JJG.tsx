import { GRID_COLUMNS, GRID_ROWS, makeSpaceForItem } from '@components/homescreen/move_algo'
import { HomescreenItem } from "@app/components/homescreen/homescreenHandler";
import { PlacementGrid } from '@app/components/homescreen/placementGrid';


// Tests to add:
// check moving items:
// - 3 auf 1
// 	- tempItems: 1 einen runter
// - 2 auf 1
// 	- tempItems: 1 einen runter


// - 1 auf 2
// 	- tempItems: 2 einen nach rechts
// - 3 auf 2l
// 	- tempItems: 2 einen rechts / runter
// - 3 auf 2r
// 	- tempItems: 2 einen runter


// - 2 auf 3
// 	- tempItems: 3 rechts / runter

const item1 = { id: 1, x: 0, y: 0, width: 1, height: 1 }
const item2 = { id: 2, x: 1, y: 0, width: 2, height: 1 }
const item3 = { id: 3, x: 2, y: 1, width: 1, height: 1 }
const mockItems: HomescreenItem[] = [
    item1,
    item2,
    item3,
];

const getPlacementGridWithItems = (items: HomescreenItem[]): PlacementGrid => {
    const placementGrid = new PlacementGrid(GRID_COLUMNS, GRID_ROWS)
    for (const item of mockItems)
        placementGrid.addItem(item)
    return placementGrid
}

const getItem = ({ x, y, id = 1, w = 1, isPixel = false }: { x: number, y: number, id?: number, w?: number, isPixel?: boolean }) =>
    isPixel
        ? ({ height: 92.57142857142858, id: id, width: 93.57142857142858 * w, x: 93.57142857142858 * x, y: 93.57142857142858 * y })
        : ({ height: 1, id: id, width: w, x: x, y: y })

describe('Move-Algo', () => {
    // it('should run', () => { }),
    it('moves 1 for 3 correctly | (0,0) one down', () => {
        const movedItem = getItem({ x: 0, y: 0, id: 3, isPixel: true }) // moves Item 3 on top of 1 (0,0) =>{id:3,x:0,y:0...}
        const placementGrid = getPlacementGridWithItems(mockItems) // create placement grid (other situation commented below)

        const res = makeSpaceForItem(movedItem, { x: 17.93, y: 42.3 }, placementGrid) // evaluates collisions with Item 3, should return {id:1,x:0,y:+=1...}
        expect(res).toEqual([{ ...item1, y: item1.y + 1 }]) // expect item 1 to be moved one down
    }),
        it('moves 1 for 2 correctly | (0,0) one down', () => {
            const movedItem = getItem({ x: 0, y: 0, id: 2, w: 2, isPixel: true })
            const placementGrid = getPlacementGridWithItems(mockItems)

            const res = makeSpaceForItem(movedItem, { x: 43.5, y: 3.2 }, placementGrid)
            expect(res).toEqual([{ ...item1, y: item1.y + 1 }])
        })

    it('moves 2 for 1 | (0,1) one right', () => {
        const movedItem = getItem({ x: 1, y: 0, id: 1, isPixel: true })
        const placementGrid = getPlacementGridWithItems(mockItems)

        const res = makeSpaceForItem(movedItem, { x: 46.6, y: -1.6 }, placementGrid)
        expect(res).toEqual([{ ...item2, x: item2.x + 1 }])
    }),
        // 3 auf 2L
        it('should move 2L for 3 | (1,0) one right or one down', () => {
            const movedItem = getItem({ x: 1, y: 0, id: 3, isPixel: true })
            // 3 starts from (1,1), because it's not there normally
            const placementGrid = getPlacementGridWithItems([...mockItems.filter(i => i.id !== movedItem.id), { ...item3, x: 1, y: 1 }])

            const res = makeSpaceForItem(movedItem, { x: 96, y: 45.84 }, placementGrid)
            expect(res).toEqual([{ ...item2, x: item2.x + 1 }])
        }),
        // 3 auf 2R
        it('should move 2R for 3 | (2,0) one down', () => {
            const movedItem = getItem({ x: 2, y: 0, id: 3, isPixel: true })
            const placementGrid = getPlacementGridWithItems(mockItems)

            const res = makeSpaceForItem(movedItem, { x: 188.69, y: 45.4 }, placementGrid)
            expect(res).toEqual([{ ...item2, y: item2.y + 1 }])
        })

    // 1 auf 3
    it('moves 3 for 1 | (1,1)->(2,1) one right', () => {
        const movedItem = getItem({ x: 2, y: 1, id: 1, isPixel: true })
        const placementGrid = getPlacementGridWithItems([...mockItems.filter(i => i.id !== movedItem.id), { ...item1, x: 1, y: 1 }]) // 1 starts from (1,1)

        const res = makeSpaceForItem(movedItem, { x: 96, y: 138.6 }, placementGrid)
        expect(res).toEqual([{ ...item3, x: item3.x + 1 }])
    }),
        // 2 auf 3 
        it('moves 3 for 2 | (1,0)->(1,1) one right', () => {
            const movedItem = getItem({ x: 1, y: 1, id: 2, w: 2, isPixel: true })
            const placementGrid = getPlacementGridWithItems(mockItems)

            const res = makeSpaceForItem(movedItem, { x: 96, y: 45.4 }, placementGrid)
            expect(res).toEqual([{ ...item3, x: item3.x + 1 }])
        })
})