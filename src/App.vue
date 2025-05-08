<script setup>
import { ElConfigProvider } from 'element-plus'
</script>

<template>
  <el-config-provider :message="{ max: 3 }">
    <router-view />
  </el-config-provider>
</template>

<style lang="scss">
body {
  .el-message--info {
    background-color: var(--theme-history-bg);
    cursor: default;
    border: 0;

    .el-message__content {
      color: var(--theme-msg-info);
    }
  }
}
</style>
