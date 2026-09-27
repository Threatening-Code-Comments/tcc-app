import type { JestConfigWithTsJest } from 'ts-jest'
import { pathsToModuleNameMapper } from 'ts-jest'
import { compilerOptions } from './tsconfig.json'

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  //.claude/worktrees/* are full repo checkouts — without this, jest-haste-map finds every
  //__mocks__ file there too ("duplicate manual mock") and could pick up their tests.
  //Same reason metro.config.js already excludes them.
  modulePathIgnorePatterns: ['<rootDir>/.claude/'],
  modulePaths: [compilerOptions.baseUrl], // <-- This will be set to 'baseUrl' value
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/app/$1',
    '^@db/(.*)$': '<rootDir>/app/db/$1',
    '^@components/(.*)$': '<rootDir>/app/components/$1',
    '^@homescreen/(.*)$': '<rootDir>/app/components/homescreen/$1',
    '^@mocks/(.*)$': '<rootDir>/__mocks__/$1',
    '^@tests/(.*)$': '<rootDir>/app/__tests__/$1',
  } //pathsToModuleNameMapper(compilerOptions.paths /*, { prefix: '<rootDir>/' } */),
}

export default jestConfig