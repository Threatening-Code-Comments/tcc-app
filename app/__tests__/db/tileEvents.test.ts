import { db } from '../../db/database';
import { getEventsForTiles, insertTileEvent } from '../../db/tileEvents';

jest.mock('../../db/database');

describe('tileEvents', () => {
    beforeEach(() => {
        // Clear all instances and calls to constructor and all methods:
        (db as jest.Mock).mockClear();
    });

    it('inserts a tile event', async () => {
        const mockCallback = jest.fn();
        const mockRunAsync = jest.fn().mockResolvedValue([1]);
        (db as jest.Mock).mockReturnValue({ runAsync: mockRunAsync });

        await insertTileEvent(1, new Date(), 'data', mockCallback);

        expect(mockRunAsync).toHaveBeenCalledWith('INSERT INTO tile_events (tileId, timestamp, data) VALUES (?, ?, ?)', [1, expect.any(String), 'data']);
        expect(mockCallback).toHaveBeenCalledWith(null, [1]);
    });

    it('gets events for tiles', async () => {
        const mockCallback = jest.fn();
        const mockGetAllAsync = jest.fn().mockResolvedValue([{ tileId: 1, timestamp: '2022-01-01T00:00:00.000Z', data: 'data' }]);
        (db as jest.Mock).mockReturnValue({ getAllAsync: mockGetAllAsync });

        await getEventsForTiles([1], mockCallback);

        expect(mockGetAllAsync).toHaveBeenCalledWith(`SELECT *
            FROM tile_events
            WHERE tileId IN (?)`, [1]);
        expect(mockCallback).toHaveBeenCalledWith(null, [expect.objectContaining({ tileId: 1, timestamp: expect.any(Date), data: 'data' })]);
    });
});