import { getCounts, getImageData } from './color'

class ImgColorPick {
  /**
   * @param {HTMLImageElement | string} el 图片元素
   */
  constructor(el) {
    this.el = el

    if (typeof el === 'string') {
      this.src = el
    } else {
      this.src = el.getAttribute('src')
    }

    this.isInit = false // 当需要鼠标在图片上取色时，该标识表示是否可以进行取色
    this.isStart = false
  }

  /**
   * 获取图片主色
   * @param {object} options 
   */
  async getImgColor(options) {
    const defaultOptions = {
      ignore: [], // 忽略的色值，rgb格式字符串
      scale: 1, // 默认为1，表示是否取整张图片的色值，取值范围为0-1
      length: 8, // 图片主色返回多少个，默认返回8个

      // rgb色值范围，默认全部色值
      r: [0, 255],
      g: [0, 255],
      b: [0, 255]
    }

    options = { ...defaultOptions, ...options }

    const data = await getImageData(this.src, { scale: options.scale })

    return getCounts(data, options).map((item) => item.color)
  }

  /**
   * 开启鼠标在图片上进行取色
   */
  async start() {
    if (typeof this.el === 'string') {
      throw new Error('el must be a img element')
    }

    if (this.isStart) return
    // 收集img元素信息
    this.imgWidth = this.el.offsetWidth
    this.imgHeight = this.el.offsetHeight
    const { left, top } = this.el.getBoundingClientRect()
    this.imgLeft = left
    this.imgTop = top

    console.log(this.imgLeft, this.imgTop)

    const data = await getImageData(this.src, { scale: 1, imgWidth: this.imgWidth, imgHeight: this.imgHeight })

    // 将颜色像素点分割为rgb
    const colorArr = new Array(this.imgWidth * this.imgHeight)
    let index = 0
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      colorArr[index] = { r, g, b }
      index++
    }

    // 初始化放大镜面板
    this.magnifier = new Magnifier(colorArr, 11, 10, this.imgWidth, this.imgHeight)
    this.magnifier.create()

    window.addEventListener('mousemove', this.handleMouseMove.bind(this))
    this.isStart = true
  }

  /**
   * 关闭鼠标在图片上进行取色
   */
  exit() {
    if (this.magnifier) {
      this.magnifier.destroy()
      this.isStart = false
    }
  }

  handleMouseMove(e) {
    const { clientX, clientY } = e

    const mX = parseInt(clientX - this.imgLeft)
    const mY = parseInt(clientY - this.imgTop)

    // 边界情况
    if (mX < this.imgWidth && mY < this.imgHeight) {
      this.magnifier.show(clientX, clientY, mX, mY)
    } else {
      this.magnifier.hidden()
    }
  }

  static getColor(x, y, imgWidth, imgHeight, colorArray) {
    if (x < 0 || y < 0 || x > imgWidth - 1 || y > imgHeight - 1) return { r: 127, g: 127, b: 127 }
    const index = (y * imgWidth) + x
    return colorArray[index]
  }
}

class Magnifier {
  constructor(colorArr, rectNum, rectSize, imgWidth, imgHeight, zIndex = 100000) {
    this.colorArr = colorArr
    this.rectNum = rectNum
    this.rectSize = rectSize
    this.width = rectNum * rectSize
    this.height = rectNum * rectSize
    this.zIndex = zIndex

    this.imgWidth = imgWidth
    this.imgHeight = imgHeight
  }

  create() {
    if (this.el) return
    const container = document.createElement('div')
    const canvas = document.createElement('canvas')
    canvas.width = this.width
    canvas.height = this.height

    container.style.position = 'absolute'
    container.style.left = 0
    container.style.top = 0
    container.style.zIndex = this.zIndex
    container.style.display = 'none'

    this.magnifierContext = canvas.getContext('2d')

    this.el = container
    container.appendChild(canvas)
    document.body.appendChild(this.el)
  }

  destroy() {
    if (this.el) {
      document.body.removeChild(this.el)
      this.el = null
      this.magnifierContext = null
    }
  }

  show(x, y, mX, mY) {
    this.el.style.display = 'block'
    // 设置位置
    this.el.style.transform = `translate(${x + 25}px, ${y + 25}px)`

    // 画放大镜
    const rectNumHalf = (this.rectNum - 1) / 2
    // 形成11 * 11的矩阵
    for (let y = 0; y < this.rectNum; y++) {
      for (let x = 0; x < this.rectNum; x++) {
        const curX = mX - rectNumHalf + x
        const curY = mY - rectNumHalf + y
        this.magnifierContext.beginPath()
        const colorObj = ImgColorPick.getColor(curX, curY, this.imgWidth, this.imgHeight, this.colorArr)
        this.magnifierContext.fillStyle = `rgb(${colorObj.r}, ${colorObj.g}, ${colorObj.b})`
        // 每个格子10像素
        this.magnifierContext.rect(x * this.rectSize, y * this.rectSize, this.rectSize, this.rectSize)
        this.magnifierContext.fill()
        this.magnifierContext.strokeStyle = '#000'
        this.magnifierContext.lineWidth = '0.1'
        this.magnifierContext.stroke()
      }
    }
    // 后画中心点样式
    this.magnifierContext.lineWidth = '2'
    this.magnifierContext.strokeRect(rectNumHalf * this.rectSize, rectNumHalf * this.rectSize, this.rectSize, this.rectSize)
  }

  hidden() {
    if (this.el) {
      this.el.style.display = 'none'
    }
  }
}

export default ImgColorPick