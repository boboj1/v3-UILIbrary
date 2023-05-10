<template>
  <Teleport to="body">
    <div class="img-color-pick" :style="{ zIndex: props.zIndex }" @click="handleMaskClick">
      <div class="mask"></div>
      <div class="img-container" :style="{ zIndex: props.zIndex + 1 }">
        <img
          ref="imgRef"
          class="preview-img"
          :src="props.imgUrl"
          alt=""
          @mouseenter.stop="showPanel = true"
          @mouseleave.stop="showPanel = false"
          @load="handleImgLoad"
          @click.stop="handleImgClick"
        />
      </div>
      <div v-show="showPanel" ref="infoPanel" class="info-panel" :style="{ zIndex: props.zIndex + 2 }">
        <div class="canvas-box">
          <canvas ref="magnifierRef" :width="magnifierRect.width" :height="magnifierRect.height"></canvas>
        </div>
        <div class="cur-color">
          <span class="label" :style="{ backgroundColor: `rgb${rgbText}` }"></span>
          <span>{{ rgbText }}</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
const props = defineProps({
  zIndex: {
    type: Number,
    default: 9999
  },
  imgUrl: {
    type: String,
    default: '',
    required: true
  },
  colorType: {
    type: String,
    default: 'rbg'
  },
  hideOnClickModal: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['close', 'select', 'update:modelValue'])
const imgRef = ref()
const magnifierRef = ref()
const infoPanel = ref()
const imgInit = ref(false)
const curColorObj = ref({ r: 0, g: 0, b: 0 })
const rgbText = computed(() => {
  if (Object.keys(curColorObj.value).length) {
    return `(${curColorObj.value.r}, ${curColorObj.value.g}, ${curColorObj.value.b})`
  }
  return '(0, 0, 0)'
})
const showPanel = ref(false)
const imgRect = {
  width: 0,
  height: 0,
  left: 0,
  top: 0
}
/**
 * 表示11*11的矩阵，用于渲染放大镜
 */
const rectNum = 11
/**
 * 矩阵每个小方格的宽高（px）
 */
const rectSize = 10
/**
 * 放大镜的宽高
 */
const magnifierRect = {
  width: rectNum * rectSize,
  height: rectNum * rectSize
}
/**
 * @type {{ r, g, b }[]}
 */
let colorArray

/**
 * 绘制图片的canvasContext，用于收集像素点的颜色信息
 * @type {CanvasRenderingContext2D}
 */
let canvasContext

/**
 * 放大镜的canvasContext，通过矩阵来绘制放大镜
 * @type {CanvasRenderingContext2D}
 */
let magnifierContext

/**
 * 放大镜的canvas元素
 * @type {HTMLCanvasElement}
 */
let originImgCanvas

/**
 * 收集图片信息
 */
const collectImgRect = () => {
  imgRect.width = imgRef.value.offsetWidth
  imgRect.height = imgRef.value.offsetHeight
  const { left, top } = imgRef.value.getBoundingClientRect()
  imgRect.left = parseInt(left)
  imgRect.top = parseInt(top)
}

/**
 * 初始化canvas画布获取像素点信息
 * @param {Function} callback
 */
const initCanvas = (callback) => {
  const imgObj = new Image()
  imgObj.crossOrigin = 'anonymous'
  originImgCanvas = document.createElement('canvas')
  originImgCanvas.setAttribute('width', imgRect.width)
  originImgCanvas.setAttribute('height', imgRect.height)
  imgObj.onload = () => {
    // 初始化放大镜canvasContext
    magnifierContext = magnifierRef.value.getContext('2d')
    canvasContext = originImgCanvas.getContext('2d')
    canvasContext.drawImage(imgObj, 0, 0, imgRect.width, imgRect.height)
    const imgData = canvasContext.getImageData(0, 0, imgRect.width, imgRect.height)
    callback(imgData)
  }
  imgObj.src = props.imgUrl
}

/**
 * 绘制放大镜
 * @param {number} mX 鼠标在图像x轴坐标
 * @param {number} mY 鼠标在图像y轴坐标
 */
const drawMagnifier = (mX, mY) => {
  const rectNumHalf = (rectNum - 1) / 2
  // 形成11 * 11的矩阵
  for (let y = 0; y < rectNum; y++) {
    for (let x = 0; x < rectNum; x++) {
      const curX = mX - rectNumHalf + x
      const curY = mY - rectNumHalf + y
      magnifierContext.beginPath()
      const colorObj = getColor(curX, curY)
      magnifierContext.fillStyle = `rgb(${colorObj.r}, ${colorObj.g}, ${colorObj.b})`
      // 每个格子10像素
      magnifierContext.rect(x * rectSize, y * rectSize, rectSize, rectSize)
      magnifierContext.fill()
      magnifierContext.strokeStyle = '#000'
      magnifierContext.lineWidth = '0.1'
      magnifierContext.stroke()
    }
  }
  // 后画中心点样式
  magnifierContext.lineWidth = '2'
  magnifierContext.strokeRect(rectNumHalf * rectSize, rectNumHalf * rectSize, rectSize, rectSize)
}

/**
 * 将颜色像素点分割为rgb
 * @param {ImageData} imgData
 */
const splitImgData = ({ data }) => {
  colorArray = new Array(imgRect.width * imgRect.height)
  let index = 0
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    colorArray[index] = { r, g, b }
    index++
  }
}

/**
 * 返回当前坐标的颜色
 * @param {number} x 鼠标距离图片左边距离
 * @param {number} y 鼠标距离图片上边距离
 * @returns {{r: number, g: number, b: number}} {r: number, g: number, b: number}
 */
const getColor = (x, y) => {
  if (x < 0 || y < 0 || x > imgRect.width - 1 || y > imgRect.height - 1) return { r: 127, g: 127, b: 127 }
  const index = (y * imgRect.width) + x
  return colorArray[index]
}

/**
 * 设置放大镜位置
 * @param {number} pageX 鼠标x位置
 * @param {number} pageY 鼠标y位置
 */
const setPanelPosition = (pageX, pageY) => {
  if (showPanel.value) {
    infoPanel.value.style.transform = `translate(${pageX + 25}px, ${pageY + 25}px)`
  }
}

const handleImgLoad = () => {
  collectImgRect()
  initCanvas((imgData) => {
    splitImgData(imgData)
    imgInit.value = true
  })
}

/**
 * @param {MouseEvent} e
 */
const handleMouseMove = (e) => {
  if (!imgInit.value) return
  const { clientX, clientY } = e
  const mX = parseInt(clientX - imgRect.left)
  const mY = parseInt(clientY - imgRect.top)
  // 边界情况
  if (mX < imgRect.width && mY < imgRect.height) {
    curColorObj.value = getColor(mX, mY)
    setPanelPosition(clientX, clientY)
    // 绘制放大镜
    drawMagnifier(mX, mY)
  }
}

const rgbToHex = (r, g, b) => {
  const hex = ((r << 16) | (g << 8) | b).toString(16)
  return '#' + new Array(Math.abs(hex.length - 7)).join('0') + hex
}

const handleMaskClick = () => {
  if (props.hideOnClickModal) {
    emit('close')
  }
}

const handleImgClick = () => {
  const { r, g, b } = curColorObj.value
  let color
  if (props.colorType === 'rbg') {
    color = `rgb(${r}, ${g}, ${b})`
  } else if (props.colorType === 'hex') {
    color = rgbToHex(r, g, b)
  }
  emit('select', color)
  emit('close')
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>

<style lang="scss" scoped>
* {
  box-sizing: border-box;
}
.img-color-pick {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  .mask {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    opacity: .5;
    background: #000;
  }
  .img-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    user-select: none;
    .preview-img {
      max-width: 70%;
      min-width: 400px;
      cursor: crosshair;
    }
  }
  .info-panel {
    position: absolute;
    left: 0;
    top: 0;
    transform: translate(0, 0);
    .canvas-box {
      background-color: #fff;
      border: 1px solid #000;
      padding: 2px;
      canvas {
        display: block;
      }
    }
    .cur-color {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 12px;
      background-color: #000;
      .label {
        width: 10px;
        height: 10px;
        border: 1px solid #fff;
        margin-right: 5px;
      }
    }
  }
}
</style>
