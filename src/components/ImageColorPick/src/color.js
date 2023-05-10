/**
 * 获取canvas画笔
 * @param {*} width 
 * @param {*} height 
 */
export const getContext = (width, height) => {
  const canvas = document.createElement('canvas')
  canvas.setAttribute('width', width)
  canvas.setAttribute('height', height)
  return canvas.getContext('2d')
}

/**
 * 获取像素色值数组
 * @param {*} src 
 * @param {*} scale 
 */
export const getImageData = (src, options) => {
  const { scale, imgWidth, imgHeight } = options
  const img = new Image()

  if (!src.startsWith('data')) img.crossOrigin = 'Anonymous'

  return new Promise((resolve, reject) => {
    img.onload = function () {
      const width = imgWidth ? imgWidth * scale : img.width * scale
      const height = imgHeight ? imgHeight * scale : img.height * scale
      const context = getContext(width, height)
      context.drawImage(img, 0, 0, width, height)

      const { data } = context.getImageData(0, 0, width, height)
      resolve(data)
    }

    const errorHandler = () => reject(new Error('An error occurred attempting to load image'))

    img.onerror = errorHandler
    img.onabort = errorHandler
    img.src = src
  })
}

/**
 * 获取图片主色
 * @param {Uint8ClampedArray} data 
 * @param {options} ignore 配置信息
 */
export const getCounts = (data, options) => {
  const { ignore, length, r: rScope, g: gScope, b: bScope } = options

  const countMap = {}

  for (let i = 0; i < data.length; i += 4) {
    let alpha = data[i + 3]

    if (alpha === 0) continue

    let rgbComponents = Array.from(data.subarray(i, i + 3))

    if (rgbComponents.indexOf(undefined) !== -1) continue

    let color = alpha && alpha !== 255
      ? `rgba(${[...rgbComponents, alpha].join(',')})`
      : `rgb(${rgbComponents.join(',')})`

    if (ignore.indexOf(color) !== -1) continue

    if (countMap[color]) {
      countMap[color].count++
    } else {
      countMap[color] = { color, count: 1 }
    }
  }

  // 根据取色范围过滤颜色
  const counts = Object.values(countMap).filter((item) => {
    const color = item.color
    const rgb = color.match(/\d+/g)
    const r = parseInt(rgb[0])
    const g = parseInt(rgb[1])
    const b = parseInt(rgb[2])

    return (r >= rScope[0] && r <= rScope[1]) && (g >= gScope[0] && g <= gScope[1]) && (b >= bScope[0] && b <= bScope[1])
  })

  return counts.sort((a, b) => b.count - a.count).slice(0, length)
}