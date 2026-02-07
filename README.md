# Git 快捷脚本集合

这个项目包含一些Git快捷脚本，用于简化日常开发中的Git操作。

## 目录结构

```
├── src/              # 存放所有Git快捷脚本
├── package.json      # 项目配置文件
├── test/             # 测试文件目录
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

### gpf - Git Push Force

**功能**：执行 `git add . && git commit -m "xxx" && git push -f` 命令，一键添加所有修改、提交并强制推送到远程仓库。

**使用方法**：
```bash
gpf "feat: 添加新功能"
```

**参数**：
- 必须提供提交信息，例如：`"feat: xxx"`、`"fix: xxx"` 等

**示例**：
```bash
gpf "feat: 实现用户登录功能"
gpf "fix: 修复表单验证bug"
gpf "docs: 更新README文档"
```

### grh - Git Rebase to First Commit

**功能**：将当前分支rebase到其第一次提交。

**使用方法**：
```bash
grh
```

### grn - Git Rebase N Commits

**功能**：执行 `git rebase -i HEAD~N` 命令，对最近 N 个提交进行交互式 rebase。

**使用方法**：
```bash
grn <n>
```

**参数**：
- `<n>`：必需参数，指定要 rebase 的提交数量（正整数）

**示例**：
```bash
# 对最近 3 个提交进行交互式 rebase
grn 3

# 对最近 5 个提交进行交互式 rebase
grn 5
```

**说明**：
- 该命令会打开交互式 rebase 编辑器，让你可以修改、合并、删除或重排提交
- 使用方式与 `git rebase -i HEAD~N` 完全相同，但命令更简洁

### gcr - Git Clean Repository

**功能**：清理Git仓库，通过执行 `git stash -u && git stash drop stash@{0}` 命令，用于删除所有未提交的修改（包括未跟踪文件）。

**使用方法**：
```bash
gcr
```

### gph - Git Push

**功能**：执行 `git add . && git commit -m "xxx" && git push` 命令，一键添加所有修改、提交并推送到远程仓库。

**使用方法**：
```bash
gph "feat: 添加新功能"
```

**参数**：
- 必须提供提交信息，例如：`"feat: xxx"`、`"fix: xxx"` 等

**示例**：
```bash
gph "feat: 实现用户登录功能"
gph "fix: 修复表单验证bug"
gph "docs: 更新README文档"
```

### gcs - Git Commit Stash

**功能**：将当前分支相比远端多出来的 commit 依次存储到 stash 中，并将提交的 message 作为 stash 的注释。

**使用方法**：
```bash
# 只 stash 最新的 commit
gcs

# stash 所有超前于远端的 commit
gcs -a
```

**参数**：
- `-a, --all`：Stash all commits ahead of remote

**工作原理**：
1. 获取当前分支名称
2. 检查对应的远端分支是否存在
3. 获取本地比远端多的 commit 列表，按时间从早到晚排序
4. 执行以下操作：
   - 不使用 `-a` 选项：只 stash 最新的 commit
   - 使用 `-a` 选项：依次 stash 所有超前于远端的 commit
   - 对于每个 commit，执行：
     - `git reset HEAD~1`
     - `git stash push -m "commit_message" -u`

**示例**：
```bash
# 只 stash 最新的 commit
gcs

# stash 所有超前于远端的 commit
gcs -a
```

**输出示例**：
```
# 只 stash 最新的 commit
Stashing only the latest commit...
Stashed commit: feat: add gcs

Stash operation completed successfully!
You can view them with 'git stash list'
To apply them back, use 'git stash pop' or 'git stash apply'

# stash 所有超前于远端的 commit
Stashing all commits step by step...
Stashed commit: feat: add gcs
Stashed commit: feat: add gph

Stash operation completed successfully!
You can view them with 'git stash list'
To apply them back, use 'git stash pop' or 'git stash apply'
```

### gsc - Git Stash Commit

**功能**：从 stash 中恢复更改并提交，将 stash 记录的描述设置为 commit 的 message。

**使用方法**：
```bash
# 恢复最新的 stash 并提交
gsc

# 按顺序恢复所有 stash 并提交
gsc -a
```

**参数**：
- `-a`：按顺序 pop 代码并 commit（从最早到最新）

**工作原理**：
1. 检查是否有 stash 项可用
2. 对于单个 stash 项：
   - 执行 `git stash pop`
   - 执行 `git add .` 暂存所有更改
   - 使用 stash 描述作为 commit message 执行 `git commit`
3. 对于多个 stash 项（使用 `-a`）：
   - 按顺序（从最早到最新）执行上述操作

**示例**：
```bash
# 恢复最新 stash 并提交
gsc

# 按顺序恢复所有 stash 并提交
gsc -a
```

**输出示例**：
```
# 单个 stash 恢复
Popping only the latest stash item...
Committing with message: feat: add gcs
Successfully committed the latest stash item

Stash commit operation completed successfully!
You can view the commits with 'git log'

# 多个 stash 恢复
Popping stash items in order and committing each...

Popping stash item: stash@{0}
Committing with message: feat: add gph
Successfully committed stash item stash@{0}

Popping stash item: stash@{1}
Committing with message: feat: add gcs
Successfully committed stash item stash@{1}

Stash commit operation completed successfully!
You can view the commits with 'git log'
```

## 安装和使用

### 全局安装

你可以通过pnpm将这些脚本安装为全局命令：

```bash
pnpm install -g .
```

### 本地使用

或者在项目目录中使用pnpm dlx：

```bash
pnpm dlx gac "feat: 添加新功能"
pnpm dlx gpf "fix: 修复bug"
```

### 开发模式

如果你想在开发模式下使用这些脚本：

```bash
# 链接脚本到全局
pnpm link

# 使用脚本
# 例如：
gac "feat: 开发新功能"

# 取消链接
pnpm unlink
```

## 注意事项

1. 全局安装需要管理员权限
2. 确保Node.js已安装并配置正确
3. pnpm会自动将脚本添加到系统PATH中

## 更新脚本

1. 修改 `src/` 目录下的脚本文件
2. 重新安装或链接脚本：
   ```bash
   pnpm install -g .
   # 或在开发模式下
   pnpm link
   ```

## 许可证

本项目采用 MIT 许可证，详情请见 [LICENSE](LICENSE) 文件。
