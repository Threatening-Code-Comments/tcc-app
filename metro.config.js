const {getDefaultConfig} = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// .claude/worktrees/* are full checkouts of this repo (their own node_modules included).
// Without this, Metro/Watchman crawls them too, and a file that happens to live at the
// same relative path in both the main tree and a worktree (e.g. AppDrawer.tsx once did)
// can get served from the wrong one — edits in the real tree silently never show up.
config.resolver.blockList = [
    /[\\/]\.claude[\\/]worktrees[\\/].*/,
];

module.exports = config;
