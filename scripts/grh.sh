#!/bin/bash

# Implements functionality to rebase current branch to its first commit

# Get current branch name
current_branch=$(git symbolic-ref --short HEAD 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "Error: Not currently on a branch"
    exit 1
fi

# Get first commit hash of current branch
first_commit=$(git log --reverse --pretty=format:"%H" $current_branch | head -1)
if [ -z "$first_commit" ]; then
    echo "Error: No commits found on current branch"
    exit 1
fi

# Perform rebase onto first commit
echo "Rebasing branch '$current_branch' onto its first commit '$first_commit'..."
git rebase --onto $first_commit $first_commit^ $current_branch