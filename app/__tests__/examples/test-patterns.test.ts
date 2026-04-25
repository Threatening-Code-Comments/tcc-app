/**
 * ─────────────────────────────────────────────────────────────
 *  Test Patterns & Tricks — runnable reference file
 *  Run with:  npx jest examples
 * ─────────────────────────────────────────────────────────────
 *
 *  Sections:
 *   1. toBe vs toEqual
 *   2. Mocking a module
 *   3. Async / Promises
 *   4. Callbacks
 *   5. beforeEach / afterAll lifecycle
 *   6. expect helpers (any, objectContaining, arrayContaining…)
 *   7. Spy on a method
 *   8. Error handling
 *   9. Test-scoped data factories
 *  10. Table-driven tests (test.each)
 */


// ─── 1. toBe vs toEqual ──────────────────────────────────────────────────────
//
//  toBe    → strict reference equality (===). Use for primitives.
//  toEqual → deep structural equality.    Use for objects/arrays.

describe('1 · toBe vs toEqual', () => {
  it('primitives: toBe and toEqual both work', () => {
    expect(42).toBe(42)
    expect('hello').toBe('hello')
  })

  it('objects: only toEqual works for value comparison', () => {
    const a = { x: 1 }
    const b = { x: 1 }
    expect(a).not.toBe(b)      // different references
    expect(a).toEqual(b)       // same shape ✓
  })

  it('arrays: same story', () => {
    expect([1, 2, 3]).toEqual([1, 2, 3])
    expect([1, 2, 3]).not.toBe([1, 2, 3])
  })
})


// ─── 2. Mocking a module ─────────────────────────────────────────────────────
//
//  jest.mock() replaces the whole module before any import runs.
//  Always call mockClear() (or mockReset()) in beforeEach so tests
//  don't bleed into each other.

// Imagine this is your db module:
const fakeDb = {
  getAllAsync: jest.fn(),
  runAsync:   jest.fn(),
}

// Simulated function that uses the db (like your real dashboard/tileEvents code):
async function fetchUsers(db: typeof fakeDb) {
  const rows = await db.getAllAsync()
  return rows
}

describe('2 · Mocking', () => {
  beforeEach(() => {
    fakeDb.getAllAsync.mockClear()   // reset call counts + return values
    fakeDb.runAsync.mockClear()
  })

  it('mockResolvedValue — async return value', async () => {
    fakeDb.getAllAsync.mockResolvedValue([{ id: 1, name: 'Alice' }])

    const result = await fetchUsers(fakeDb)

    expect(fakeDb.getAllAsync).toHaveBeenCalledTimes(1)
    expect(result).toEqual([{ id: 1, name: 'Alice' }])
  })

  it('mockReturnValue — sync return value', () => {
    fakeDb.getAllAsync.mockReturnValue('sync-surprise')
    // useful for non-async code paths
    expect(fakeDb.getAllAsync()).toBe('sync-surprise')
  })

  it('mockImplementation — full control', async () => {
    fakeDb.getAllAsync.mockImplementation(async () => {
      throw new Error('DB offline')
    })
    await expect(fetchUsers(fakeDb)).rejects.toThrow('DB offline')
  })
})


// ─── 3. Async / Promises ─────────────────────────────────────────────────────
//
//  Always return or await the promise — otherwise Jest won't catch failures.

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

async function slowAdd(a: number, b: number) {
  await delay(5)
  return a + b
}

describe('3 · Async', () => {
  it('await the result directly', async () => {
    const result = await slowAdd(2, 3)
    expect(result).toBe(5)
  })

  it('resolves with the right value', async () => {
    await expect(slowAdd(10, 10)).resolves.toBe(20)
  })

  it('rejects — use rejects.toThrow', async () => {
    const boom = async () => { throw new Error('oops') }
    await expect(boom()).rejects.toThrow('oops')
  })
})


// ─── 4. Callbacks ────────────────────────────────────────────────────────────
//
//  Use jest.fn() to capture callback arguments.
//  Your db layer uses (err, data) callbacks — this is how to test them.

function computeWithCallback(a: number, b: number, cb: (err: null | Error, result?: number) => void) {
  if (b === 0) return cb(new Error('division by zero'))
  cb(null, a / b)
}

describe('4 · Callbacks', () => {
  it('success path — callback receives null error + result', () => {
    const cb = jest.fn()
    computeWithCallback(10, 2, cb)
    expect(cb).toHaveBeenCalledWith(null, 5)
  })

  it('error path — callback receives an Error', () => {
    const cb = jest.fn()
    computeWithCallback(10, 0, cb)
    expect(cb).toHaveBeenCalledWith(expect.any(Error))
    // access the actual error if needed:
    const [err] = cb.mock.calls[0]
    expect(err.message).toBe('division by zero')
  })
})


// ─── 5. Lifecycle: beforeEach / afterAll ─────────────────────────────────────
//
//  beforeAll  — runs once before all tests in this describe block
//  afterAll   — runs once after  all tests (great for cleanup)
//  beforeEach — runs before every single test   ← most common
//  afterEach  — runs after  every single test

describe('5 · Lifecycle', () => {
  const log: string[] = []

  beforeAll(() => log.push('beforeAll'))
  afterAll(()  => {
    // e.g. close DB connections, kill child processes
    log.push('afterAll')
  })
  beforeEach(() => log.push('beforeEach'))

  it('first test',  () => expect(log).toContain('beforeAll'))
  it('second test', () => expect(log.filter(e => e === 'beforeEach').length).toBeGreaterThanOrEqual(2))
})


// ─── 6. expect helpers ───────────────────────────────────────────────────────

describe('6 · expect helpers', () => {
  it('expect.any(Type) — type without caring about value', () => {
    expect(Date.now()).toEqual(expect.any(Number))
    expect(new Date()).toEqual(expect.any(Date))
    expect('hello').toEqual(expect.any(String))
  })

  it('expect.objectContaining — partial object match', () => {
    const user = { id: 1, name: 'Alice', createdAt: new Date() }
    // Only care that id and name are correct, ignore createdAt:
    expect(user).toEqual(expect.objectContaining({ id: 1, name: 'Alice' }))
  })

  it('expect.arrayContaining — subset of array', () => {
    const tags = ['react', 'native', 'expo', 'sqlite']
    expect(tags).toEqual(expect.arrayContaining(['expo', 'sqlite']))
  })

  it('toMatchObject — like objectContaining but as a matcher', () => {
    const event = { type: 'click', x: 42, y: 99, timestamp: 12345 }
    expect(event).toMatchObject({ type: 'click', x: 42 })
  })

  it('toHaveLength', () => {
    expect([1, 2, 3]).toHaveLength(3)
    expect('hello').toHaveLength(5)
  })

  it('toBeGreaterThan / toBeLessThan', () => {
    expect(Date.now()).toBeGreaterThan(0)
    expect(0.1 + 0.2).toBeCloseTo(0.3)  // ← floating point trick!
  })
})


// ─── 7. Spy on a method ──────────────────────────────────────────────────────
//
//  jest.spyOn lets you observe (and optionally replace) a method on a live
//  object without fully replacing the module. Great for testing side effects.

const logger = {
  info: (msg: string) => console.log('[INFO]', msg),
  error: (msg: string) => console.error('[ERR]', msg),
}

function doWork(succeed: boolean) {
  if (succeed) logger.info('done')
  else         logger.error('failed')
}

describe('7 · Spies', () => {
  let infoSpy:  jest.SpyInstance
  let errorSpy: jest.SpyInstance

  beforeEach(() => {
    infoSpy  = jest.spyOn(logger, 'info').mockImplementation(() => {})
    errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => {})
  })
  afterEach(() => jest.restoreAllMocks())  // ← don't forget this!

  it('calls info on success', () => {
    doWork(true)
    expect(infoSpy).toHaveBeenCalledWith('done')
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('calls error on failure', () => {
    doWork(false)
    expect(errorSpy).toHaveBeenCalledWith('failed')
  })
})


// ─── 8. Error handling ───────────────────────────────────────────────────────

function parseJson(raw: string) {
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error(`Invalid JSON: ${raw}`)
  }
}

describe('8 · Errors', () => {
  it('sync throw — wrap in arrow function', () => {
    expect(() => parseJson('not json')).toThrow('Invalid JSON')
  })

  it('toThrow accepts string (substring) or regex', () => {
    expect(() => parseJson('{bad')).toThrow(/Invalid JSON/)
  })

  it('valid input does not throw', () => {
    expect(() => parseJson('{"ok":true}')).not.toThrow()
    expect(parseJson('{"ok":true}')).toEqual({ ok: true })
  })
})


// ─── 9. Data factories ───────────────────────────────────────────────────────
//
//  Instead of copy-pasting big objects in every test, make a factory.
//  Spread overrides let each test express only what it cares about.

type Tile = { id: number; name: string; x: number; y: number; width: number; height: number }

const makeTile = (overrides: Partial<Tile> = {}): Tile => ({
  id: 1, name: 'Default', x: 0, y: 0, width: 1, height: 1,
  ...overrides,
})

describe('9 · Data factories', () => {
  it('default tile', () => {
    expect(makeTile()).toEqual({ id: 1, name: 'Default', x: 0, y: 0, width: 1, height: 1 })
  })

  it('override only what matters for this test', () => {
    const wide = makeTile({ width: 3, name: 'Wide tile' })
    expect(wide.width).toBe(3)
    expect(wide.height).toBe(1)  // still default
  })

  it('factories scale to many test cases without repetition', () => {
    const tiles = [makeTile({ id: 1, x: 0 }), makeTile({ id: 2, x: 1 }), makeTile({ id: 3, x: 2 })]
    expect(tiles.every(t => t.height === 1)).toBe(true)
  })
})


// ─── 10. Table-driven tests (test.each) ──────────────────────────────────────
//
//  When the same logic needs to run against many inputs, test.each keeps
//  tests DRY and makes failures easy to identify by the test name.

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

describe('10 · test.each', () => {
  // Column syntax: [value, min, max, expected]
  test.each([
    [5,   0, 10,  5],   // within range
    [-3,  0, 10,  0],   // below min → clamp to min
    [15,  0, 10, 10],   // above max → clamp to max
    [0,   0, 10,  0],   // exactly min
    [10,  0, 10, 10],   // exactly max
  ])('clamp(%i, 0, 10) → %i', (value, min, max, expected) => {
    expect(clamp(value, min, max)).toBe(expected)
  })

  // Object syntax — more readable for complex cases:
  test.each([
    { input: 'hello', expected: 5 },
    { input: '',      expected: 0 },
    { input: 'hi',    expected: 2 },
  ])('string length of "$input" is $expected', ({ input, expected }) => {
    expect(input.length).toBe(expected)
  })
})
