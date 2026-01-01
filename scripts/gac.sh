#!/bin/bash

# 实现 git add . && git commit -m "xxx" 的功能

if [ $# -eq 0 ]; then
    echo "错误：请提供提交信息，例如：gac \"feat: xxx\""
    exit 1
fi

git add . && git commit -m "$1"
