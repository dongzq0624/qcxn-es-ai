<template>
  <div class="server-error-container">
    <div class="error-code">500</div>
    <div class="error-message">{{ $t('error.serverError') }}</div>
    <p class="error-description">{{ $t('error.serverErrorDescription') }}</p>
    <div class="button-group">
      <el-button type="primary" @click="retry" class="retry-button">
        {{ $t('error.retry') }}
      </el-button>
      <el-button @click="goHome" class="home-button">
        {{ $t('error.goHome') }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'

  const router = useRouter()

  const retry = () => {
    window.location.reload()
  }

  const goHome = () => {
    router.push('/')
  }
</script>

<style scoped>
  .server-error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    text-align: center;
    padding: 20px;
  }

  .error-code {
    font-size: 120px;
    font-weight: bold;
    color: var(--el-color-warning);
    margin-bottom: 20px;
    line-height: 1;
  }

  .error-message {
    font-size: 32px;
    font-weight: 500;
    margin-bottom: 16px;
  }

  .error-description {
    font-size: 16px;
    color: var(--el-text-color-secondary);
    margin-bottom: 32px;
    max-width: 500px;
  }

  .button-group {
    display: flex;
    gap: 16px;
  }

  .retry-button,
  .home-button {
    font-size: 16px;
    padding: 12px 24px;
  }
</style>
