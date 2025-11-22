// 端到端测试用例 - 验证部署后的应用功能

// 注意：运行此测试需要安装依赖：npm install --save-dev jest puppeteer

const puppeteer = require('puppeteer')

describe('ES-AI 应用部署测试', () => {
  let browser
  let page

  beforeAll(async () => {
    // 启动浏览器
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  })

  beforeEach(async () => {
    // 打开新页面
    page = await browser.newPage()
    // 设置页面大小
    await page.setViewport({ width: 1920, height: 1080 })
  })

  afterAll(async () => {
    // 关闭浏览器
    await browser.close()
  })

  // 测试本地构建版本
  describe('本地构建验证', () => {
    // 此测试需要先运行 npm run build 和 npm run preview
    // 由于环境限制，这里仅提供测试模板

    it('页面标题应正确显示', async () => {
      // 连接到本地预览服务器
      await page.goto('http://localhost:8080')

      // 验证页面标题
      const title = await page.title()
      expect(title).not.toBe('')
    })

    it('应用应正常加载', async () => {
      // 连接到本地预览服务器
      await page.goto('http://localhost:8080')

      // 等待应用加载完成（根据实际情况调整选择器）
      await page.waitForSelector('#app')

      // 验证应用内容
      const appContent = await page.content()
      expect(appContent).toContain('app')
    })
  })

  // 测试远程部署版本
  describe('远程部署验证', () => {
    it('远程页面应可访问', async () => {
      // 替换为实际的部署URL
      const deploymentUrl = 'https://your-username.github.io/es-ai'

      // 设置导航超时
      page.setDefaultNavigationTimeout(30000)

      try {
        const response = await page.goto(deploymentUrl)
        const statusCode = response.status()

        // 验证状态码
        expect(statusCode).toBe(200)
      } catch (error) {
        console.error('无法访问部署的应用:', error)
        throw error
      }
    })

    it('远程页面内容应完整', async () => {
      // 替换为实际的部署URL
      const deploymentUrl = 'https://your-username.github.io/es-ai'

      try {
        await page.goto(deploymentUrl)

        // 等待一定时间让页面完全加载
        await page.waitForTimeout(5000)

        // 捕获页面截图用于验证
        await page.screenshot({ path: 'deployment-validation.png' })

        // 验证关键元素存在
        const bodyContent = await page.evaluate(() => document.body.textContent)
        expect(bodyContent.length).toBeGreaterThan(100)
      } catch (error) {
        console.error('验证远程页面失败:', error)
        throw error
      }
    })
  })
})
