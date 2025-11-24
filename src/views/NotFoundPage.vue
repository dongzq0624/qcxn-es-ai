<template>
  <div class="not-found-container">
    <div class="error-code">404</div>
    <div class="error-message">{{ $t('error.pageNotFound') }}</div>
    <p class="error-description">{{ $t('error.pageNotFoundDescription') }}</p>
    <el-button type="primary" @click="goHome" class="home-button">
      {{ $t('error.goHome') }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'

  const router = useRouter()

  const goHome = () => {
    router.push('/')
  }
</script>

<style scoped>
  .not-found-container {
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
    color: var(--el-color-primary);
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

  .home-button {
    font-size: 16px;
    padding: 12px 24px;
  }
</style>
