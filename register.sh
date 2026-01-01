#!/bin/bash

# 注册脚本，将scripts目录中的所有脚本链接到全局环境

# 检查是否有root权限
if [ "$(id -u)" != "0" ]; then
    echo "错误：需要root权限来创建全局链接，请使用sudo运行此脚本"
    exit 1
fi

# 脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="$SCRIPT_DIR/scripts"

# 检查scripts目录是否存在
if [ ! -d "$SCRIPTS_DIR" ]; then
    echo "错误：scripts目录不存在"
    exit 1
fi

# 目标目录
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
            echo "更新链接：$link_path -> $script"
            rm -f "$link_path"
        elif [ -f "$link_path" ]; then
            echo "警告：$link_path 已存在且不是符号链接，跳过"
            continue
        fi
        ln -s "$script" "$link_path"
        echo "已注册命令：$command_name -> $script"
    fi
done

echo "\n注册完成！所有脚本已链接到 $TARGET_DIR"
echo "可以直接使用以下命令："
for script in "$SCRIPTS_DIR"/*; do
    if [ -f "$script" ]; then
        script_name="$(basename "$script")"
        command_name="${script_name%.sh}"
        echo "  - $command_name"
    fi
done
