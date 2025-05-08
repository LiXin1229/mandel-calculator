<script setup>
import { faDeleteLeft, faRepeat, faCode, faUniversalAccess, faClockRotateLeft, faAngleLeft, faAngleRight, faAngleUp, faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { faTrashCan } from '@fortawesome/free-regular-svg-icons/faTrashCan'
import { h, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { calculate, decimalToDMS } from '../utils/calculate'
import { solveEquationByHybrid, solveEquationByBisection } from '../utils/solve'
import { ElMessage } from 'element-plus'

const main_btn_rows = [
  [
    { id: 0,  value: '7', display: '7' },
    { id: 1, value: '8', display: '8' },
    { id: 2, value: '9', display: '9' },
    { id: 3, value: 'Backspace', display: faDeleteLeft },
    { id: 4, value: '', display: faTrashCan }
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
    { id: 23, value: 'lg(', display: '𝑙𝑔' },
    { id: 24, value: 'ln(', display: '𝑙𝑛' },
    { id: 25, value: 'e', display: '𝒆' },
    { id: 26, value: 'π', display: 'π' }
  ],
  [
    { id: 27, value: 'rad(', display: '𝓇𝒶𝒹' },
    { id: 28, value: 'sin(', display: '𝑠𝑖𝑛' },
    { id: 29, value: 'cos(', display: '𝑐𝑜𝑠' },
    { id: 30, value: 'tan(', display: '𝑡𝑎𝑛' },
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
    { id: 35, value: 'left', display: faAngleLeft, _display: faAngleUp },
    { id: 36, value: 'right', display: faAngleRight, _display: faAngleDown }
  ],
  [
    { id: 37, value: '°', display: '°' },
    { id: 38, value: '\'', display: '\'' },
    { id: 39, value: '\"', display: '\"' }
  ],
  [
    { id: 40, value: 'Escape', display: 'Esc' },
    { id: 41, value: 'enter', display: 'Enter' }
  ]
]

// 需修改样式的按钮
const italic_list1 = [22]
const italic_list2 = [26]
const larger_list = [9, 10, 14, 17, 20]
const smaller_list = [3, 18, 19]
const spical_list = [20]

// 解方程的方法
const solve_type = reactive({
  value: 'Hybrid',
})

// 更换解方程方法
const TriggerSolveType = () => {
  if (solve_type.value === 'Hybrid') { // 混合式 (牛顿法 + 二分法)
    solve_type.value = 'Bisection'
  } else if (solve_type.value === 'Bisection') { // 混合式 (二分法)
    solve_type.value = 'Hybrid'
  }
}

let click_btn = ref(-1)

// 原式 (输入的表达式)
let ori_expression = ref('')

// 点击按钮
const handleButtonClick = (button) => {
  // console.log(ori_expression.value)
  click_btn.value = button.id
  setTimeout(() => {
    click_btn.value = -1
  }, 200)

  if (button.id === 33) { // 主题切换
    if (currentTheme.value === 'dark') {
      currentTheme.value = 'light'
      localStorage.setItem('theme', 'light')
    } else {
      currentTheme.value = 'dark'
      localStorage.setItem('theme', 'dark')
    }
    document.documentElement.classList.toggle('dark')
    return
  }

  if (showInitialX.value === true) { // 在设置初始值时进入 handleHybridClick 或 handleBisectionClick
    if ([18, 41].includes(button.id)) return
    if ([34].includes(button.id)) {
      handleButtonClick({ id: 19 })
      handleButtonClick({ id: 34 })
      return
    }
    if (solve_type.value === 'Hybrid') {
      handleHybridClick(button)
    } else if (solve_type.value === 'Bisection') {
      handleBisectionClick(button)
    }
    return
  }

  if (read_history.value) { // 阅读历史窗口只允许以下操作
    if ([35, 36, 40, 41].includes(button.id)) {
      checkoutHistory(button)
    }
    if (![34, 40, 41].includes(button.id)) return
  }

  if ([40, 41].includes(button.id)) return

  if (button.id === 35) { // 光标左移
    moveCursor(cursor_index.value - 1, ori_expression.value.length)
  }

  else if (button.id === 36) { // 光标右移
    moveCursor(cursor_index.value + 1, ori_expression.value.length)
  }

  else if ([27, 28, 29, 30].includes(button.id)) { // 三角函数
    const before = ori_expression.value.slice(0, cursor_index.value)
    const after = ori_expression.value.slice(cursor_index.value)
    ori_expression.value = before + button.value + after
    moveCursor(cursor_index.value + 4, ori_expression.value.length)
  }

  else if ([23, 24].includes(button.id)) { // 对数函数
    const before = ori_expression.value.slice(0, cursor_index.value)
    const after = ori_expression.value.slice(cursor_index.value)
    ori_expression.value = before + button.value + after
    moveCursor(cursor_index.value + 3, ori_expression.value.length)
  }

  else if ([3, 4].includes(button.id)) { // 删除单个字符或单行
    if (button.value) {
      if (history.length > 0 && ori_expression.value === '') {
        ori_expression.value = history.pop()
        cursor_index.value = ori_expression.value.length
      } else {
        if (cursor_index.value - 1 < 0) return
        const before = ori_expression.value.slice(0, cursor_index.value - 1)
        const after = ori_expression.value.slice(cursor_index.value)

        ori_expression.value = before + after
        moveCursor(cursor_index.value - 1, ori_expression.value.length)
      }
    } else {
      ori_expression.value = ''
      cursor_index.value = 0
    }
  }

  else if (button.id === 18) { // 转换成 六十进制角度
    try {
      ori_expression.value = decimalToDMS(ori_expression.value)
      moveCursor(ori_expression.value.length, ori_expression.value.length)
    } catch (err) {
      // alert(err)
      ElMessage({
        message: '请输入十进制角度',
        type: 'info'
      })
    }
  }

  else if (button.id === 34) {
    if (read_history.value) {
      read_history.value = false
    } else {
      initHistory()
    }
  }

  // 普通计算
  else if (button.id === 20) {
    handleCalculate()
    moveCursor(ori_expression.value.length, ori_expression.value.length)
  }

  // 解方程
  else if (button.id === 19) {
    switchToSolveType()
  }

  else {
    const before = ori_expression.value.slice(0, cursor_index.value)
    const after = ori_expression.value.slice(cursor_index.value)
    ori_expression.value = before + button.value + after
    moveCursor(cursor_index.value + 1, ori_expression.value.length)
  }

  flicker.value = true
}

// x0 (初始值)
let x0 = ref('1')
// 设置x0的光标索引
let x0_cursor_index = ref(0)

const handleHybridClick = (button) => {
  if (button.id === 35) { // 光标左移
    moveCursor(x0_cursor_index.value - 1, x0.value.length)
  }

  else if (button.id === 36) { // 光标右移
    moveCursor(x0_cursor_index.value + 1, x0.value.length)
  }

  else if ([3, 4].includes(button.id)) { // 删除单个字符或整行
    if (button.value) {
      if (x0_cursor_index.value - 1 < 0) return
      const before = x0.value.slice(0, x0_cursor_index.value - 1)
      const after = x0.value.slice(x0_cursor_index.value)

      x0.value = before + after
      moveCursor(x0_cursor_index.value - 1, x0.value.length)
    } else {
      x0.value = ''
    }
  }

  else if (x0.value.length > 10) {
    // alert('长度超出限制')
    ElMessage({
      message: '输入长度超出限制',
      type: 'info'
    })
  }

  else if ([27, 28, 29, 30].includes(button.id)) {
    const before = x0.value.slice(0, x0_cursor_index.value)
    const after = x0.value.slice(x0_cursor_index.value)
    x0.value = before + button.value + after
    moveCursor(x0_cursor_index.value + 4, x0.value.length)
  }

  else if ([23, 24].includes(button.id)) {
    const before = x0.value.slice(0, x0_cursor_index.value)
    const after = x0.value.slice(x0_cursor_index.value)
    x0.value = before + button.value + after
    moveCursor(x0_cursor_index.value + 3, x0.value.length)
  }

  else if (button.id === 20) {
    handleSolve()
  }

  else if (button.id === 19 || button.id === 40) {
    switchToSolveType()
  }

  else {
    const before = x0.value.slice(0, x0_cursor_index.value)
    const after = x0.value.slice(x0_cursor_index.value)
    x0.value = before + button.value + after
    moveCursor(x0_cursor_index.value + 1, x0.value.length)
  }

  flicker.value = true
}

// 左右边界
let x_list = reactive(['', ''])
let isleft = ref(0)
let xlr_cursor_index = reactive([0, 0])

const handleBisectionClick = (button) => {
  if (button.id === 35) { // 光标左移
    if (xlr_cursor_index[isleft.value] - 1 < 0 && isleft.value === 1) {
      isleft.value = 0
      xlr_cursor_index[0] = x_list[0].length
    } else {
      moveCursor(xlr_cursor_index[isleft.value] - 1, x_list[isleft.value].length)
    }
  }

  else if (button.id === 36) { // 光标右移
    if (xlr_cursor_index[isleft.value] + 1 > x_list[isleft.value].length && isleft.value === 0) {
      isleft.value = 1
      xlr_cursor_index[1] = 0
    } else {
      moveCursor(xlr_cursor_index[isleft.value] + 1, x_list[isleft.value].length)
    }
  }

  else if ([3, 4].includes(button.id)) { // 删除单个字符或整行
    if (button.value) {
      if (x_list[isleft.value].length <= 0 && isleft.value === 1) {
        isleft.value = 0
        xlr_cursor_index[0] = x_list[0].length
      } else {
        if (xlr_cursor_index[isleft.value] - 1 < 0) return
        const before = x_list[isleft.value].slice(0, xlr_cursor_index[isleft.value] - 1)
        const after = x_list[isleft.value].slice(xlr_cursor_index[isleft.value])

        x_list[isleft.value] = before + after
        console.log(x_list[isleft.value])
        moveCursor(xlr_cursor_index[isleft.value] - 1, x_list[isleft.value].length)
      }
    } else {
      x_list[isleft.value] = ''
    }
  }

  else if (x_list[isleft.value].length > 10) {
    // alert('长度超出限制')
    ElMessage({
      message: '输入长度超出限制',
      type: 'info'
    })
  }

  else if ([27, 28, 29, 30].includes(button.id)) {
    const before = x_list[isleft.value].slice(0, xlr_cursor_index[isleft.value])
    const after = x_list[isleft.value].slice(xlr_cursor_index[isleft.value])
    x_list[isleft.value] = before + button.value + after
    moveCursor(xlr_cursor_index[isleft.value] + 4, x_list[isleft.value].length)
  }

  else if ([23, 24].includes(button.id)) {
    const before = x_list[isleft.value].slice(0, xlr_cursor_index[isleft.value])
    const after = x_list[isleft.value].slice(xlr_cursor_index[isleft.value])
    x_list[isleft.value] = before + button.value + after
    moveCursor(xlr_cursor_index[isleft.value] + 3, x_list[isleft.value].length)
  }

  else if (button.id === 20) {
    handleSolve()
  }

  else if (button.id === 19 || button.id === 40) {
    switchToSolveType()
  }

  else {
    const before = x_list[isleft.value].slice(0, xlr_cursor_index[isleft.value])
    const after = x_list[isleft.value].slice(xlr_cursor_index[isleft.value])
    x_list[isleft.value] = before + button.value + after
    moveCursor(xlr_cursor_index[isleft.value] + 1, x_list[isleft.value].length)
  }

  flicker.value = true
}

// 计算历史 (栈)
const history = reactive([])
let read_history = ref(false)
const history_list = reactive([])
let active_history = ref(0)
const historyRef = ref(null)

const initHistory = () => {
  read_history.value = true
  history_list.length = 0
  console.log(history.length)

  active_history.value = history.length - 1
  history.forEach(item => {
    history_list.push(beautifyDisplay(item))
  })

  nextTick(() => {
    const active = document.querySelector('.active_history') || { offsetTop: 0 }
    historyRef.value.scrollTo({
      top: active.offsetTop
    })
  })
}

const checkoutHistory = (button) => {
  if (button.id === 35) {
    active_history.value--
  } else if (button.id === 36) {
    active_history.value++
  } else if (button.id === 40) {
    read_history.value = false
    return
  } else if (button.id === 41) {
    ori_expression.value = history[active_history.value]
    read_history.value = false
    cursor_index.value = ori_expression.value.length
    return
  }
  const active = document.querySelector('.active_history')
  const top = active.offsetTop - historyRef.value.clientHeight + active.getBoundingClientRect().height
  historyRef.value.scrollTo({
    top: top,
    behavior: 'smooth'
  })
  active_history.value = Math.max(0, Math.min(history.length - 1, active_history.value))
}

// 进行普通计算
const handleCalculate = () => {
  try {
    const pre_ori = ori_expression.value
    ori_expression.value = calculate(ori_expression.value)
    history.push(pre_ori)
  } catch (err) {
    // alert('请输入有效表达式')
    ElMessage({
      message: '请输入有效表达式',
      type: 'info'
    })
  }
}

// 是否显示解方程的初始值设置
let showInitialX = ref(false)
let isSolving = reactive([])

// 普通计算与解方程的切换
const switchToSolveType = () => {
  flicker.value = true
  screenCuror.value = !screenCuror.value
  showInitialX.value = !showInitialX.value
  showInitialX.value ? isSolving.push(19) : isSolving.pop()

  if (showInitialX.value) {
    x0_cursor_index.value = x0.value.length
  }
}

// 解方程
const handleSolve = () => {
  if (solve_type.value === 'Hybrid') {
    try {
      let _x0 = ''
      try {
        _x0 = calculate(x0.value)
      } catch (err) {
        ElMessage({
          message: '请输入有效表达式',
          type: 'info'
        })
        return
      }
      const x_res = solveEquationByHybrid(ori_expression.value, _x0)
      console.log('使用混合法, ', ori_expression.value, x0.value, ' x = ', x_res)
      history.push(ori_expression.value + ' = 0\u00A0\u00A0\u00A0' + '𝓍 = ' + x_res + '\u00A0\u00A0\u00A0' + '[𝓍₀ = ' + _x0 + ']')
    } catch (err) {
      // alert(err)
      ElMessage({
        message: err.toString().slice(7),
        type: 'info'
      })
    }
  } else if (solve_type.value === 'Bisection') {
    try {
      let _x0 = ''
      let _xl = ''
      let _xr = ''
      try {
        _x0 = calculate(x0.value)
        _xl = calculate(x_list[0])
        _xr = calculate(x_list[1])
      } catch (err) {
        ElMessage({
          message: '请输入有效表达式',
          type: 'info'
        })
        return
      }
      const x_res = solveEquationByBisection(ori_expression.value, _x0, _xl, _xr)
      console.log('使用二分法, ', ori_expression.value, x_list[0], x_list[1], ' x = ', x_res)
      history.push(`${ori_expression.value} = 0\u00A0\u00A0\u00A0𝓍 = ${x_res}\u00A0\u00A0\u00A0[𝓍ₗ = ${_xl}, 𝓍ᵣ = ${_xr}]`)
    } catch (err) {
      // alert(err)
      ElMessage({
        message: err.toString().slice(7),
        type: 'info'
      })
    }
  }
}

// 光标索引
let cursor_index = ref(0)
// 屏幕光标
let screenCuror = ref(true)

// 移动光标
const moveCursor = (newIndex, length) => {
  if (showInitialX.value && solve_type.value === 'Hybrid') {
    x0_cursor_index.value =  Math.max(0, Math.min(newIndex, length))
    return
  } else if (showInitialX.value && solve_type.value === 'Bisection') {
    xlr_cursor_index[isleft.value] =  Math.max(0, Math.min(newIndex, length))
    return
  }
  cursor_index.value = Math.max(0, Math.min(newIndex, length))
}

const renderInitialX = () => {
  const isHybrid = solve_type.value === 'Hybrid'

  let before = ''
  let after = ''
  let left_before = ''
  let left_after = ''
  let right_before = ''
  let right_after = ''
  let border = {}

  if (showInitialX.value) {
    border = {
      border: '2px solid var(--theme-isSolving-btn)',
      borderRadius: '1vh',
    }
  }

  if (isHybrid) {
    before = x0.value.slice(0, x0_cursor_index.value)
    after = x0.value.slice(x0_cursor_index.value)
  } else {
    left_before = x_list[0].slice(0, xlr_cursor_index[0])
    left_after = x_list[0].slice(xlr_cursor_index[0])
    right_before = x_list[1].slice(0, xlr_cursor_index[1])
    right_after = x_list[1].slice(xlr_cursor_index[1])
  }

  before = beautifyDisplay(before)
  after = beautifyDisplay(after)

  const baseStyle = {
    position: 'absolute',
    left: 'calc(25vw + 10px)',
    right: 'calc(32vw + 10px)',
    height: '3vh',
    lineHeight: '3vh',
    textAlign: 'left',
    fontSize: 'calc(1vh + 1vw)',
    marginTop: '8px',
    backgroundColor: 'var(--theme-screen)',
    padding: '0 0 15px 5px',
  }

  if (isHybrid) {
    return h('div', {
      style: {
        ...baseStyle,
        height: '6.5vh',
        lineHeight: '6vh',
        ...border
      }
    }, [
      h('span', { class: 'title' }, '𝓍₀ = '),
      before,
      showInitialX.value && h('span', {
        style: {
          display: 'inline-block',
          position: 'relative',
          width: 0,
          color: 'var(--theme-cursor)',
          opacity: flicker.value ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
          transform: 'translate(-2px, -3px) scale(1.2)'
        }
      }, '|'),
      after
    ])
  }

  return h('div', {
    style: {
      ...baseStyle,
      height: '7vh',
      ...border,
    }
  }, [
    h('div',
      [
        h('span', '𝓍ₗ = '),
        left_before,
        (!isleft.value && showInitialX.value) ? h('span', {
          style: {
            display: 'inline-block',
            position: 'relative',
            width: 0,
            color: 'var(--theme-cursor)',
            opacity: flicker.value ? 1 : 0,
            transition: 'opacity 0.3s ease-out',
            transform: 'translate(-2px, -3px) scale(1.2)'
          }
        }, '|') : '',
        left_after
      ]
    ),
    h('div',
      [
        h('span', '𝓍ᵣ = '),
        right_before,
        (isleft.value && showInitialX.value) ? h('span', {
          style: {
            display: 'inline-block',
            position: 'relative',
            width: 0,
            color: 'var(--theme-cursor)',
            opacity: flicker.value ? 1 : 0,
            transition: 'opacity 0.3s ease-out',
            transform: 'translate(-2px, -3px) scale(1.2)'
          }
        }, '|') : '',
        right_after
      ]
    )
  ])
}

// 渲染屏幕表达式
const renderDisplay = () => {
  let pre = ''
  if (history.length > 0) {
    pre = history[history.length - 1]
  }

  let before = ori_expression.value.slice(0, cursor_index.value)
  let after = ori_expression.value.slice(cursor_index.value)

  pre = beautifyDisplay(pre)
  before = beautifyDisplay(before)
  after = beautifyDisplay(after)

  const currentLine = h('div', {
    style: {
      color: 'var(--theme-text-2)',
      'font-size': 'calc(2vh + 1vw)',
      'overflow-wrap': 'break-word',
      overflow: 'hidden',
      width: 'calc(100vw - 40px)',
      height: 'calc(24vh - 24px)',
    }
  }, [
    before,
    screenCuror.value && h('span', {
      style: {
        display: 'inline-block',
        position: 'relative',
        width: 0,
        color: 'var(--theme-cursor)',
        opacity: flicker.value ? 1 : 0,
        transition: 'opacity 0.3s ease-out',
        transform: 'translate(-2px, -3px) scale(1.2)'
      }
    }, '|'),
    after
  ])

  if (pre) {
    return h('div', {
      style: {
        height: 'calc(24vh - 30px)'
      }
    }, [
      h('div', {
        style: {
          color: 'var(--theme-icon-func)',
          'font-size': 'calc(1.2vh + 1vw)',
          height: '2.6vh',
          width: 'calc(100vw - 40px)',
          'line-height': '2vh',
          'white-space': 'nowrap',
          overflow: 'hidden',
          'text-overflow': 'ellipsis'
        }
      }, pre),
      currentLine
    ])
  }

  return h('div', {
    style: {
      height: 'calc(24vh - 30px)'
    }
  }, [currentLine])
}

let interval

const beautifyDisplay = (str) => {
  return [
    { pattern: /rad/g, replacement: '𝓇𝒶𝒹' },
    { pattern: /lg/g, replacement: '𝑙𝑔' },
    { pattern: /ln/g, replacement: '𝑙𝑛' },
    { pattern: /sin/g, replacement: '𝑠𝑖𝑛' },
    { pattern: /cos/g, replacement: '𝑐𝑜𝑠' },
    { pattern: /tan/g, replacement: '𝑡𝑎𝑛' },
    { pattern: /-/g, replacement: '−' },
    { pattern: /\*/g, replacement: '×' },
    { pattern: /x/g, replacement: '𝓍' },
    { pattern: /e/g, replacement: '𝒆' }
  ].reduce((acc, { pattern, replacement }) =>
    acc.replace(pattern, replacement), str)
}

// 光标样式的闪烁控制
let flicker = ref(true)

let handleKeyUp // 存储事件处理函数

const bindingKey = () => {
  const allButtons = [
    ...main_btn_rows.flat(),
    ...math_btn_rows.flat(),
    ...functional_btn_rows.flat()
  ]

  handleKeyUp = (e) => {
    // console.log(e)
    const key = e.key
    const button = allButtons.find(btn => btn.value === key)
    if (button) {
      handleButtonClick(button)
    }
    if (['r', 'g', 's', 'i', 'n', 'c', 'o', 't', 'a', 'l', 'd', ' '].includes(key)) {
      const before = ori_expression.value.slice(0, cursor_index.value)
      const after = ori_expression.value.slice(cursor_index.value++)
      ori_expression.value = before + key + after
    } else if (key === 'Enter') {
      read_history.value ? handleButtonClick({ id: 41 }) : handleButtonClick({ id: 20 })
    } else if (['ArrowLeft', 'ArrowUp'].includes(key)) {
      handleButtonClick({ id: 35 })
    } else if (['ArrowRight', 'ArrowDown'].includes(key)) {
      handleButtonClick({ id: 36 })
    } else if (['q', ';', ':'].includes(key)) {
      handleButtonClick({ id: 37, value: '°' })
    } else if (key === 'Alt') {
      handleButtonClick({ id: 19 })
    } else if (key === 'Control') {
      handleButtonClick({ id: 18 })
    } else if (key === 'Tab') {
      TriggerSolveType()
    } else if (key === 'h') {
      handleButtonClick({ id: 34 })
    } else if (key === 'm') {
      handleButtonClick({ id: 33 })
    }
  }

  document.addEventListener('keydown', handleKeyUp)
}

let currentTheme = ref('')
const initTheme = () => {
  currentTheme.value = localStorage.getItem('theme') || 'light'
  currentTheme.value === 'dark' && document.documentElement.classList.add('dark')
}

onMounted(() => {
  interval = setInterval(() => {
    flicker.value = !flicker.value
  }, 500)

  bindingKey()
  initTheme()
})

onBeforeUnmount(() => {
  clearInterval(interval)
  document.removeEventListener('keydown', handleKeyUp)
})
</script>

<template>
  <div class="main-calcul">
    <div class="top-bar drag">
      <div class="left">
        <img src="/icon.ico" alt="">
        Mandel Computing Unit
      </div>
      <div class="right">
      </div>
    </div>
    <div class="main-content">
      <div class="screen">
        <div class="display" v-if="!read_history">
          <component :is="renderDisplay" />
        </div>
        <div class="history" v-else ref="historyRef">
          <div
            :class="['history_item', active_history === index && 'active_history']"
            v-for="(item, index) in history_list"
            :key="index"
          >
            {{ item }}
          </div>
        </div>
      </div>
      <div class="functional-panel unselectable">
        <div class="top">
          <div class="left">
            <span class="functional_btn theme-history" v-for="btn in functional_btn_rows[0]" :key="btn.id" @click="handleButtonClick(btn)">
              <font-awesome-icon :icon="btn.display" />
            </span>
          </div>
          <component :is="renderInitialX" class="render-initial-x" />
          <div class="right">
            <span :class="['round-btn', btn.id === click_btn && 'active']" v-for="btn in functional_btn_rows[1]" :key="btn.id" @click="handleButtonClick(btn)">
              <font-awesome-icon :icon="btn._display" v-if="read_history" />
              <font-awesome-icon :icon="btn.display" v-else />
            </span>
          </div>
        </div>
        <div class="bottom">
          <div class="left">
            <span :class="['functional_btn', btn.id === click_btn && 'active']" v-for="btn in functional_btn_rows[2]" :key="btn.id" @click="handleButtonClick(btn)">
              {{ btn.display }}
            </span>
          </div>
          <div class="solve-type-btn functional_btn" @click="TriggerSolveType">
            {{ solve_type.value }}
          </div>
          <div class="right">
            <span :class="['round-btn', btn.id === click_btn && 'active', italic_list2.includes(btn.id) && 'italic2']" v-for="btn in functional_btn_rows[3]" :key="btn.id" @click="handleButtonClick(btn)">
              {{ btn.display }}
            </span>
          </div>
        </div>
      </div>
      <div class="math-panel unselectable">
        <div class="row" v-for="(row, rowIndex) in math_btn_rows" :key="rowIndex">
          <div
            :class="['col', button.id === click_btn && 'active', italic_list1.includes(button.id) && 'italic1', italic_list2.includes(button.id) && 'italic2']"
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
      <div class="main-panel unselectable">
        <div class="row" v-for="(row, rowIndex) in main_btn_rows" :key="rowIndex">
          <div
            :class="['col', button.id === click_btn && 'active', larger_list.includes(button.id) && 'larger', smaller_list.includes(button.id) && 'smaller', spical_list.includes(button.id) && 'spical', isSolving.includes(button.id) && 'is_solving']"
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
  overflow: hidden;
  transition: 0.3s all ease-in-out;

  .top-bar {
    display: flex;
    justify-content: space-between;
    height: 25px;
    line-height: 25px;
    background-color: var(--theme-top);
    font-style: italic;
    font-size: 12px;
    padding-left: 30px;

    .left {
      color: #fff;
    }

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

      .history {
        overflow-y: auto;
        height: calc(24vh - 22px);

        .history_item {
          padding-left: 10px;
          line-height: 3.2vh;
          font-size: 2.5vh;
          border-top: 1.5px solid transparent;
          border-bottom: 1.5px solid transparent;
        }

        .active_history {
          border-top: 1.5px solid var(--theme-active-history);
          border-bottom: 1.5px solid var(--theme-active-history);
          background-color: var(--theme-history-bg);
        }
      }
    }

    .functional-panel {
      height: 16.5vh;
      width: calc(100vw - 20px);
      margin-bottom: 5px;

      .top {
        position: relative;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 5px;
        margin-bottom: 5px;

        .left {
          .functional_btn {
            display: inline-block;
            width: calc(3vh + 2vw);
            height: calc(3vh + 2vw);
            line-height: calc(3vh + 2vw);
            text-align: center;
            font-size: calc(2vh + 0.5vw);
            border-radius: 1vh;
            color: var(--theme-icon-func);
            margin-top: 10px;
            margin-right: 5px;
            transition: 0.2s all linear;
          }
        }

        .render-initial-x {
          border: 2px solid transparent;
          border-radius: 1vh;
        }
      }

      .bottom {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 4px 0;

        .functional_btn {
          display: inline-block;
          width: calc((100vw - 20px - 15px) / 7);
          height: calc((17vh - 9px) / 2);
          line-height: calc((17vh - 9px) / 2);
          margin-top: 5px;
          text-align: center;
          font-size: calc(2vh + 0.5vw);
          background-color: var(--theme-btn);
          color: var(--theme-text-2);
          border: 1px solid var(--theme-border);
          border-radius: 10px;
          transform: scale(0.9);
          transition: 0.2s all linear;
        }

        .solve-type-btn {
          width: calc((100vw - 20px - 15px) / 5);
          font-size: calc(1.5vh + 1vw);
          background-color: var(--theme-btn);
          color: var(--theme-active-history);
          border-color: var(--theme-active-history);
        }
      }

      .round-btn {
        display: inline-block;
        width: calc(5vh + 1vw);
        height: calc(5vh + 1vw);
        line-height: calc(5vh + 1vw);
        text-align: center;
        font-size: calc(2vh);
        background-color: var(--theme-btn);
        color: var(--theme-text-2);
        border: 1px solid var(--theme-border);
        border-radius: 50%;
        margin-top: 10px;
        margin-left: 10px;
        transition: 0.2s all linear;
      }

      @media (max-width: 339px) and (min-height: 751px) {
        .round-btn {
          width: 5vh;
          height: 5vh;
          line-height: 5vh;
          font-size: calc(1.5vh);
          margin-top: 5px;
          margin-right: 0;
        }

        .functional_btn {
          width: 4vh;
          height: 4vh;
          line-height: 4vh;
          font-size: calc(1.8vh) !important;
        }

        .theme-history {
          width: 4vh !important;
          height: 4vh !important;
          font-size: 2.5vh !important;
          line-height: 4vh !important;
        }

        .bottom {
          margin-top: 2vh;
        }
      }
    }

    .math-panel {
      height: 17vh;
      width: calc(100vw - 20px);

      .row {
        display: flex;
        justify-content: space-between;

        .col {
          width: calc((100vw - 20px - 15px) / 6);
          height: calc((17vh - 9px) / 2);
          line-height: calc((17vh - 9px) / 2);
          margin-bottom: 3px;
          text-align: center;
          font-size: calc(2vh + 0.5vw);
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
      // padding: 3px 0;

      .row {
        display: flex;
        justify-content: space-between;

        .col {
          width: calc((100vw - 20px - 12px) / 5);
          height: calc((42vh - 35px - 15px - 5px) / 4);
          line-height: calc((42vh - 35px - 15px - 5px) / 4);
          margin-bottom: 3px;
          text-align: center;
          font-size: calc(2vh + 0.5vw);
          background-color: var(--theme-main-btn);
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
    font-size: 4vh !important;
  }

  .smaller {
    font-size: 2.5vh !important;
  }

  .spical {
    background-color: var(--theme-spical-btn) !important;
    color: var(--theme-btn) !important;
  }

  .is_solving {
    background-color: var(--theme-isSolving-btn) !important;
    color: var(--theme-btn) !important;
  }
}
</style>
