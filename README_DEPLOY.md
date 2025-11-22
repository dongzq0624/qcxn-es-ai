# 自动化部署指南

本项目使用GitHub Actions进行自动化构建和部署。下面是详细的配置步骤。

## 环境变量配置

### 必要的GitHub Secrets

在GitHub仓库的`Settings > Secrets and variables > Actions`中添加以下Secrets：

1. **GITHUB_TOKEN** - 这是GitHub Actions自动提供的，无需手动添加，用于授权部署到GitHub Pages

### 可选的环境变量

如果需要自定义构建过程，可以添加以下环境变量：

1. **VITE_APP_ENV** - 应用环境（如production、staging等）
2. **VITE_API_BASE_URL** - API基础URL（如果项目需要连接后端API）

## 部署流程说明

1. 当代码推送到`main`或`master`分支时，GitHub Actions工作流将自动触发
2. 工作流会执行以下步骤：
   - 检出代码
   - 设置Node.js环境
   - 安装依赖
   - 运行TypeScript类型检查
   - 运行ESLint代码检查
   - 构建项目
   - 部署到GitHub Pages（仅在push事件时）

## 自定义部署目标

如果需要部署到其他平台（如Vercel、Netlify、阿里云OSS等），请按照以下步骤修改：

### 部署到Vercel

1. 在GitHub Secrets中添加`VERCEL_TOKEN`
2. 在`.github/workflows/deploy.yml`中添加Vercel部署步骤：

```yaml
- name: Deploy to Vercel
  if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master')
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
    vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
    vercel-args: '--prod'
```

### 部署到阿里云OSS

1. 在GitHub Secrets中添加`ALIYUN_ACCESS_KEY_ID`和`ALIYUN_ACCESS_KEY_SECRET`
2. 在`.github/workflows/deploy.yml`中添加阿里云OSS部署步骤：

```yaml
- name: Setup Node.js for OSS deployment
  uses: actions/setup-node@v4
  with:
    node-version: '18'

- name: Install OSS client
  run: npm install -g ali-oss-cli

- name: Deploy to Aliyun OSS
  if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master')
  run: |
    aliyun configure set --profile oss-deploy --access-key-id ${{ secrets.ALIYUN_ACCESS_KEY_ID }} --access-key-secret ${{ secrets.ALIYUN_ACCESS_KEY_SECRET }} --region <your-region>
    aliyun oss sync ./dist oss://<your-bucket-name> --delete
```

## 注意事项

1. 确保GitHub仓库已启用GitHub Pages功能（在仓库Settings > Pages中设置）
2. 首次部署可能需要等待几分钟才能在GitHub Pages URL上看到更新
3. 如果遇到部署问题，请检查GitHub Actions工作流日志以获取详细错误信息
