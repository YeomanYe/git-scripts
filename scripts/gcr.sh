#!/bin/bash

# gcr - Git Clean Repository
# Equivalent to: git stash -u && git stash drop stash@{0}

# 执行git stash -u保存所有修改（包括未跟踪文件）
git stash -u

# 删除刚创建的stash记录
git stash drop stash@{0}

echo "Git repository cleaned!"
