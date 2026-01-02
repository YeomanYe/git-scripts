# Git 快捷脚本集合

这个项目包含一些Git快捷脚本，用于简化日常开发中的Git操作。

## 目录结构

```
├── scripts/          # 存放所有Git快捷脚本
├── register.sh       # 注册脚本到全局环境的工具
└── README.md         # 项目说明文档
```

## 脚本列表

### gac - Git Add and Commit

**功能**：执行 `git add . && git commit -m "xxx"` 命令，一键添加所有修改并提交。

**使用方法**：
```bash
gac "feat: 添加新功能"
```

**参数**：
- 必须提供提交信息，例如：`"feat: xxx"`、`"fix: xxx"` 等

**示例**：
```bash
gac "feat: 实现用户登录功能"
gac "fix: 修复表单验证bug"
gac "docs: 更新README文档"
```

## 注册脚本到全局环境

### 使用方法

1. 确保 `register.sh` 有执行权限：
   ```bash
   chmod +x register.sh
   ```

2. 运行注册脚本（需要root权限）：
   ```bash
   sudo ./register.sh
   ```

### 注册脚本功能

- 自动给 `scripts/` 目录下的所有脚本添加执行权限
- 将脚本链接到 `/usr/local/bin` 目录，移除 `.sh` 扩展名
- 支持更新已有链接
- 显示所有注册的命令

### 注册示例输出

```
已注册命令：gac -> /path/to/git-scripts/scripts/gac.sh

注册完成！所有脚本已链接到 /usr/local/bin
可以直接使用以下命令：
  - gac
```

## 自定义脚本

你可以在 `scripts/` 目录下添加自己的Git快捷脚本，然后运行 `register.sh` 注册到全局环境。

### 脚本命名规则

- 脚本文件名应使用小写字母，单词之间用连字符分隔（例如：`git-push-all.sh`）
- 注册后，命令名将移除 `.sh` 扩展名（例如：`git-push-all`）

## 注意事项

1. 注册脚本需要root权限，因为要写入 `/usr/local/bin` 目录
2. 确保 `/usr/local/bin` 已添加到系统PATH环境变量中
3. 如果命令名已存在，注册脚本会更新链接（仅当是符号链接时）
4. 非符号链接的同名文件会被跳过，避免覆盖系统命令

## 更新脚本

1. 修改 `scripts/` 目录下的脚本文件
2. 脚本会自动更新，无需重新注册（因为使用的是符号链接）

## 卸载脚本

手动删除 `/usr/local/bin` 目录下的符号链接即可：

```bash
sudo rm /usr/local/bin/gac
```

## 许可证

本项目采用 MIT 许可证，详情请见 [LICENSE](LICENSE) 文件。
