#!/bin/bash
set -e

echo "═══════════════════════════════════════════════════════════"
echo "  部署 S2 测试站到 GitHub Pages"
echo "  仓库：https://github.com/05RubyTang/Yise--assistant-s2"
echo "═══════════════════════════════════════════════════════════"
echo ""

# 1. 确保在项目根目录
if [ ! -f "package.json" ]; then
  echo "错误：请在项目根目录运行此脚本"
  exit 1
fi

# 2. 检查是否有未提交的修改
if ! git diff-index --quiet HEAD --; then
  echo "警告：有未提交的修改"
  read -p "是否继续？(y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# 3. 推送代码到远程仓库（需要先认证）
echo "📤 步骤 1/3: 推送代码到 s2-test..."
if git push s2-test s2-dev:main; then
  echo "✓ 代码推送成功"
else
  echo "✗ 代码推送失败，请检查 Git 认证"
  echo "   提示：可能需要配置 SSH key 或 Personal Access Token"
  exit 1
fi

# 4. 构建项目
echo ""
echo "🔨 步骤 2/3: 构建项目..."
VITE_BASE_PATH=/Yise--assistant-s2/ npm run build

if [ ! -d "dist" ]; then
  echo "✗ 构建失败：dist 目录不存在"
  exit 1
fi
echo "✓ 构建完成"

# 5. 部署到 gh-pages 分支
echo ""
echo "📦 步骤 3/3: 部署到 gh-pages 分支..."

# 创建临时目录
TMP_DIR=$(mktemp -d)
echo "   - 创建临时目录：$TMP_DIR"

# 复制 dist 内容到临时目录
cp -r dist/* "$TMP_DIR/"
echo "   - 复制构建产物"

# 切换到临时目录
cd "$TMP_DIR"

# 初始化 git
git init
git add -A
git commit -m "deploy: S2 测试站部署 $(date +'%Y-%m-%d %H:%M:%S')

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 推送到 gh-pages 分支
echo "   - 推送到 gh-pages 分支..."
if git push -f https://github.com/05RubyTang/Yise--assistant-s2.git HEAD:gh-pages; then
  echo "✓ 部署成功"
else
  echo "✗ 部署失败"
  cd -
  rm -rf "$TMP_DIR"
  exit 1
fi

# 清理临时目录
cd -
rm -rf "$TMP_DIR"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ 部署完成！"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🔗 访问地址："
echo "   https://05rubytang.github.io/Yise--assistant-s2/"
echo ""
echo "⚙️  GitHub Pages 配置："
echo "   1. 前往：https://github.com/05RubyTang/Yise--assistant-s2/settings/pages"
echo "   2. Source: Deploy from a branch"
echo "   3. Branch: gh-pages / (root)"
echo "   4. 等待 1-2 分钟后访问"
echo ""
