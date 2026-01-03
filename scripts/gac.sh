#!/bin/bash

# Implements git add . && git commit -m "xxx" functionality

if [ $# -eq 0 ]; then
    echo "Error: Please provide a commit message, for example: gac \"feat: xxx\""
    exit 1
fi

git add . && git commit -m "$1"
