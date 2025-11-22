#!/bin/bash

# 部署前检查脚本
# 用途: 在部署前验证项目是否满足部署条件
# 功能: 检查Node.js环境、安装依赖、运行代码检查和构建项目
# 使用方法: bash scripts/pre-deploy-check.sh
echo "开始部署前检查..."

# 检查Node.js版本
echo "检查Node.js版本..."
NODE_VERSION=$(node -v)
echo "当前Node.js版本: $NODE_VERSION"

# 检查pnpm版本
echo "检查pnpm版本..."
PNPM_VERSION=$(pnpm -v)
echo "当前pnpm版本: $PNPM_VERSION"

# 安装依赖
echo "安装依赖..."
pnpm install

if [ $? -ne 0 ]; then
  echo "❌ 依赖安装失败"
  exit 1
fi

# 运行TypeScript检查
echo "运行TypeScript检查..."
pnpm run check

if [ $? -ne 0 ]; then
  echo "❌ TypeScript检查失败"
  exit 1
fi

# 运行ESLint检查
echo "运行ESLint检查..."
pnpm run lint

if [ $? -ne 0 ]; then
  echo "❌ ESLint检查失败"
  exit 1
fi

# 构建项目
echo "构建项目..."
pnpm run build

if [ $? -ne 0 ]; then
  echo "❌ 项目构建失败"
  exit 1
fi

# 检查构建产物大小
echo "检查构建产物大小..."
if [ -d "./dist" ]; then
  if command -v du &> /dev/null; then
    BUILD_SIZE=$(du -sh ./dist 2>/dev/null | cut -f1)
    if [ -n "$BUILD_SIZE" ]; then
      echo "构建产物大小: $BUILD_SIZE"
    else
      echo "⚠️  无法获取构建产物大小"
    fi
  else
    echo "⚠️  du命令不可用，跳过大小检查"
  fi
fi

# 检查构建产物是否存在必要文件
echo "检查构建产物..."
if [ -f "./dist/index.html" ]; then
  echo "✅ 找到index.html"
else
  echo "❌ 未找到index.html"
  exit 1
fi

echo "🎉 部署前检查全部通过！"
echo "可以安全地部署项目了。"
