<script setup>
import { onMounted, ref } from 'vue'
import ImgColorPick from './components/ImageColorPick'

// const curColor = ref('')
const imgUrl = 'https://img2.baidu.com/it/u=3849054932,2988350768&fm=253&app=120&size=w931&n=0&f=JPEG&fmt=auto?sec=1680022800&t=77f347d9193d5608690cb9de8101471d'
const options = {
  length: 20,
  r: [50, 255],
  g: [50, 255],
  b: [50, 255]
}
let colorPick = null
const imgRef = ref('')
const colorArr = ref([])

onMounted(() => {
  // console.log(imgRef.value)
  colorPick = new ImgColorPick(imgRef.value)
})

const startColorPick = () => {
  colorPick.start()
}

/**
 * 获取图片主色
 */
const getMainColor = () => {
  colorPick.getImgColor(options).then(res => {
    colorArr.value = res
  })
}
</script>

<template>
  <div>
    <button @click="startColorPick">开始取色</button>
    <button @click="getMainColor">获取图片主色</button>
  </div>

  <img :src="imgUrl" ref="imgRef" alt="" />

  <div class="flex-box">
    <div class="color-block" v-for="item in colorArr" :key="item" :style="{ backgroundColor: item }"></div>
  </div>
</template>

<style lang="scss" scoped>
.test-color-box {
  width: 100px;
  height: 100px;
  border: 1px solid #ccc;
}

img {
  width: 500px;
  height: 200px;
}
.flex-box {
  display: flex;
  flex-wrap: wrap;
}
.color-block {
  width: 50px;
  height: 50px;
  margin-bottom: 10px;
  &:not(:last-child) {
    margin-right: 10px;
  }
}
</style>
