import { GRID_COLUMNS, GRID_ROWS, makeSpaceForItem } from '@components/homescreen/move_algo'
import { HomescreenItem } from "@app/components/homescreen/homescreenHandler";
import { PlacementGrid } from '@app/components/homescreen/placementGrid';


const item1 = { id: 2, x: 1, y: 0, width: 2, height: 1 }
const item2 = { id: 1, x: 0, y: 0, width: 1, height: 1 }
const item3 = { id: 3, x: 2, y: 1, width: 1, height: 1 }
const mockItems: HomescreenItem[] = [
    item1,
    item2,
    item3,
];

const placementGrid = new PlacementGrid(GRID_COLUMNS, GRID_ROWS)
for (const item of mockItems)
    placementGrid.addItem(item)

const getItem = (x: number, y: number, id: number = 1, w: number = 1) => ({ "height": 92.57142857142858, "id": id, "width": 92.57142857142858 * w, "x": 93.51525298186712 * x, "y": 93.51525298186712 * y })

describe('Move-Algo', () => {
    // it('should run', () => { }),
    it('moves 1 for 3 correctly | (0,0) one down', () => {
        //moves Item 3 on top of 1 (0,0)
        const res = makeSpaceForItem(getItem(0, 0, 3), { x: 17.93, y: 42.3 }, placementGrid)
        expect(res).toEqual([{ id: 1, x: 0, y: 1, width: 1, height: 1 }])
    }),
        it('moves 1 for 2 correctly | (0,0) one down', () => {
            const res = makeSpaceForItem(getItem(0, 0, 2, 2), { x: 43.5, y: 3.2 }, placementGrid)
            //TODO reimplement
            // expect(res).toEqual([{ id: 1, x: 0, y: 1, width: 1, height: 1 }])
        }),
        it('moves 2 for 1 | (0,1) one right', () => {
            const res = makeSpaceForItem(getItem(1, 0, 1), { x: 46.6, y: -1.6 }, placementGrid)
            console.log(res)
            expect(res).toEqual([{ id: 2, x: 2, y: 0, width: 2, height: 1 }])
        })
})