import Decimal from 'decimal.js'

export const calculate = (ori_epression) => {
  let sum = Decimal(0) // 部分结果
  let operator = '+' // 当前的运算符
  const stack = [] // 记录括号

  let i = 0

  while (i < ori_epression.length) {
    const ch = ori_epression[i]

    // console.log('sum ', sum)
    // console.log('stack ', stack)

    // 跳过空格
    if (ch === ' ') {
      i++
      continue
    }

    // 处理四则运算符
    if (['+', '-', '*', '/'].includes(ch)) {
      operator = ch
      i++
      continue
    }

    // 处理乘方
    if (['^'].includes(ch)) {
      operator = ch
      i++
      continue
    }

    // 处理三角运算符
    if (['s', 'c', 't', 'd'].includes(ch)) {
      i += 4 // 跳过 3 个字符, 相当于一起处理了 "(", 可以避免 sin 前面无论如何都是 + 号的问题
      stack.push(sum)
      stack.push(operator)
      // 重置下一部分的运算
      sum = Decimal(0)
      operator = ch
      continue
    }

    // 处理对数函数
    if (['l'].includes(ch)) {
      i++
      continue
    }
    if (['n'].includes(ch)) {
      i += 2
      stack.push(sum)
      stack.push(operator)
      sum = Decimal(0)
      operator = ch
      continue
    } else if (['g'].includes(ch)) {
      i += 2
      stack.push(sum)
      stack.push(operator)
      sum = Decimal(0)
      operator = ch
      continue
    }

    // 处理特殊常数
    if (['π', 'e'].includes(ch)) {
      const constant = ch === 'π' ? Math.PI : Math.E
      sum = operation(sum, operator, constant)
      i++
      continue
    }

    // 处理括号
    if (ch === '(') {
      i++
      stack.push(sum)
      stack.push(operator)
      // 重置下一部分的运算
      sum = Decimal(0)
      operator = '+'
      continue
    }

    if (ch === ')') {
      i++
      const preOperator = stack.pop()
      const preSum = stack.pop()
      sum = operation(preSum, preOperator, sum)
      continue
    }

    // 处理数字
    if (isNum(ch)) {
      let numStr = ''
      // 拼接字符串
      while (isNum(ori_epression[i]) && i < ori_epression.length && ori_epression[i] !== ' ') {
        numStr += ori_epression[i]
        i++
      }

      // 处理角度值
      if (isNaN(ori_epression[i - 1])) {
        numStr = handleDegrees(numStr)
      } else {
        // 将字符串转化为 Decimal
        numStr = new Decimal(numStr)
      }

      sum = operation(sum, operator, numStr)
      continue
    }

    throw new Error('输入错误')
  }

  return sum.toString()
}

const DISPLAY_ACCURACY = 9

const operation = (pre, operator, curr) => {
  switch (operator) {
    case '+':
      return pre.plus(curr).toDecimalPlaces(DISPLAY_ACCURACY)
    case '-':
      return pre.minus(curr).toDecimalPlaces(DISPLAY_ACCURACY)
    case '*':
      return pre.times(curr).toDecimalPlaces(DISPLAY_ACCURACY)
    case '/':
      return pre.dividedBy(curr).toDecimalPlaces(DISPLAY_ACCURACY)
    case '^':
      return pre.pow(curr).toDecimalPlaces(DISPLAY_ACCURACY)
    case 's':
      return pre.plus(Math.sin(curr)).toDecimalPlaces(DISPLAY_ACCURACY)
    case 'c':
      return pre.plus(Math.cos(curr)).toDecimalPlaces(DISPLAY_ACCURACY)
    case 't':
      return pre.plus(Math.tan(curr)).toDecimalPlaces(DISPLAY_ACCURACY)
    case 'n':
      return pre.plus(Math.log(curr)).toDecimalPlaces(DISPLAY_ACCURACY)
    case 'g':
      return pre.plus(Math.log10(curr)).toDecimalPlaces(DISPLAY_ACCURACY)
    case 'd':
      return pre.plus(decimalToRad(curr)).toDecimalPlaces(DISPLAY_ACCURACY)
  }
}

// 处理角度
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
const decimalToRad = (decimalDegrees) => {
  const pi = new Decimal(Math.PI)
  const degrees = new Decimal(decimalDegrees)
  return degrees.times(pi).dividedBy(180).toDecimalPlaces(DISPLAY_ACCURACY).toString()
}

// 判断是否是 数字 及 ° ' "
const isNum = (ch) => {
  return (!isNaN(ch) || ch === '.' || ch === '°' || ch === '\'' || ch === '\"')
}
