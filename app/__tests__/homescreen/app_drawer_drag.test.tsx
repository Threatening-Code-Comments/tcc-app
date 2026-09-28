import {getAppDrawerDragPoint, getModifiedTempElements} from '@homescreen/util';
import {HS3Folder, HS3Item} from '@components/homescreen/types';
import {DRAWER_CANCEL_ZONE_HEIGHT} from '@homescreen/constants';

const item = (itemId: number, x: number, y: number, width = 1, height = 1): HS3Item =>
    ({itemId, tileId: itemId, parentId: undefined, layout: {x, y, width, height}})

const root = (items: HS3Item[]): HS3Folder =>
    ({folderId: undefined, name: 'root', color: '#000', items, layout: {x: 0, y: 0, width: 4, height: 9}})

describe('dropping a tile dragged in from the App Drawer', () => {
    it('adds the not-yet-placed item and saves the pushed-away neighbour', () => {
        const neighbour = item(1, 1, 0)
        const dropped = item(2, 1, 0)
        const result = getModifiedTempElements([item(1, 2, 0), dropped], [root([neighbour])])
        expect(result[0].items).toEqual([item(1, 2, 0), dropped])
    })

    it('still only replaces an item that is already placed', () => {
        const result = getModifiedTempElements([item(1, 3, 3)], [root([item(1, 0, 0)])])
        expect(result[0].items).toEqual([item(1, 3, 3)])
    })
})

describe('where an App Drawer drag points', () => {
    const bounds = {x: 10, y: 50, width: 400, height: 800}

    it('converts into homescreen-local coordinates', () => {
        expect(getAppDrawerDragPoint({x: 110, y: 250}, bounds)).toEqual({x: 100, y: 200})
    })

    it('cancels over the drawer cancel bar', () => {
        const y = bounds.y + bounds.height - DRAWER_CANCEL_ZONE_HEIGHT / 2
        expect(getAppDrawerDragPoint({x: 110, y}, bounds)).toBeUndefined()
    })

    it('cancels off the homescreen area or without measured bounds', () => {
        expect(getAppDrawerDragPoint({x: 5, y: 250}, bounds)).toBeUndefined()
        expect(getAppDrawerDragPoint({x: 110, y: 250}, undefined)).toBeUndefined()
    })
})
