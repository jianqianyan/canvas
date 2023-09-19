<template>
  <div class="canvas-box">
  </div>
</template>

<script lang="ts" setup>
import { canvasInit, chartOptions } from './canvas';
import { onMounted } from 'vue';

onMounted(() => {
  const canvas = canvasInit('.canvas-box');
  let options: chartOptions = {
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: [150, 230, 224, 218, 135, 147, 260],
        type: 'line'
      }
    ]
  }
  canvas.setOption(options);
})

</script>
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.canvas-box {
  width: 500px;
  height: 350px;
  border: 1px solid #34495e;
}
</style>

