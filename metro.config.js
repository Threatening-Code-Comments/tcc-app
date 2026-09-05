const {getDefaultConfig} = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// .claude/worktrees/* are full checkouts of this repo (their own node_modules included).
// Without this, Metro/Watchman crawls them too, and a file that happens to live at the
// same relative path in both the main tree and a worktree (e.g. AppDrawer.tsx once did)
// can get served from the wrong one — edits in the real tree silently never show up.
config.resolver.blockList = [
    /[\\/]\.claude[\\/]worktrees[\\/].*/,
    // expo-router treats every file under app/ as a route candidate; __tests__ files
    // (some of which import Node-only modules like child_process) were never reachable
    // before the worktree collision above masked this, but are real once it's fixed.
    /[\\/]app[\\/]__tests__[\\/].*/,
];

module.exports = config;
