# Git 快捷脚本集合

这个项目包含一些Git快捷脚本，用于简化日常开发中的Git操作。

## 目录结构

```
├── src/              # 存放所有Git快捷脚本
├── package.json      # 项目配置文件
├── __test__          # 测试文件目录
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

**选项**：
- `-n`：跳过 commit hooks（等同于 `git commit -n`）

**示例**：
```bash
gac "feat: 实现用户登录功能"
gac "fix: 修复表单验证bug"
gac "docs: 更新README文档"
gac -n "feat: 添加新功能"
```

### gme - Git Merge

**功能**：执行 `git merge` 命令，将指定的 commit 或 branch 合并到当前分支。

**使用方法**：
```bash
gme <commit|branch>
```

**参数**：
- `<commit|branch>`：必需参数，要合并的 commit 哈希值或分支名

**选项**：
- `-e, --edit`：编辑合并 commit 的消息
- `--no-ff`：强制创建合并提交（即使可以 fast-forward）

**示例**：
```bash
# 合并分支
gme feature-branch

# 使用 commit hash 合并
gme abc1234

# 强制创建合并提交
gme --no-ff feature-branch

# 编辑合并消息
gme -e feature-branch
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

**功能**：将当前分支rebase到其第一次提交，支持自动squash所有提交。

**使用方法**：
```bash
# 基本的 rebase 操作，使用最新的 commit message
grh

# 使用自定义 commit message
grh -m "custom message"
```

**参数**：
- `-m, --message <msg>`：使用自定义的 commit message 代替最新的提交 message

**示例**：
```bash
# 基本 rebase，使用最新 message
grh

# 使用自定义 message
grh -m "feat: 完成功能开发"
```

**说明**：
- 如果只有一个提交，则不会执行 rebase 操作
- 使用 `-m` 选项可以自定义合并后的 commit message

### grn - Git Rebase N Commits

**功能**：对最近 N 个提交进行 rebase 操作。支持交互式 rebase 和自动 squash 模式。

**使用方法**：
```bash
# 交互式 rebase（打开编辑器）
grn <n>

# 自动 squash，使用最新的 commit message
grn -h <n>

# 自动 squash，使用第 n 次提交的 message
grn -t <n>

# 自动 squash，使用自定义 commit message
grn -m "custom message" <n>
```

**参数**：
- `<n>`：必需参数，指定要 rebase 的提交数量（正整数）
- `-h, --head <n>`：自动 squash 最近的 n 个提交，使用最新提交的 message
- `-t, --target <n>`：自动 squash 最近的 n 个提交，使用第 n 次提交的 message
- `-m, --message <msg>`：自动 squash 最近的 n 个提交，使用自定义 message

**示例**：
```bash
# 交互式 rebase
grn 3
grn 5

# 自动 squash，使用最新 message
grn -h 3   # 将最近 3 个提交合并为 1 个，使用最新的 commit message

# 自动 squash，使用第 n 次提交的 message
grn -t 3   # 将最近 3 个提交合并为 1 个，使用第 3 次提交的 message

# 自动 squash，使用自定义 message
grn -m "fix: 修复 bug" 3   # 将最近 3 个提交合并为 1 个，使用自定义 message
```

**说明**：
- 不使用参数时，会打开交互式 rebase 编辑器
- `-h` 选项自动执行 squash，无需打开编辑器，使用最新提交的 message
- `-t` 选项自动执行 squash，使用第 n 次提交的 message 作为合并后的 message
- `-m` 选项自动执行 squash，使用自定义 message 作为合并后的 message（必须提供 N 参数）
- squash 至少需要 2 个提交

### gcr - Git Clean Repository

**功能**：清理Git仓库，通过执行 `git stash -u && git stash drop stash@{0}` 命令，用于删除所有未提交的修改（包括未跟踪文件）。

**使用方法**：
```bash
gcr
```

### gcw - Git Clear Worktrees

**功能**：删除当前项目的所有 worktree（不包括主 worktree），用于清理项目中不再需要的 worktree 目录。

**使用方法**：
```bash
# 删除所有 worktree（不包括主 worktree），需要确认
gcw

# 强制删除 worktree，无需检查未提交的更改
gcw -f

# 跳过确认提示，直接删除所有 worktree
gcw -y

# 危险：删除所有 worktree，包括主 worktree 目录
gcw -a
```

**参数**：
- `-f, --force`：强制删除 worktree，即使有未提交的更改
- `-a, --all`：包括主 worktree（危险 - 会删除主目录）
- `-y, --yes`：跳过确认提示

**示例**：
```bash
# 删除所有 worktree
gcw

# 强制删除 worktree
gcw -f

# 跳过确认
gcw -y

# 删除所有 worktree 包括主目录
gcw -a
```

**警告**：此命令会删除 worktree 目录，请在运行前确保已备份重要内容。

**工作原理**：
1. 列出当前项目的所有 worktree
2. 显示将要删除的 worktree 列表
3. 等待用户确认（除非使用 -y 选项）
4. 逐个删除 worktree

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

**功能**：将当前分支相比远端多出来的 commit 依次存储到 stash 中，并将提交的 message 作为 stash 的注释。支持特殊字符编码，以便在 gsc 还原时恢复原始格式。

**使用方法**：
```bash
# 只 stash 最新的 commit
gcs

# stash 所有超前于远端的 commit
gcs -a
```

**参数**：
- `-a, --all`：Stash all commits ahead of remote

**特殊字符支持**：
- 换行符 `\n` → 编码为 `::NL::`
- 回车符 `\r` → 编码为 `::CR::`
- 制表符 `\t` → 编码为 `::TAB::`
- 已有的标记 `::X::` → 转义为 `::::X::::`

使用 gsc 还原时，这些编码会被自动还原为原始特殊字符。

**工作原理**：
1. 获取当前分支名称
2. 检查对应的远端分支是否存在
3. 获取本地比远端多的 commit 列表，按时间从早到晚排序
4. 对 commit message 进行特殊字符编码
5. 执行以下操作：
   - 不使用 `-a` 选项：只 stash 最新的 commit
   - 使用 `-a` 选项：依次 stash 所有超前于远端的 commit
   - 对于每个 commit，执行：
     - `git reset HEAD~1`
     - `git stash push -m "encoded_message" -u`

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

**功能**：从 stash 中恢复更改并提交，将 stash 记录的描述设置为 commit 的 message。支持自动还原 gcs 编码的特殊字符。

**使用方法**：
```bash
# 恢复最新的 stash 并提交
gsc

# 按顺序恢复所有 stash 并提交
gsc -a
```

**参数**：
- `-a`：按顺序 pop 代码并 commit（从最早到最新）
- `-n`：跳过 commit hooks（等同于 `git commit -n`）

**特殊字符还原**：
gsc 会自动将 gcs 编码的特殊字符还原为原始格式：
- `::NL::` → 换行符 `\n`
- `::CR::` → 回车符 `\r`
- `::TAB::` → 制表符 `\t`
- `::::X::::` → `::X::`（转义的标记）

**工作原理**：
1. 检查是否有 stash 项可用
2. 获取 stash 描述并进行特殊字符解码
3. 对于单个 stash 项：
   - 执行 `git stash pop`
   - 执行 `git add .` 暂存所有更改
   - 使用解码后的消息执行 `git commit`
4. 对于多个 stash 项（使用 `-a`）：
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
pnpm dlx gme "feat: 添加新功能"
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
gme "feat: 提交已暂存的修改"

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
