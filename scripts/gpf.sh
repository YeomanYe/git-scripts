#!/bin/bash

# Implements git add . && git commit -m "xxx" && git push -f functionality

if [ $# -eq 0 ]; then
    echo "Error: Please provide a commit message, for example: gpf \"feat: xxx\""
    exit 1
fi

git add . && git commit -m "$1" && git push -f