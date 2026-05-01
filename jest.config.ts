import type { Config } from "jest"
import nextJest from "next/jest.js"

const createJestConfig = nextJest({ dir: "./" })

// When running from inside a worktree, don't exclude .worktrees — all test
// paths already contain that string and the exclusion would block everything.
const isInsideWorktree = process.cwd().includes(".worktrees")

const config: Config = {
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: [
    "/node_modules/",
    ...(isInsideWorktree ? [] : ["/.worktrees/"]),
  ],
  maxWorkers: 1,
}

export default createJestConfig(config)
