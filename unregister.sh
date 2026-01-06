#!/bin/bash

# Unregistration script to remove all links created by register.sh

# Check if running with root privileges
if [ "$(id -u)" != "0" ]; then
    echo "Error: Root privileges are required to remove global links, please run this script with sudo"
    exit 1
fi

# 脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="$SCRIPT_DIR/scripts"

# Check if scripts directory exists
if [ ! -d "$SCRIPTS_DIR" ]; then
    echo "Error: scripts directory does not exist"
    exit 1
fi

# Target directory
TARGET_DIR="/usr/local/bin"

# 遍历scripts目录中的所有脚本
for script in "$SCRIPTS_DIR"/*; do
    if [ -f "$script" ]; then
        # 获取脚本名称
        script_name="$(basename "$script")"
        # 移除.sh扩展名
        command_name="${script_name%.sh}"
        
        # 删除符号链接
        link_path="$TARGET_DIR/$command_name"
        if [ -L "$link_path" ]; then
            rm -f "$link_path"
            echo "Unregistered command: $command_name"
        elif [ -f "$link_path" ]; then
            echo "Warning: $link_path exists but is not a symbolic link, skipping"
        else
            echo "Note: $command_name was not registered or has already been unregistered"
        fi
    fi
done

echo "\nUnregistration completed! All script links have been removed from $TARGET_DIR"
