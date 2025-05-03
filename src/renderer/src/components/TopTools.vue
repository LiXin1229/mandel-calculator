<script setup>
import { ref } from 'vue'

let isMax = ref(false)
let isTop = ref(false)

const handleClick = async (type) => {
  switch (type) {
    case 'close':
      window.api.closeMainWindow()
      break;
    case 'maximize':
      isMax.value = await window.api.checkMaximized()
      break;
    case 'minimize':
      window.api.checkMinimized()
      break;
    case 'topup':
      isTop.value = await window.api.checkTopUp()
      console.log(isTop.value)
      break;
  }
}
</script>

<template>
  <div class="top-tools">
    <div class="tools">
      <ul class="no-drag">
        <li :class="['topup-window', isTop && 'topup']" :title="isTop ? '取消置顶' : '置顶'" @click="handleClick('topup')">
          <div class="no-scale">
            <span class="iconfont icon-top"></span>
          </div>
        </li>
        <li class="minimize-window" title="最小化" @click="handleClick('minimize')">
          <div>
            <span class="iconfont icon-min"></span>
          </div>
        </li>
        <li class="maximize-window" :title="isMax ? '向下还原' : '最大化'" @click="handleClick('maximize')">
          <div>
            <span class="iconfont icon-max"></span>
          </div>
        </li>
        <li class="close-window" title="关闭" @click="handleClick('close')">
          <div>
            <span class="iconfont icon-close"></span>
          </div>
        </li>
      </ul>
    </div>
    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
.top-tools {
  .tools {
    display: flex;
    justify-content: right;

    .topup {
      .icon-top {
        color: var(--theme-icon);
      }
    }

    .topup:hover {
      background-color: var(--theme-top-btn-hover);
      color: var(--theme-top-btn-hover);
    }

    ul {
      display: flex;
      justify-content: left;

      li {
        width: 32px;
        height: 25px;
        text-align: center;
        line-height: 25px;

        &:hover {
          background-color: var(--theme-top-btn-hover);
        }

        div:not(.no-scale) {
          transform: scale(0.7);
        }

        .no-scale {
          transform: scale(0.85);
        }

        span {
          color: var(--theme-btn-hover2);
        }
      }

      .close-window:hover {
        background-color: var(--theme-top-btn-hover-close);

        .icon-close {
          color: #fff;
        }
      }
    }
  }
}
</style>
