<script setup>
import TopTools from '../components/TopTools.vue'
import { faDeleteLeft, faRepeat, faCode, faUniversalAccess, faClockRotateLeft, faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons'
import { faTrashCan } from '@fortawesome/free-regular-svg-icons/faTrashCan'
import { reactive, ref } from 'vue'

const main_btn_rows = [
  [
    { id: 0,  value: '7', display: '7' },
    { id: 1, value: '8', display: '8' },
    { id: 2, value: '9', display: '9' },
    { id: 3, value: 'delete', display: faDeleteLeft },
    { id: 4, value: 'clear', display: faTrashCan }
  ],
  [
    { id: 6, value: '4', display: '4' },
    { id: 7, value: '5', display: '5' },
    { id: 8, value: '6', display: '6' },
    { id: 9, value: '+', display: '+' },
    { id: 10, value: '*', display: '×' }
  ],
  [
    { id: 11, value: '1', display: '1' },
    { id: 12, value: '2', display: '2' },
    { id: 13, value: '3', display: '3' },
    { id: 14, value: '-', display: '−' },
    { id: 15, value: '/', display: '/' }
  ],
  [
    { id: 16, value: '0', display: '0' },
    { id: 17, value: '.', display: '.' },
    { id: 18, value: 'changeType', display: faRepeat },
    { id: 19, value: 'resolveEquation', display: faCode },
    { id: 20, value: '=', display: '=' }
  ]
]

const math_btn_rows = [
  [
    { id: 21, value: 'x', display: '𝓍' },
    { id: 22, value: '^', display: '^' },
    { id: 23, value: 'lg', display: '𝑙𝑔' },
    { id: 24, value: 'ln', display: '𝑙𝑛' },
    { id: 25, value: 'e', display: '𝒆' },
    { id: 26, value: 'π', display: 'π' }
  ],
  [
    { id: 27, value: 'deg', display: 'deg' },
    { id: 28, value: 'sin', display: '𝑠𝑖𝑛' },
    { id: 29, value: 'cos', display: '𝑐𝑜𝑠' },
    { id: 30, value: 'tan', display: '𝑡𝑎𝑛' },
    { id: 31, value: '(', display: '(' },
    { id: 32, value: ')', display: ')' }
  ]
]

const functional_btn_rows = [
  [
    { id: 33, value: 'changeTheme', display: faUniversalAccess },
    { id: 34, value: 'checkoutHistory', display: faClockRotateLeft }
  ],
  [
    { id: 35, value: 'left', display: faAngleLeft },
    { id: 36, value: 'right', display: faAngleRight }
  ],
  [
    { id: 37, value: '°', display: '°' },
    { id: 38, value: '\'', display: '\'' },
    { id: 39, value: '\"', display: '\"' }
  ],
  [
    { id: 40, value: 'esc', display: 'ESC' },
    { id: 41, value: 'enter', display: 'Enter' }
  ]
]

const italic_list1 = [22]
const italic_list2 = [26]
const larger_list = [9, 10, 14, 17, 20]
const smaller_list = [3, 18, 19]
const thinner_list = [27]

const solve_type = reactive({
  value: 'hybrid',
})

const changeSolveType = () => {
  if (solve_type.value === 'hybrid') {
    solve_type.value = 'bisection'
  } else if (solve_type.value === 'bisection') {
    solve_type.value = 'hybrid'
  }
}

let click_btn = ref(-1)
const handleButtonClick = (button) => {
  console.log(button)
  click_btn.value = button.id
  setTimeout(() => {
    click_btn.value = -1
  }, 200)
}
</script>

<template>
  <div class="main-calcul">
    <div class="top-bar drag">
      <div class="left">
        <img src="../assets/electron.svg" alt="">
        Mandel Computing Unit
      </div>
      <div class="right">
        <TopTools />
      </div>
    </div>
    <div class="main-content">
      <div class="screen">screen</div>
      <div class="functional-panel">
        <div class="top">
          <div class="left">
            <span class="functional_btn" v-for="btn in functional_btn_rows[0]" :key="btn.id" @click="handleButtonClick(btn)">
              <font-awesome-icon :icon="btn.display" />
            </span>
          </div>
          <div class="right">
            <span :class="['round-btn', btn.id === click_btn && 'active']" v-for="btn in functional_btn_rows[1]" :key="btn.id" @click="handleButtonClick(btn)">
              <font-awesome-icon :icon="btn.display" />
            </span>
          </div>
        </div>
        <div class="bottom">
          <div class="left">
            <span :class="['functional_btn', btn.id === click_btn && 'active']" v-for="btn in functional_btn_rows[2]" :key="btn.id" @click="handleButtonClick(btn)">
              {{ btn.display }}
            </span>
          </div>
          <div class="solve-type-btn functional_btn" @click="changeSolveType">
            {{ solve_type.value }}
          </div>
          <div class="right">
            <span :class="['round-btn', btn.id === click_btn && 'active', italic_list2.includes(btn.id) && 'italic2']" v-for="btn in functional_btn_rows[3]" :key="btn.id" @click="handleButtonClick(btn)">
              {{ btn.display }}
            </span>
          </div>
        </div>
      </div>
      <div class="math-panel">
        <div class="row" v-for="(row, rowIndex) in math_btn_rows" :key="rowIndex">
          <div
            :class="['col', button.id === click_btn && 'active', italic_list1.includes(button.id) && 'italic1', italic_list2.includes(button.id) && 'italic2', thinner_list.includes(button.id) && 'thinner']"
            v-for="(button) in row"
            :key="button.id"
            @click="handleButtonClick(button)"
          >
            <template v-if="typeof button.display === 'string'">
              {{ button.display }}
            </template>
            <template v-else>
              <font-awesome-icon :icon="button.display" />
            </template>
          </div>
        </div>
      </div>
      <div class="main-panel">
        <div class="row" v-for="(row, rowIndex) in main_btn_rows" :key="rowIndex">
        <div
          :class="['col', button.id === click_btn && 'active', larger_list.includes(button.id) && 'larger', smaller_list.includes(button.id) && 'smaller']"
          v-for="(button) in row"
          :key="button.id"
          @click="handleButtonClick(button)"
        >
          <template v-if="typeof button.display === 'string'">
            {{ button.display }}
          </template>
          <template v-else>
            <font-awesome-icon :icon="button.display" />
          </template>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.main-calcul {
  color: var(--theme-text-2);
  background-color: var(--theme-background);

  .top-bar {
    display: flex;
    justify-content: space-between;
    height: 25px;
    line-height: 25px;
    background-color: var(--theme-top);
    font-style: italic;
    font-size: 14px;
    padding-left: 30px;

    img {
      height: 18px;
      position: absolute;
      top: 4px;
      left: 7px;
    }
  }

  .main-content {
    height: calc(100vh - 25px);
    padding: 10px;
    cursor: default;

    .screen {
      height: calc(24vh - 2px);
      width: calc(100vw - 20px);
      border: 1px solid var(--theme-border);
      border-radius: 5px;
      padding: 10px;
      background-color: var(--theme-screen);
    }

    .functional-panel {
      height: 17vh;
      width: calc(100vw - 20px);

      .top {
        display: flex;
        justify-content: space-between;

        .left {
          .functional_btn {
            display: inline-block;
            width: 7vh;
            height: 7vh;
            line-height: 7vh;
            text-align: center;
            font-size: calc(3vh);
            border-radius: 1vh;
            color: var(--theme-text-2);
            margin-top: 7px;
            margin-left: 7px;
            transition: 0.2s all linear;

            &:hover {
              background-color: var(--theme-btn-hover2);
            }
          }
        }
      }

      .bottom {
        display: flex;
        justify-content: space-between;

        .functional_btn {
          display: inline-block;
          width: calc((100vw - 20px - 15px) / 7);
          height: calc((17vh - 9px) / 2);
          line-height: calc((17vh - 9px) / 2);
          margin-top: 5px;
          text-align: center;
          font-size: calc(3vh);
          background-color: var(--theme-btn);
          color: var(--theme-text-2);
          border: 1px solid var(--theme-border);
          border-radius: 10px;
          transform: scale(0.9);
          transition: 0.2s all linear;
        }

        .solve-type-btn {
          width: calc((100vw - 20px - 15px) / 5);
          font-size: calc(2vh);
        }
      }

      .round-btn {
        display: inline-block;
        width: 7vh;
        height: 7vh;
        line-height: 7vh;
        text-align: center;
        font-size: calc(2vh);
        background-color: var(--theme-btn);
        color: var(--theme-text-2);
        border: 1px solid var(--theme-border);
        border-radius: 50%;
        margin-top: 7px;
        margin-right: 7px;
        transition: 0.2s all linear;
      }
    }

    .math-panel {
      height: 17vh;
      width: calc(100vw - 20px);
      padding: 3px 0;

      .row {
        display: flex;
        justify-content: space-between;

        .col {
          width: calc((100vw - 20px - 15px) / 6);
          height: calc((17vh - 9px) / 2);
          line-height: calc((17vh - 9px) / 2);
          margin-bottom: 3px;
          text-align: center;
          font-size: calc(3vh);
          background-color: var(--theme-btn);
          color: var(--theme-text-2);
          border: 1px solid var(--theme-border);
          border-radius: 10px;
          transform: scale(0.9);
          transition: 0.2s all linear;
        }
      }
    }

    .main-panel {
      height: calc(42vh - 35px);
      width: calc(100vw - 20px);
      padding: 3px 0;

      .row {
        display: flex;
        justify-content: space-between;

        .col {
          width: calc((100vw - 20px - 12px) / 5);
          height: calc((42vh - 35px - 15px - 5px) / 4);
          line-height: calc((42vh - 35px - 15px) / 4);
          margin-bottom: 3px;
          text-align: center;
          font-size: calc(3vh);
          background-color: var(--theme-btn);
          color: var(--theme-icon);
          border: 1px solid var(--theme-border);
          border-radius: 5px;
          transition: 0.2s all linear;
        }
      }
    }
  }

  .active {
    background-color: var(--theme-btn-hover1) !important;
  }

  .italic1 {
    font-style: italic;
    font-family: 'Dancing Script', 'Segoe Script', 'Brush Script MT', cursive;
  }

  .italic2 {
    font-style: italic;
    font-family: "Microsoft YaHei", "SimHei", sans-serif;
  }

  .larger {
    // transform: scale(1.2);
    font-size: 4vh !important;
  }

  .smaller {
    font-size: 2.5vh !important;
  }

  .thinner {
    font-style: italic;
    font-family: cursive;
  }
}
</style>
