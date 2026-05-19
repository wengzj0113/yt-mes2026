<template>
  <div class="scale-wrapper" ref="wrapperRef" :style="wrapperStyle">
    <div class="scale-content" :style="contentStyle">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';

const props = defineProps({
  width: { type: Number, default: 1920 },
  height: { type: Number, default: 1080 }
});

const wrapperRef = ref<HTMLElement | null>(null);
const scale = ref(1);

const updateScale = () => {
  if (!wrapperRef.value) return;
  const clientWidth = document.documentElement.clientWidth;
  const clientHeight = document.documentElement.clientHeight;
  const scaleX = clientWidth / props.width;
  const scaleY = clientHeight / props.height;
  scale.value = Math.min(scaleX, scaleY);
};

onMounted(() => {
  updateScale();
  window.addEventListener('resize', updateScale);
});
onUnmounted(() => {
  window.removeEventListener('resize', updateScale);
});

const wrapperStyle = computed(() => ({
  width: '100vw',
  height: '100vh',
  backgroundColor: '#000',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden'
}));

const contentStyle = computed(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
  transform: `scale(${scale.value})`,
  transformOrigin: 'center center',
  transition: 'transform 0.3s'
}));
</script>