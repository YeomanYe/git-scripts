#!/bin/bash

# Git Commit Stash - 将本地多出来的 commit 存储到 stash 中

# 解析参数
all_commits=false
while [[ $# -gt 0 ]]; do
    case $1 in
        -a)
            all_commits=true
            shift
            ;;
        *)
            echo "Error: Unknown option $1"
            echo "Usage: gcs [-a]"
            echo "  -a    Store all commits step by step"
            echo "  (without -a) Store only the latest commit"
            exit 1
            ;;
    esac
done

# 获取当前分支名称
current_branch=$(git rev-parse --abbrev-ref HEAD)

# 获取远端分支名称
remote_branch="origin/$current_branch"

# 检查远端分支是否存在
if ! git show-ref --verify --quiet "refs/remotes/$remote_branch"; then
    echo "Error: Remote branch $remote_branch does not exist"
    exit 1
fi

# 获取本地比远端多的 commit 列表，按时间从早到晚排序
# 使用 awk 替代 tac，确保在所有系统上都能正常运行
commits=$(git log --pretty=format:"%H %s" $remote_branch..$current_branch | awk '{a[i++]=$0} END {for (j=i-1; j>=0; j--) print a[j]}')

# 检查是否有本地多的 commit
if [ -z "$commits" ]; then
    echo "Info: No local commits ahead of $remote_branch"
    exit 0
fi

if [ "$all_commits" = true ]; then
    # 使用 -a 参数时，将所有 commit 依次存储到 stash 中
    echo "Stashing all commits step by step..."
    while read -r commit_hash commit_message; do
        # 执行 git reset HEAD~1
        git reset HEAD~1
        
        # 执行 git stash push -m "commit_message"
        git stash push -m "$commit_message" -u
        
        echo "Stashed commit: $commit_message"
    done <<< "$commits"
else
    # 不使用 -a 参数时，只存储最新的 commit
    echo "Stashing only the latest commit..."
    
    # 获取最新的 commit 信息（最后一个）
    latest_commit=$(echo "$commits" | tail -n 1)
    commit_message=$(echo "$latest_commit" | cut -d' ' -f2-)
    
    # 执行 git reset HEAD~1
    git reset HEAD~1
    
    # 执行 git stash push -m "commit_message"
    git stash push -m "$commit_message" -u
    
    echo "Stashed commit: $commit_message"
fi

echo
echo "Stash operation completed successfully!"
echo "You can view them with 'git stash list'"
echo "To apply them back, use 'git stash pop' or 'git stash apply'"
