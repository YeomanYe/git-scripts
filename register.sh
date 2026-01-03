#!/bin/bash

# Registration script to link all scripts in the scripts directory to the global environment

# Check if running with root privileges
if [ "$(id -u)" != "0" ]; then
    echo "Error: Root privileges are required to create global links, please run this script with sudo"
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
        
        # 添加执行权限
        chmod +x "$script"
        
        # 创建符号链接
        link_path="$TARGET_DIR/$command_name"
        if [ -L "$link_path" ]; then
            echo "Updating link: $link_path -> $script"
            rm -f "$link_path"
        elif [ -f "$link_path" ]; then
            echo "Warning: $link_path already exists and is not a symbolic link, skipping"
            continue
        fi
        ln -s "$script" "$link_path"
        echo "Registered command: $command_name -> $script"
    fi
done

echo "\nRegistration completed! All scripts have been linked to $TARGET_DIR"
echo "You can now use the following commands directly:"
for script in "$SCRIPTS_DIR"/*; do
    if [ -f "$script" ]; then
        script_name="$(basename "$script")"
        command_name="${script_name%.sh}"
        echo "  - $command_name"
    fi
done
