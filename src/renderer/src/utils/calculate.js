import Decimal from 'decimal.js'

const DISPLAY_ACCURACY = 9 // 结果精度

const priority = { // 运算符优先级
  '+': 1, '-': 1,
  '*': 2, '/': 2,
  '^': 3,
  's': 4, 'c': 4, 't': 4, 'n': 4, 'g': 4, 'r': 5 // 函数优先级最高
}

export const calculate = (expression) => {
  const values = [] // 操作数栈
  const ops = [] // 运算符栈
  let i = 0

  // 比较运算符栈栈顶与新op的优先级
  const processOperation = (op) => {
    while (ops.length > 0 && priority[ops[ops.length - 1]] >= priority[op]) { // 新op高于栈顶进行计算
      const b = values.pop()
      const a = values.length > 0 ? values.pop() : Decimal(0)
      values.push(applyOperation(a, b, ops.pop()))
    }
    ops.push(op)
  }

  while (i < expression.length) {
    const ch = expression[i]

    // 跳过空格
    if (ch === ' ') {
      i++
      continue
    }

    // 处理数字
    if (isNum(ch)) {
      let numStr = ''
      while (isNum(expression[i]) && i < expression.length && expression[i] !== ' ') {
        numStr += expression[i++]
      }

      // 处理角度值
      if (isNaN(expression[i - 1])) {
        numStr = handleDegrees(numStr)
      } else {
        // 将字符串转化为 Decimal
        numStr = new Decimal(numStr)
      }

      values.push(numStr)
      continue
    }

    // 处理括号
    if (ch === '(') {
      ops.push(ch)
      i++
      continue
    }

    if (ch === ')') {
      while (ops[ops.length - 1] !== '(') { // 将上个 '(' 后的所有 values 弹出进行计算
        const b = values.pop()
        const a = values.pop()
        values.push(applyOperation(a, b, ops.pop()))
      }
      ops.pop() // 弹出 '('

      // 检查括号前是否是函数
      if (ops.length > 0 && ['s', 'c', 't', 'n', 'g', 'r'].includes(ops[ops.length - 1])) {
        const func = ops.pop()
        const b = values.pop()
        values.push(applyOperation(Decimal(0), b, func))
      }

      i++
      continue
    }

    // 处理运算符和函数
    if (['+', '-', '*', '/', '^'].includes(ch)) {
      processOperation(ch)
      i++
      continue
    }

    // 处理对数函数
    if (['l'].includes(ch)) {
      i++
      continue
    }
    if (['g', 'n'].includes(ch)) {
      ops.push(ch)
      i += 1
      continue
    }

    // 处理三角函数
    if (['s', 'c', 't', 'r'].includes(ch)) {
      ops.push(ch)
      i += 3
      continue
    }

    // 处理特殊常数
    if (ch === 'π' || ch === 'e') {
      values.push(Decimal(ch === 'π' ? Math.PI : Math.E))
      i++
      continue
    }

    throw new Error('非法字符')
  }

  // 处理剩余运算符
  while (ops.length > 0) {
    const b = values.pop()
    const a = values.length > 0 ? values.pop() : Decimal(0)
    values.push(applyOperation(a, b, ops.pop()))
  }

  return values.pop().toDecimalPlaces(DISPLAY_ACCURACY).toString()
}

// 两两运算 或 三角计算
const applyOperation = (a, b, op) => {
  switch (op) {
    case '+': return a.plus(b)
    case '-': return a.minus(b)
    case '*': return a.times(b)
    case '/': return a.dividedBy(b)
    case '^': return a.pow(b)
    case 's': return Decimal(Math.sin(b.toNumber()))
    case 'c': return Decimal(Math.cos(b.toNumber()))
    case 't': return Decimal(Math.tan(b.toNumber()))
    case 'n': return Decimal(Math.log(b.toNumber()))
    case 'g': return Decimal(Math.log10(b.toNumber()))
    case 'r': return Decimal(decimalToRad(b))
  }
}

// 处理角度 (六十进制角度字符串 => 十进制角度值)
const handleDegrees = (numStr) => {
  const degIndex = numStr.indexOf('°')
  const minIndex = numStr.indexOf("'")
  const secIndex = numStr.indexOf('"')

  let degrees = degIndex >= 0 ? new Decimal(numStr.slice(0, degIndex)) : new Decimal(0)
  let minutes = minIndex >= 0 ? new Decimal(numStr.slice(degIndex + 1, minIndex)) : new Decimal(0)
  let seconds = secIndex >= 0 ? new Decimal(numStr.slice(minIndex >= 0 ? minIndex + 1 : degIndex + 1, secIndex)) : new Decimal(0)

  return degrees.plus(minutes.dividedBy(60)).plus(seconds.dividedBy(3600))
}

// 将 ° 转化成 ° ' "
export const decimalToDMS = (decimalDegrees) => {
  const deg = new Decimal(decimalDegrees.replace('°', ''))
  const absDeg = deg.abs()

  const degrees = absDeg.floor()
  const minutesDecimal = absDeg.minus(degrees).times(60)
  const minutes = minutesDecimal.floor()
  const seconds = minutesDecimal.minus(minutes).times(60)

  // 四舍五入 (秒保留1位小数)
  const roundedSeconds = seconds.toDecimalPlaces(1, Decimal.ROUND_HALF_UP)

  let finalMinutes = minutes
  let finalSeconds = roundedSeconds
  if (roundedSeconds.gte(60)) {
    finalMinutes = finalMinutes.plus(1)
    finalSeconds = new Decimal(0)
  }

  let finalDegrees = degrees
  if (finalMinutes.gte(60)) {
    finalDegrees = finalDegrees.plus(1)
    finalMinutes = new Decimal(0)
  }

  finalDegrees = deg.lt(0) ? finalDegrees.neg() : finalDegrees

  let result = `${finalDegrees.toString()}°`
  if (!finalMinutes.eq(0) || !finalSeconds.eq(0)) {
    result += `${finalMinutes.toString()}'`
  }
  if (!finalSeconds.eq(0)) {
    result += `${finalSeconds.toString()}"`
  }

  return result
}

// 将 ° 转化成 弧度
const decimalToRad = (degrees) => {
  const pi = new Decimal(Math.PI)
  return degrees.times(pi).dividedBy(180).toDecimalPlaces(DISPLAY_ACCURACY)
}

// 判断是否是 数字 及 ° ' "
const isNum = (ch) => {
  return (!isNaN(ch) || ch === '.' || ch === '°' || ch === '\'' || ch === '\"')
}

/**
 * 测试
 *  3 + 5 * 2   3 * 5 + 2
 *  4 + (2 - 5 * 3)   4 + (2 * 5 - 3)
 *
 *  (213°58'13' - 24°8'49") / 2 - 90° === 4°54'42"
 *  3*(4+(2*(5-1)/ln(2))) === 46.62468096
 *  sin(π/3)^2 + cos(rad(60))^2 === 1
 *  2^ln(sin(rad(45°))) / e^e === 0.051896271
 *  𝒆^π^π^𝒆 === 448137659378.58781418
 */
