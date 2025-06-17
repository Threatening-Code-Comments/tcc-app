import * as SQLite from 'expo-sqlite';
import { db, escapeQuery } from '@db/database';

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({})),
}));

describe('Database', () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    (SQLite.openDatabaseSync as jest.Mock).mockClear();
  });

  // it('opens the database', () => {
  //   const mockDb = {};
  //   (SQLite.openDatabaseSync as jest.Mock).mockReturnValue(mockDb);
    
  //   const result = db();

  //   expect(SQLite.openDatabaseSync).toHaveBeenCalled();
  //   expect(result).toBe(mockDb);
  // });

  it('escapes a query', () => {
    const query = "SELECT * FROM users WHERE name = ? AND age = ?";
    const args = ["O'Reilly", 25];
    const expected = "SELECT * FROM users WHERE name = 'O''Reilly' AND age = '25'";

    const result = escapeQuery(query, args);

    expect(result).toBe(expected);
  });
});