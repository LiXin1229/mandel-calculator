## 计算功能实现

#### 使用双栈处理运算顺序问题

```
import Decimal from 'decimal.js' // 引入 Decimal 库解决js精度问题

const DISPLAY_ACCURACY = 9 // 结果精度

const priority = { // 定义运算符优先级
  '+': 1, '-': 1,
  '*': 2, '/': 2,
  '^': 3,
  's': 4, 'c': 4, 't': 4, 'n': 4, 'g': 4, 'r': 5,
  'u': 6 // 处理一元负号
}

export const calculate = (expression) => {
  const values = [] // 操作数栈
  const ops = [] // 运算符栈
  let i = 0

  // 比较运算符栈栈顶与新op的优先级
  const processOperation = (op) => {
    while (ops.length > 0 && priority[ops[ops.length - 1]] >= priority[op]) { // 新op低于栈顶时 pop values 后两个值进行计算后重新压入values
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

    // 处理一元负号
    if (ch === '-' && (i === 0 || expression[i - 1] === '(' || ['+', '-', '*', '/', '^'].includes(expression[i-1]))) {
      values.push(Decimal(0))
      ops.push('u') // 相当于在下一次运算时强制进行 0 - 负号后的数
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
    case 'u': return a.minus(b)
    case 's': return Decimal(Math.sin(b.toNumber()))
    case 'c': return Decimal(Math.cos(b.toNumber()))
    case 't': return Decimal(Math.tan(b.toNumber()))
    case 'n': return Decimal(Math.log(b.toNumber()))
    case 'g': return Decimal(Math.log10(b.toNumber()))
    case 'r': return Decimal(decimalToRad(b))
  }
}

// 判断是否是 数字 及 ° ' "
const isNum = (ch) => {
  return (!isNaN(ch) || ['.', '°', '\'', '\"'].includes(ch))
}
```



##### 计算 3 + 5 * 2 - 4

```
expression = '3 + 5 * 2 - 4'
values = [] // 操作数栈
ops = [] // 运算符栈

-> '3'  // 数字直接压入 values
values = ['3']
ops = []

-> '+'  // ops 栈空直接压入 ops
values = ['3']
ops = ['+']

-> '5'  // 数字直接压入 values
values = ['3', '5']
ops = ['+']

-> '*'  // 立即与栈顶 op 进行优先级比较，优先级: '*' > '+'，'*'压入 ops
values = ['3', '5']
ops = ['+', '*']

-> '2' // 数字直接压入 values
values = ['3', '5', '2']
ops = ['+', '*']

-> '-' // 立即与栈顶 op 进行优先级比较，优先级: '-' < '*'，立刻将栈顶 '2','5','*' pop 进行计算
       // 5 * 2 = 10   '10'压入 values
       // '-' 压入 ops
values = ['3', '10']
ops = ['+', '+']

-> '4' // 数字直接压入 values
values = ['3', '10', '4']
ops = ['+', '-']

读取完所有字符，若 ops 非空，
处理剩余运算符：
10 - 4 = 6
values = ['3', '6']
ops = ['+']

处理剩余运算符：
6 + 3 = 9
values = ['9']
ops = []

return values.pop() // 返回 9
```



##### 计算 3 * 5 + 2 * 4

```
expression = '3 * 5 + 2 * 4'
values = []
ops = []

-> '3'
values = ['3']
ops = []

-> '*'
values = ['3']
ops = ['*']

-> '5'
values = ['3', '5']
ops = ['*']

-> '+'  // 立即与栈顶 op 进行优先级比较，优先级: '+' < '*'，立刻将栈顶 '5','3','*' pop 进行计算
       // 3 * 5 = 15   '15'压入 values
       // '+' 压入 ops
values = ['15']
ops = ['+']

-> '2'
values = ['15', '2']
ops = ['+']

-> '*' // 立即与栈顶 op 进行优先级比较，优先级: '*' > '+'，'*'压入 ops
values = ['15', '2']
ops = ['+', '*']

-> '4' // 数字直接压入 values
values = ['15', '2', '4']
ops = ['+', '*']

读取完所有字符，若 ops 非空，
处理剩余运算符：
2 * 4 = 8
values = ['15', '8']
ops = ['+']

处理剩余运算符：
15 + 8 = 23
values = ['23']
ops = []

return values.pop() // 返回 23
```



计算 3 * (5 + 2)

```
expression = '3 * (5 + 2)'
values = []
ops = []

-> '3'
values = ['3']
ops = []

-> '*'
values = ['3']
ops = ['*']

-> '('  // 括号压入 ops
values = ['3']
ops = ['*', '(']

-> '5'
values = ['3', '5']
ops = ['*', '(']

-> '+'
values = ['3', '5']
ops = ['*', '(', '+']

-> '2'
values = ['3', '5', '2']
ops = ['*', '(', '+']

-> ')'  // 将上一个 '(' 后的所有 ops 弹出，对 values 后两位进行计算
        // 5 + 2 = 7
        // '7'压入 values, '('弹出
values = ['3', '7']
ops = ['*']

读取完所有字符，若 ops 非空，
处理剩余运算符：
3 * 7 = 21
values = ['21']
ops = []

return values.pop() // 返回 21
```



#### 处理一元负号

计算 2^ -3，当读取到 '-' 时，如果前面一个字符是 '('  '+', '-', '*', '/', '^' 时视为一元负号，

values.push('0')

ops.push('u')  // 优先级最高

// 2^-3  === 2^(0 - 3)

```
export const calculate = (expression) => {
  // ......
  while (i < expression.length) {
  	// ......
  	// 处理一元负号
    if (ch === '-' && (i === 0 || expression[i - 1] === '(' || ['+', '-', '*', '/',    			'^'].includes(expression[i-1]))) {
       values.push(Decimal(0))
       ops.push('u') // 相当于在下一次运算时强制进行 0 - 负号后的数
       i++
       continue
    }
  	// ......
  }
  // ......
}
```



#### 处理角度值

```
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
  return degrees.times(pi).dividedBy(180).toDecimalPlaces(DISPLAY_ACCURACY + 1)
}
```



## 牛顿法实现

 牛顿法公式:   x = xn − f(xn) / f′(xn)

```
const CALCULATION_ACCURACY = 1e-10 // 计算精度
const DISPLAY_ACCURACY = 9 // 显示小数点位数

export const solveEquationByHybrid = (ori_epression, x0) => {
  const f = createParserFunction(ori_epression) // 将原字符串解析为方程
  return hybridMethod(f, x0)
}

// 牛顿法
const hybridMethod = (f, x0, fPrime, tol = CALCULATION_ACCURACY, maxIter = 50) => {
  let x = new Decimal(x0)
  const df = numericalDerivative(f) // 导函数

  for (let i = 0; i < maxIter; i++) {
    const fx = new Decimal(f(x))

    // 检查是否收敛
    if (fx.abs().lt(tol)) {
      console.log(`在 ${i + 1} 次迭代后收敛`)
      return x.toDecimalPlaces(DISPLAY_ACCURACY).toString()
    }

    const dfx = new Decimal(df(x))

    // 处理导数接近零的情况
    if (dfx.abs().lt(CALCULATION_ACCURACY)) {
      console.log(`在x=${x}处导数接近零, 改用二分法`)
      const [a, b] = findInitialInterval(f, x0)
      return bisection(f, a, b)
    }

    x = x.minus(fx.dividedBy(dfx))
  }

  console.log(`达到最大迭代次数 ${maxIter}, 当前解为 ${x}, 使用二分法`)
  const [a, b] = findInitialInterval(f, x0)
  return bisection(f, a, b)
}

// 求导函数
const numericalDerivative = (f, h = 1e-8) => {
  return x => {
    const hDec = new Decimal(h)
    const xDec = new Decimal(x)
    return f(xDec.plus(hDec)).minus(f(xDec.minus(hDec))).dividedBy(2 * hDec)
  }
}
```



## 二分法实现

```
export const solveEquationByBisection = (ori_epression, x0, xl, xr) => {
  const f = createParserFunction(ori_epression)

  if (!hasRealSolution(f, x0, xl, xr)) {
    throw new Error('方程在指定范围可能无解')
  }
  
  if (xl.length > 0 && xr.length > 0 && Decimal(xl).lt(Decimal(xr))) { // 手动设置区间
    return bisection(f, xl, xr)
  } else { // 根据 x0 自动搜索区间
    const [a, b] = findInitialInterval(f, x0)
    console.log(`根所在区间[${a.toString()}, ${b.toString()}]`)
    return bisection(f, a, b)
  }
}

// 粗略判断是否有解
const hasRealSolution = (f, x0, xl, xr) => {
  const start = xl ? new Decimal(xl) : new Decimal(x0).minus(100)
  const end = xr ? new Decimal(xr) : new Decimal(x0).plus(100)

  const step = end.minus(start).dividedBy(100)
  const testPoints = []

  for (let i = 0; i <= 100; i++) {
    testPoints.push(start.plus(step.times(i)))
  }

  let hasNegative = false
  let hasPositive = false

  for (const x of testPoints) {
    try {
      const y = f(new Decimal(x))

      if (y.abs().lt(new Decimal(1e-10))) return true
      if (y.lt(0)) hasNegative = true
      if (y.gt(0)) hasPositive = true
      if (hasNegative && hasPositive) break
    } catch (e) {
      continue
    }
  }

  return hasNegative && hasPositive
}

// 初始化二分法区间
const findInitialInterval = (f, x0, count = 0, maxAttempts = 20) => {
  const x0Dec = new Decimal(x0)
  // console.log(count)
  // 基础步长
  const baseStep = new Decimal(0.5)

  // 获取初始动态步长
  let step = getDynamicStep(f, x0Dec, baseStep.dividedBy(count + 1))

  if (count >= maxAttempts) {
    throw new Error(`尝试次数超过[${maxAttempts}]次`)
  }

  // 扩大搜索范围
  const range = Decimal(2).pow(count)
  const start = x0Dec.minus(range)
  const end = x0Dec.plus(range)

  let a = start
  while (a.plus(step).lte(end)) {
    const b = a.plus(step)
    const fa = f(a)
    const fb = f(b)

    if (fa.times(fb).lt(0)) return [a, b]
    if (fa.eq(0)) return [a, a]
    if (fb.eq(0)) return [b, b]

    a = b
  }

  return findInitialInterval(f, x0, count + 1)
}

// 根据斜率调整搜索区间步长 (斜率越大, 步长越小)
const getDynamicStep = (f, x, baseStep) => {
  const h = new Decimal(1e-5)
  const derivative = f(x.plus(h)).minus(f(x.minus(h))).dividedBy(2 * h)

  // const slopeSensitivity = new Decimal(1)
  let adjustedStep = baseStep.dividedBy(Decimal.max(derivative.abs()))

  // 限制步长在[1e-4, 10]范围内
  adjustedStep.lt(1e-2) && (adjustedStep = new Decimal(1e-2))
  adjustedStep.gt(10) && (adjustedStep = new Decimal(10))

  console.log('adjustedStep ', adjustedStep.toString())
  return adjustedStep
}

// 二分法求解
const bisection = (f, a, b, tol = CALCULATION_ACCURACY) => {
  let aDec = new Decimal(a)
  let bDec = new Decimal(b)
  const tolDec = new Decimal(tol)

  let fa = f(aDec)
  let fb = f(bDec)

  // 如果端点是根直接返回
  if (fa.eq(0)) return fa.toString()
  if (fb.eq(0)) return fb.toString()

  while (bDec.minus(aDec).abs().gt(tolDec)) {
    const c = aDec.plus(bDec).dividedBy(2)
    const fc = f(c)

    if (fc.eq(0)) return c.toString()
    if (fc.times(fa).lt(0)) {
      bDec = c
      fb = fc
    } else {
      aDec = c
      fa = fc
    }
  }

  return aDec.plus(bDec).dividedBy(2).toDecimalPlaces(DISPLAY_ACCURACY).toString()
}
```

































