import { getDashboardEntries, getDashboardSettings } from '@db/dashboard';
import { db } from '@db/database';

jest.mock('@db/database');

describe('Dashboard', () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    (db as jest.Mock).mockClear();
  });

  it('fetches dashboard entries', async () => {
    const mockCallback = jest.fn();
    const mockGetAllAsync = jest.fn().mockResolvedValue([{ id: 1, name: 'Test Entry' }]);
    (db as jest.Mock).mockReturnValue({ getAllAsync: mockGetAllAsync });

    await getDashboardEntries(mockCallback);

    expect(mockGetAllAsync).toHaveBeenCalledWith('SELECT * FROM dashboard');
    expect(mockCallback).toHaveBeenCalledWith(null, [{ id: 1, name: 'Test Entry' }]);
  });

  it('fetches dashboard settings', async () => {
    const mockCallback = jest.fn();
    const mockGetAllAsync = jest.fn().mockResolvedValue([{ id: 1, name: 'Test Setting' }]);
    (db as jest.Mock).mockReturnValue({ getAllAsync: mockGetAllAsync });

    await getDashboardSettings(mockCallback);

    expect(mockGetAllAsync).toHaveBeenCalledWith('SELECT * FROM dashboardSettings');
    expect(mockCallback).toHaveBeenCalledWith(null, [{ id: 1, name: 'Test Setting' }]);
  });
});