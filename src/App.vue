<script setup>
import { ElConfigProvider } from 'element-plus'
</script>

<template>
  <el-config-provider :message="{ max: 3 }">
    <div class="container">
      <router-view />
      <div class="link">
        <a href="https://beian.miit.gov.cn/" target="_blank">赣ICP备2025062626号</a>
      </div>
    </div>
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
  height: 100vh;
  overflow: hidden; /* 隐藏外部滚动条 */

  .container {
    overflow-y: auto;
    height: 100vh;
    margin-right: -5px; /* 隐藏滚动条 */

    .link {
      text-align: center;
    }

    a {
      display: inline;
      text-decoration: none;
      color: var(--theme-text-1);
    }
  }
}
</style>
