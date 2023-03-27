<script setup>
import { ref } from 'vue'
// import testImg from '@/assets/test.png'
import ImageColorPick from '@/components/ImageColorPick/index.vue'

const showPick = ref(false)
const curColor = ref('')
const imgUrl = 'https://img2.baidu.com/it/u=3849054932,2988350768&fm=253&app=120&size=w931&n=0&f=JPEG&fmt=auto?sec=1680022800&t=77f347d9193d5608690cb9de8101471d'

function handleColorSelect (val) {
  curColor.value = val
}
function handleClose () {
  showPick.value = false
}
</script>

<template>
  <div>
    <button @click="showPick = true">取色</button>
    <div class="test-color-box" :style="{ backgroundColor: curColor }"></div>
    <ImageColorPick v-if="showPick" :img-url="imgUrl" @select="handleColorSelect" @close="handleClose" />
  </div>
</template>

<style lang="scss" scoped>
.test-color-box {
  width: 100px;
  height: 100px;
  border: 1px solid #ccc;
}
</style>
