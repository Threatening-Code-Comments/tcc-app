export const openDatabaseSync = jest.fn(() => ({
    transaction: jest.fn(),
  }));
  
  export default {
    openDatabaseSync,
  };