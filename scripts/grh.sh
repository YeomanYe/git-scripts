#!/bin/bash

# 将当前分支 rebase 到其第一次提交

# 获取当前分支名称
current_branch=$(git symbolic-ref --short HEAD 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "Error: Not currently on a branch"
    exit 1
fi

# 获取当前分支的第一次提交哈希
first_commit=$(git log --reverse --pretty=format:"%H" $current_branch | head -1)
if [ -z "$first_commit" ]; then
    echo "Error: No commits found on current branch"
    exit 1
fi

# 执行 rebase 到第一次提交
echo "Rebasing branch '$current_branch' onto its first commit '$first_commit'..."
git rebase --onto $first_commit $first_commit^ $current_branch