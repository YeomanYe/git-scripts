# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Git utility CLI scripts for Windows-compatible git operations. Provides shortcuts for common Git workflows (add/commit, merge, push, stash, rebase, worktree management).

## Commands

| Command | Purpose |
|---------|---------|
| `gac` | Git Add and Commit - `git add . && git commit -m "msg"` with quote escaping (`\"`, `\'`) and `-n` to skip hooks |
| `gcr` | Git Clean Repository - removes untracked files via `git stash -u && git stash drop` |
| `gcs` | Git Commit Stash - stash commits ahead of remote with special char encoding (`\n`→`::NL::`, `\t`→`::TAB::`, `"`→`::DQ::`) |
| `gsc` | Git Stash Commit - restore stashed commits, decodes gcs special chars back to original |
| `gcw` | Git Clear Worktrees - remove all worktrees except main, supports `-f` (force), `-a` (all including main), `-y` (yes) |
| `gme` | Git Merge - wraps `git merge`, supports `-e` (edit) and `--no-ff` |
| `gpf` | Git Push Force - add, commit, force push in one command |
| `gph` | Git Push - add, commit, push in one command |
| `grh` | Git Rebase to First Commit - rebase all commits onto first, supports `-m` for custom message |
| `grn` | Git Rebase N Commits - interactive or auto squash last N commits, supports `-h` (latest msg), `-t` (nth msg), `-m` (custom) |

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run single test file
pnpm test -- gac.test.cjs
```

## Architecture

- Each CLI command is a separate file in `src/` using **Commander.js** for argument parsing
- Tests are in `__test__/` with matching `.test.cjs` filenames
- Special encoding/decoding logic in gcs/gsc for preserving special characters across stash operations
- Quote escaping logic in gac for handling quotes in commit messages
