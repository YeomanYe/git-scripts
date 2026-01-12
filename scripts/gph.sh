#!/bin/bash

# Implements git add . && git commit -m "xxx" && git push functionality

if [ $# -eq 0 ]; then
    echo "Error: Please provide a commit message, for example: gph \"feat: xxx\""
    exit 1
fi

git add . && git commit -m "$1" && git push