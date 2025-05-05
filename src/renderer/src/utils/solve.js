import Decimal from 'decimal.js'
import { Parser } from 'expr-eval'
import { derivative } from 'mathjs'
import { ElMessage } from 'element-plus'

const CALCULATION_ACCURACY = 1e-10 // 计算精度
const DISPLAY_ACCURACY = 9 // 显示小数点位数

export const solveEquationByBisection = (ori_epression, x0, xl, xr) => {
  const f = createParserFunction(ori_epression)

  if (!hasRealSolution(f, x0, xl, xr)) {
    throw new Error('方程在指定范围可能无解')
  }

  try {
    if (xl.length > 0 && xr.length > 0 && Decimal(xl).lt(Decimal(xr))) { // 手动设置区间
      return bisection(f, xl, xr)
    } else { // 根据 x0 自动搜索区间
      const [a, b] = findInitialInterval(f, x0)
      console.log(`根所在区间[${a.toString()}, ${b.toString()}]`)
      return bisection(f, a, b)
    }
  } catch (err) {
    throw err
  }
}

export const solveEquationByHybrid = (ori_epression, x0) => {
  const f = createParserFunction(ori_epression)
  // const fp = createParserDerivative(ori_epression.value)

  try {
    return hybridMethod(f, x0)
  } catch (err) {
    throw err
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

  return hasNegative && hasPositive;
}

// 混合法解一元方程 (牛顿法 + 二分法)
const hybridMethod = (f, x0, fPrime, tol = CALCULATION_ACCURACY, maxIter = 50, timeoutMs = 3000) => {
  let x = new Decimal(x0)
  const df = fPrime || numericalDerivative(f) // 导函数
  const startTime = Date.now()

  for (let i = 0; i < maxIter; i++) {
    // 检查是否超时
    if (Date.now() - startTime > timeoutMs) {
      console.log('牛顿法超时, 改用二分法')
      const [a, b] = findInitialInterval(f, x0)
      return bisection(f, a, b)
    }

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

    // 牛顿迭代法: x = x - f(x)/f'(x)
    x = x.minus(fx.dividedBy(dfx))
  }

  console.log(`达到最大迭代次数 ${maxIter}, 当前解为 ${x}, 使用二分法`)
  ElMessage({
    message: '达到最大迭代次数，使用二分法',
    type: 'info'
  })
  const [a, b] = findInitialInterval(f, x0)
  return bisection(f, a, b)
}

// 二分法求解
const bisection = (f, a, b, tol = CALCULATION_ACCURACY) => {
  let aDec = new Decimal(a)
  let bDec = new Decimal(b)
  const tolDec = new Decimal(tol)

  let fa = f(aDec)
  let fb = f(bDec)

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

// 初始化二分法区间
const findInitialInterval = (f, x0, count = 0, maxAttempts = 20, timeoutMs = 2000) => {
  const x0Dec = new Decimal(x0)
  console.log(count)
  // 基础步长
  const baseStep = new Decimal(0.5)

  const startTime = Date.now()

  // 获取初始动态步长
  let step = getDynamicStep(f, x0Dec, baseStep.dividedBy(count + 1))

  if (count >= maxAttempts) {
    throw new Error(`尝试次数超过[${maxAttempts}]次`)
  }

  // 检查是否超时
  const checkTimeout = () => {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error('区间搜索超时')
    }
  }

  // 扩大搜索范围
  const range = Decimal(2).pow(count)
  const start = x0Dec.minus(range)
  const end = x0Dec.plus(range)

  let a = start
  while (a.plus(step).lte(end)) {
    checkTimeout()

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

// 微分法解释导数
const numericalDerivative = (f, h = 1e-8) => {
  return x => {
    const hDec = new Decimal(h)
    const xDec = new Decimal(x)
    return f(xDec.plus(hDec)).minus(f(xDec.minus(hDec))).dividedBy(2 * hDec)
  }
}

// 将字符串解析为函数表达式
const createParserFunction = (expression) => {
  const parser = new Parser()
  try {
    const expr = parser.parse(expression) // 解析表达式

    // 返回的函数将使用Decimal进行计算
    return (x) => {
      const xDec = new Decimal(x)

      const context = {
        x: xDec,
        π: new Decimal(Math.PI),
        e: new Decimal(Math.E)
      }

      const result = expr.evaluate(context)
      return typeof result === 'number' ? new Decimal(result) : result
    }
  } catch (err) {
    throw new Error('函数表达式有误')
  }
}

// 将字符串解析为函数的导数
const createParserDerivative = (expression) => {
  return createParserFunction(derivative(expression, 'x').toString())
}

/**
 *  测试
 *
 *  𝓍^5 − 3×𝓍^2 + 1   x === −0.561070007 或  0.599241028 或 1.348046941
 *  x^3 - ln(x) - 2   x === 0.135673691 或 1.31497872
 *  5×𝓍−7−3×(2×𝓍^𝑙𝑔(𝓍))+1   x === 3.810429076 或 5.837452074
 *  1 / 𝓍 − 100   x === 0.001
 *  𝓍^3 − 2×𝓍 + 2   x === −1.769292354
 *  (3×𝓍)^0.5 − (𝓍+1)^0.5−2|   x === 8.742640687
 *  (x + 2)/(x - 3) - (2 * x - 1)/(x + 4) - 3/(x^2 + x - 12)   x === −0.152067348 或 13.152067348 (3到6内有两个根解不出)
 *  𝑙𝑔(𝓍+3)/𝑙𝑔(2) + 𝑙𝑔(𝓍−1)/𝑙𝑛(2) − 3   x === 2.965437259
 *  2×(𝑠𝑖𝑛(c𝓍))^2 + 3 × 𝑐𝑜𝑠(𝓍) − 3   x === 0 或 1.047197551 或 5.235987756 或 6.283177724 或 7.330382858 等
 */
