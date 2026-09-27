import {createResizeTempElements, generateTempElements, isOutOfGridBounds} from '@homescreen/util';
import {HS3Item} from '@components/homescreen/types';

const item = (itemId: number, x: number, y: number, width = 1, height = 1): HS3Item =>
    ({itemId, tileId: itemId, parentId: undefined, layout: {x, y, width, height}})

describe('resize pushes overlapped neighbours along the dragged edge', () => {
    const einkaufen = item(1, 1, 0)
    const doener = item(2, 2, 0)

    it('pushes a right neighbour further right', () => {
        const resized = item(1, 1, 0, 2)
        const temp = createResizeTempElements(resized, [einkaufen, doener], 'right')
        expect(temp).toEqual([item(2, 3, 0)])
        expect(generateTempElements(temp, [einkaufen, doener], {element: resized, coordinate: {x: 0, y: 0}, type: 'resize'}))
            .toEqual([])
    })

    it('flags the resize as impossible when the neighbour would leave the grid', () => {
        const resized = item(1, 1, 0, 3)
        const temp = createResizeTempElements(resized, [einkaufen, item(2, 3, 0)], 'right')
        expect(temp).toEqual([item(2, 4, 0)])
        expect(generateTempElements(temp, [einkaufen, item(2, 3, 0)], {element: resized, coordinate: {x: 0, y: 0}, type: 'resize'}))
            .toHaveLength(1)
    })

    it('pushes a lower neighbour down when resizing the bottom edge', () => {
        const below = item(2, 1, 1)
        const temp = createResizeTempElements(item(1, 1, 0, 1, 2), [einkaufen, below], 'bottom')
        expect(temp).toEqual([item(2, 1, 2)])
    })

    it('leaves elements alone that the resized one does not overlap', () => {
        expect(createResizeTempElements(item(1, 1, 0, 1, 2), [einkaufen, doener], 'bottom')).toEqual([])
    })

    it('detects layouts reaching past the grid', () => {
        expect(isOutOfGridBounds({x: 2, y: 0, width: 3, height: 1})).toBe(true)
        expect(isOutOfGridBounds({x: 0, y: 0, width: 4, height: 1})).toBe(false)
    })
})
