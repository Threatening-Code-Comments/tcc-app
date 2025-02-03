import { PlacementGrid } from '@components/homescreen/placementGrid';
import { HomescreenItem } from '@components/homescreen/homescreenHandler';

describe('PlacementGrid', () => {
    let grid: PlacementGrid;
    const mockItem: HomescreenItem = { id: 1, x: 0, y: 0, width: 1, height: 1 };

    const item1 = { id: 1, x: 0, y: 0, width: 1, height: 1 }
    const item2 = { id: 2, x: 1, y: 0, width: 2, height: 1 }
    const item3 = { id: 3, x: 1, y: 1, width: 1, height: 1 }
    const mockItems: HomescreenItem[] = [item1, item2, item3];


    beforeEach(() => {
        grid = new PlacementGrid(4, 5);
    });

    it('should add an item to the grid', () => {
        for (let item1 of mockItems) {
            grid.addItem(item1);
            const itemFromGrid = grid.getItemAtPosition({ x: item1.x, y: item1.y });
            expect(itemFromGrid).toEqual(item1);
        }
    });

    it('should return null for empty positions', () => {
        const item = grid.getItemAtPosition({ x: 1, y: 1 });
        expect(item).toBeUndefined();
    });

    it('should replace an item in the grid', () => {
        grid.addItem(mockItem);
        const newItem = { ...mockItem, x: 1, y: 1 };
        const newGrid = grid.getCopyWithItemReplaced(newItem);
        const item = newGrid.getItemAtPosition({ x: 1, y: 1 });
        expect(item).toEqual(newItem);
    });

    it('should check left border correctly', () => {
        //TODO - fix this test
        const result = grid.checkLeftBorder(0, 0, 1, 1, 1, true, 1);
        // expect(result).toBe(true);
    });

    it('should check right border correctly', () => {
        //TODO - fix this test
        const result = grid.checkRightBorder(3, 0, 1, 1, 1, true, 1);
        // expect(result).toBe(true);
    });
});