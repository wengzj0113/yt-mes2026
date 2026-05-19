<template>
  <ScaleScreen>
    <div class="big-screen">
      <!-- Header -->
      <dv-decoration-5 style="width:100%;height:40px;" />
      <div class="header">
        <h1>追溯数据神经中枢</h1>
        <div class="metrics">
          <div class="metric">
            <span>新增追溯电芯</span>
            <dv-digital-flop :config="totalCellsConfig" style="width:120px;height:40px;" />
          </div>
          <div class="metric">
            <span>数据完整率</span>
            <dv-digital-flop :config="coverageConfig" style="width:120px;height:40px;" />
          </div>
          <div class="metric">
            <span>优质品率</span>
            <dv-digital-flop :config="goodRateConfig" style="width:120px;height:40px;" />
          </div>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="main">
        <dv-border-box-11 class="left-panel" title="追溯健康度预警">
          <div class="panel-content">
            <h3 style="margin-top: 50px;">工序流转 WIP</h3>
            <div class="wip-list">
              <div v-for="proc in processes" :key="proc.name" class="wip-item">
                <span>{{ proc.name }}</span>
                <span class="wip-val">{{ proc.wip }}</span>
              </div>
            </div>
          </div>
        </dv-border-box-11>

        <div class="center-panel">
          <!-- graph placeholder for nerve center -->
          <div class="nerve-center-placeholder">
            <h2>13 道工序数据链路流转图</h2>
            <p>正在监听 SSE 实时溯源数据流...</p>
            <dv-decoration-9 style="width:200px;height:200px;margin:auto" />
          </div>
        </div>

        <dv-border-box-11 class="right-panel" title="实时质量成果">
          <div class="panel-content">
            <h3 style="margin-top: 50px;">实时分选结果滚播</h3>
            <dv-scroll-board :config="scrollBoardConfig" style="width:100%;height:400px;margin-top: 20px" />
          </div>
        </dv-border-box-11>
      </div>
    </div>
  </ScaleScreen>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from 'vue';
import ScaleScreen from '@/components/ScaleScreen.vue';

// DataV imports
import { Decoration5 as DvDecoration5, Decoration9 as DvDecoration9, BorderBox11 as DvBorderBox11, DigitalFlop as DvDigitalFlop, ScrollBoard as DvScrollBoard } from '@kjgl77/datav-vue3';

const totalCellsConfig = reactive({ number: [0], content: '{nt}', style: { fill: '#00e5ff', fontSize: 26, fontWeight: 'bold' } });
const coverageConfig = reactive({ number: [0], content: '{nt}%', toFixed: 1, style: { fill: '#00e5ff', fontSize: 26, fontWeight: 'bold' } });
const goodRateConfig = reactive({ number: [0], content: '{nt}%', toFixed: 1, style: { fill: '#00e5ff', fontSize: 26, fontWeight: 'bold' } });

const scrollBoardConfig = reactive({
  header: ['条码', '电压', '内阻', '档位'],
  data: [],
  rowNum: 8,
  headerBGC: 'rgba(0, 229, 255, 0.2)',
  oddRowBGC: 'rgba(15, 19, 37, 0.6)',
  evenRowBGC: 'rgba(23, 28, 51, 0.6)',
  align: ['center', 'center', 'center', 'center'],
  columnWidth: [100, 70, 70, 60]
});

const processes = ref<any[]>([]);

let eventSource: EventSource | null = null;

onMounted(() => {
  eventSource = new EventSource('/api/dashboard/stream');
  eventSource.onmessage = (event) => {
    const res = JSON.parse(event.data);
    totalCellsConfig.number = [res.topMetrics.totalCells];
    coverageConfig.number = [res.topMetrics.coverageRate];
    goodRateConfig.number = [res.topMetrics.goodRate];
    processes.value = res.processes;
    scrollBoardConfig.data = res.sorterLogs;
  };
});

onUnmounted(() => {
  if (eventSource) {
    eventSource.close();
  }
});
</script>

<style scoped>
.big-screen {
  width: 100%;
  height: 100%;
  background-color: #030409;
  background-image: radial-gradient(circle at 50% 50%, #0a1024 0%, #030409 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
}
.header {
  height: 80px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 60px;
}
h1 {
  color: #00e5ff;
  font-size: 32px;
  letter-spacing: 4px;
  text-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
}
.metrics {
  display: flex;
  gap: 60px;
}
.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(0, 229, 255, 0.05);
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid rgba(0, 229, 255, 0.2);
}
.metric span {
  font-size: 16px;
  color: #a3c1e0;
  margin-bottom: 5px;
}
.main {
  flex: 1;
  display: flex;
  padding: 20px 40px;
  gap: 30px;
}
.left-panel, .right-panel {
  width: 450px;
  display: flex;
  flex-direction: column;
}
.panel-content {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}
.center-panel {
  flex: 1;
  border: 1px solid rgba(0, 229, 255, 0.3);
  box-shadow: inset 0 0 30px rgba(0, 229, 255, 0.15);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgwem0xMCAxMGgxMHYxMEgxMHoiIGZpbGw9InJnYmEoMCwyMjksMjU1LDAuMDUpIi8+PC9zdmc+') repeat;
}
.nerve-center-placeholder {
  text-align: center;
}
.nerve-center-placeholder h2 {
  color: #00e5ff;
  font-size: 28px;
  margin-bottom: 20px;
  text-shadow: 0 0 10px rgba(0, 229, 255, 0.8);
}
.nerve-center-placeholder p {
  color: #a3c1e0;
  font-size: 18px;
  margin-bottom: 40px;
}
h3 {
  color: #00e5ff;
  font-size: 20px;
  text-align: center;
}
.wip-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-top: 20px;
}
.wip-item {
  background: rgba(0, 229, 255, 0.1);
  padding: 10px;
  display: flex;
  justify-content: space-between;
  border-left: 4px solid #00e5ff;
}
.wip-item .wip-val {
  color: #00e5ff;
  font-weight: bold;
}
</style>