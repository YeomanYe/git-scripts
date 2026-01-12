#!/bin/bash

# Git Stash Commit - 从 stash 中恢复更改并提交

# 解析参数
sequential_commit=false
while [[ $# -gt 0 ]]; do
    case $1 in
        -s)
            sequential_commit=true
            shift
            ;;
        *)
            echo "Error: Unknown option $1"
            echo "Usage: gsc [-s]"
            echo "  -s    Pop stash items in order and commit each"
            echo "  (without -s) Pop only the latest stash item and commit"
            exit 1
            ;;
    esac
done

# 检查是否有 stash 项
if ! git stash list > /dev/null 2>&1; then
    echo "Error: Git stash operation failed"
    exit 1
fi

stash_count=$(git stash list | wc -l | tr -d ' ')

if [ "$stash_count" -eq 0 ]; then
    echo "Error: No stash items available"
    exit 1
fi

if [ "$sequential_commit" = true ]; then
    # 使用 -s 参数时，按顺序 pop 代码并 commit
    echo "Popping stash items in order and committing each..."
    
    # 获取 stash 数量
    stash_count=$(git stash list | wc -l | tr -d ' ')
    
    for ((i=0; i<$stash_count; i++)); do
        # 始终处理 stash@{0}，因为每次 pop 后堆栈会变化
        # 获取当前 stash@{0} 的描述，移除 'On branch' 前缀
        stash_description=$(git stash list | head -n 1 | cut -d: -f2- | sed 's/^[[:space:]]*//' | sed 's/^On [^:]*: //')
        
        # Pop stash@{0}
        echo
        echo "Popping stash item: stash@{0}"
        git stash pop
        
        if [ $? -ne 0 ]; then
            echo "Error: Failed to pop stash item"
            exit 1
        fi
        
        # Stage changes
        git add .
        
        # Commit with stash description as message
        echo "Committing with message: $stash_description"
        git commit -m "$stash_description"
        
        if [ $? -ne 0 ]; then
            echo "Error: Failed to commit changes"
            exit 1
        fi
        
        echo "Successfully committed stash item"
    done
else
    # 不使用 -s 参数时，只 pop 最新的 stash 项
    echo "Popping only the latest stash item..."
    
    # 获取最新 stash 项的描述，移除 'On branch' 前缀
    latest_stash_description=$(git stash list | head -n 1 | cut -d: -f2- | sed 's/^[[:space:]]*//' | sed 's/^On [^:]*: //')
    
    # Pop latest stash
    git stash pop
    
    if [ $? -ne 0 ]; then
        echo "Error: Failed to pop stash"
        exit 1
    fi
    
    # Stage changes
    git add .
    
    # Commit with stash description as message
    echo "Committing with message: $latest_stash_description"
    git commit -m "$latest_stash_description"
    
    if [ $? -ne 0 ]; then
        echo "Error: Failed to commit changes"
        exit 1
    fi
    
    echo "Successfully committed the latest stash item"
fi

echo
echo "Stash commit operation completed successfully!"
echo "You can view the commits with 'git log'"
