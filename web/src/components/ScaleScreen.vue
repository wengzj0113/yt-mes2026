<template>
  <div class="scale-screen-container" :style="containerStyle">
    <div class="scale-screen-wrapper" :style="wrapperStyle" ref="wrapperRef">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  width: { type: Number, default: 1920 },
  height: { type: Number, default: 1080 },
})

const wrapperRef = ref<HTMLElement | null>(null)
const containerStyle = reactive({
  width: '100vw',
  height: '100vh',
  overflow: 'hidden',
  background: '#030409',
})

const wrapperStyle = reactive({
  width: `${props.width}px`,
  height: `${props.height}px`,
  transform: 'scale(1) translate(-50%, -50%)',
  transformOrigin: '0 0',
  position: 'absolute' as const,
  left: '50%',
  top: '50%',
  transition: 'all 0.3s ease',
})

function handleScale() {
  if (!wrapperRef.value) return
  const ww = window.innerWidth / props.width
  const wh = window.innerHeight / props.height
  const scale = Math.min(ww, wh)
  wrapperStyle.transform = `scale(${scale}) translate(-50%, -50%)`
}

onMounted(() => {
  handleScale()
  window.addEventListener('resize', handleScale)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleScale)
})
</script>

<style scoped>
.scale-screen-container {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
